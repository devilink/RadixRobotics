import { describe, expect, it } from "vitest";
import { applicationSchema, MAX_OTHER_FILES, MAX_WORK_IMAGES } from "@/lib/community";

const base = {
  full_name: "Riya Das",
  phone: "+91 98765 43210",
  email: "Riya@Example.test",
  resume: { name: "cv.pdf", type: "application/pdf", size: 120_000 },
  works: [
    { name: "robot.jpg", type: "image/jpeg", size: 900_000 },
    { name: "circuit.png", type: "image/png", size: 400_000 },
  ],
};

describe("community join form", () => {
  it("accepts a resume, several images and no extra files", () => {
    const r = applicationSchema.safeParse(base);
    expect(r.success && r.data.others).toEqual([]);
    expect(r.success && r.data.email).toBe("riya@example.test");
  });

  it("accepts extra documents of many kinds", () => {
    const others = [
      { name: "certificate.pdf", type: "application/pdf", size: 50_000 },
      { name: "report.docx", type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", size: 50_000 },
      { name: "slides.pptx", type: "application/vnd.openxmlformats-officedocument.presentationml.presentation", size: 50_000 },
      { name: "code.zip", type: "application/zip", size: 50_000 },
      { name: "data.csv", type: "text/csv", size: 50_000 },
    ];
    expect(applicationSchema.safeParse({ ...base, others }).success).toBe(true);
  });

  it("enforces limits on images and files", () => {
    const img = { name: "a.jpg", type: "image/jpeg", size: 1000 };
    expect(applicationSchema.safeParse({ ...base, works: [] }).success).toBe(false);
    expect(applicationSchema.safeParse({ ...base, works: Array(MAX_WORK_IMAGES).fill(img) }).success).toBe(true);
    expect(applicationSchema.safeParse({ ...base, works: Array(MAX_WORK_IMAGES + 1).fill(img) }).success).toBe(false);
    const doc = { name: "x.pdf", type: "application/pdf", size: 1000 };
    expect(applicationSchema.safeParse({ ...base, others: Array(MAX_OTHER_FILES + 1).fill(doc) }).success).toBe(false);
    expect(applicationSchema.safeParse({ ...base, others: [{ name: "run.exe", type: "application/x-msdownload", size: 1000 }] }).success).toBe(false);
    expect(applicationSchema.safeParse({ ...base, others: [{ ...doc, size: 11 * 1024 * 1024 }] }).success).toBe(false);
  });
});
