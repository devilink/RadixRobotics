import { describe, expect, it } from "vitest";
import { cleanNumber, googleSheetCsvUrl, mapTable, normalizeDate, parseCsv } from "@/lib/erp/spreadsheet";
import { parseComponents, prepareInventory, prepareStudents, skuFromName, withDbErrors } from "@/lib/erp/imports";

describe("parseCsv", () => {
  it("handles quotes, escaped quotes, CRLF and a BOM", () => {
    expect(parseCsv('﻿Name,Note\r\n"Rao, Ira","said ""hi"""\r\nKai,\n')).toEqual([
      ["Name", "Note"], ["Rao, Ira", 'said "hi"'], ["Kai", ""],
    ]);
    expect(parseCsv('a,"multi\nline"')).toEqual([["a", "multi\nline"]]);
  });
  it("detects semicolon and tab delimiters (regional Excel exports)", () => {
    expect(parseCsv("SKU;Name;Unit Cost\nA1;Board;\"1,50\"\n")).toEqual([["SKU", "Name", "Unit Cost"], ["A1", "Board", "1,50"]]);
    expect(parseCsv("SKU\tName\nA1\tBoard")).toEqual([["SKU", "Name"], ["A1", "Board"]]);
    expect(parseCsv("Name\nBoard, red")).toEqual([["Name"], ["Board", " red"]]);
  });
});

describe("googleSheetCsvUrl", () => {
  const id = "1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789";
  it("builds CSV export links for share and publish links", () => {
    expect(googleSheetCsvUrl(`https://docs.google.com/spreadsheets/d/${id}/edit#gid=42`))
      .toBe(`https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=42`);
    expect(googleSheetCsvUrl(`https://docs.google.com/spreadsheets/d/${id}/edit?usp=sharing`))
      .toBe(`https://docs.google.com/spreadsheets/d/${id}/export?format=csv`);
    expect(googleSheetCsvUrl(`https://docs.google.com/spreadsheets/d/e/2PACX-${id}/pubhtml`))
      .toBe(`https://docs.google.com/spreadsheets/d/e/2PACX-${id}/pub?output=csv`);
  });
  it("rejects anything that is not a Google Sheets link", () => {
    expect(googleSheetCsvUrl("https://evil.example/spreadsheets/d/" + id)).toBeNull();
    expect(googleSheetCsvUrl("http://docs.google.com/spreadsheets/d/" + id)).toBeNull();
    expect(googleSheetCsvUrl("https://docs.google.com/document/d/" + id)).toBeNull();
    expect(googleSheetCsvUrl("not a url")).toBeNull();
  });
});

describe("cells", () => {
  it("reads day-first and ISO dates and rejects impossible ones", () => {
    expect(normalizeDate("03/04/2026")).toBe("2026-04-03");
    expect(normalizeDate("3-4-26")).toBe("2026-04-03");
    expect(normalizeDate("2026-04-03")).toBe("2026-04-03");
    expect(normalizeDate(new Date(Date.UTC(2026, 3, 3)))).toBe("2026-04-03");
    expect(normalizeDate("31/02/2026")).toBeNull();
    expect(normalizeDate("next week")).toBeNull();
    expect(normalizeDate("")).toBe("");
  });
  it("cleans money", () => {
    expect(cleanNumber("₹1,250.50")).toBe("1250.50");
    expect(cleanNumber("Rs. 45")).toBe("45");
  });
  it("finds the header row below a title row", () => {
    const t = mapTable([["Radix Robotics stock list – Oct 2026"], [], ["S.No", "SKU *", "Item Name"], ["1", "A1", "Board"]],
      [{ key: "sku", label: "SKU", aliases: [] }, { key: "name", label: "Name", aliases: ["item name"] }]);
    expect(t.matched).toEqual(["sku", "name"]);
    expect(t.records.map((r) => [r.row, r.cells.sku])).toEqual([[4, "A1"]]);
  });
  it("matches headers loosely and skips blank rows", () => {
    const t = mapTable([[], ["Roll No.", "Student Name", "Favourite Colour"], ["1", "Ira"], ["", ""], ["2", "Kai"]],
      [{ key: "code", label: "Roll No", aliases: [] }, { key: "name", label: "Name", aliases: ["student name"], required: true }]);
    expect(t.records.map((r) => [r.row, r.cells.code, r.cells.name])).toEqual([[3, "1", "Ira"], [5, "2", "Kai"]]);
    expect(t.ignored).toEqual(["Favourite Colour"]);
    expect(t.missing).toEqual([]);
  });
});

describe("prepareStudents", () => {
  it("splits names, generates roll numbers and infers guardian relationship", () => {
    const p = prepareStudents([
      ["Student Name", "Roll Number", "Class", "Father's Name", "Parent Mobile", "Admission Date"],
      ["Aarav Kumar Sharma", "", "Grade 6 - A", "Raj Sharma", 9876543210, "01/04/2026"],
    ]);
    expect(p.fatal).toBeUndefined();
    expect(p.preview.rows[0].errors).toEqual([]);
    expect(p.payload[0]).toMatchObject({
      row: 2, first_name: "Aarav", last_name: "Kumar Sharma", group: "Grade 6 - A",
      guardian_name: "Raj Sharma", guardian_relationship: "father", guardian_phone: "9876543210", admission_date: "2026-04-01",
    });
    expect(p.payload[0].member_code).toMatch(/^STU-[A-Z2-9]{6}$/);
  });
  it("flags bad cells and repeated roll numbers per row", () => {
    const p = prepareStudents([
      ["Name", "Roll No", "Email", "Admission Date", "Relationship"],
      ["Ira", "A-1", "not-an-email", "32/01/2026", "cousin"],
      ["Kai", "a-1", "", "", ""],
      ["", "A-2", "", "", ""],
    ]);
    expect(p.preview.rows[0].errors).toEqual([
      "Email is not valid", "Admission Date is not a valid date (use DD/MM/YYYY)", "Relationship must be Mother, Father, Guardian or Other",
    ]);
    expect(p.preview.rows[1].errors).toEqual(["Roll No A-1 is repeated (also on row 2)"]);
    expect(p.preview.rows[2].errors).toEqual(["Name is missing"]);
  });
  it("needs a name column", () => {
    expect(prepareStudents([["Roll No"], ["1"]]).fatal).toMatch(/name column/);
  });
});

describe("prepareInventory", () => {
  it("reads items, kits and component lists", () => {
    const p = prepareInventory([
      ["Item Code", "Item Name", "Qty", "Price", "Kit Components"],
      ["mcu-uno", "Arduino Uno", "40", "₹450", ""],
      ["KIT-1", "Starter kit", "", "", "MCU-UNO x1; 2 x SEN-1"],
    ]);
    expect(p.preview.rows.every((r) => r.errors.length === 0)).toBe(true);
    expect(p.payload[0]).toMatchObject({ sku: "MCU-UNO", quantity: "40", unit_cost: "450", kind: "" });
    expect(p.payload[1]).toMatchObject({ kind: "kit", components: [{ sku: "MCU-UNO", quantity: 1 }, { sku: "SEN-1", quantity: 2 }] });
  });
  it("needs a SKU or Name column and says which columns it found", () => {
    expect(prepareInventory([["Qty", "Price"], ["1", "2"]]).fatal).toBe("No “SKU” or “Name” column found. Columns found: Qty, Price.");
    // A row that was never split into columns gets a hint about the file format.
    expect(prepareInventory([["SKU|Qty"], ["X|1"]]).fatal).toMatch(/Columns found: SKU\|Qty/);
    expect(prepareInventory([["Item;Qty"], ["X;1"]]).fatal).toMatch(/Only one column was found/);
  });

  it("makes SKUs from names when the sheet has none", () => {
    const p = prepareInventory([["Item Name", "Qty"], ["Arduino Uno R3", "5"], ["HC-SR04 Ultrasonic Sensor", "10"]]);
    expect(p.payload.map((x) => x.sku)).toEqual(["ARDUINO-UNO-R3", "HC-SR04-ULTRASONIC-SENSOR"]);
    expect(p.preview.rows[0].cells[0]).toBe("ARDUINO-UNO-R3 (auto)");
    expect(skuFromName("Résistance 220Ω")).toBe("RESISTANCE-220");
    expect(skuFromName("Ω")).toBe("");
  });

  it("validates numbers", () => {
    const p = prepareInventory([["SKU", "Quantity", "Type"], ["A1", "-3", "gadget"], ["A1", "1.5", ""]]);
    expect(p.preview.rows[0].errors).toEqual(["Type must be Component or Kit", "Quantity must be a whole number from 0 to 10,00,000"]);
    expect(p.preview.rows[1].errors).toContain("SKU A1 is repeated (also on row 2)");
  });
  it("parses component lists", () => {
    expect(parseComponents("RES-220*10, MOT-1:2\nLED-RED").items).toEqual([
      { sku: "RES-220", quantity: 10 }, { sku: "MOT-1", quantity: 2 }, { sku: "LED-RED", quantity: 1 },
    ]);
    expect(parseComponents("bad sku x2").error).toBeDefined();
  });
  it("merges database errors into the preview", () => {
    const p = prepareInventory([["SKU"], ["A1"], ["B2"]]);
    const merged = withDbErrors(p.preview, [{ row: 3, message: "This SKU already exists" }]);
    expect(merged.invalid).toBe(1);
    expect(merged.rows[1].errors).toEqual(["This SKU already exists"]);
  });
});
