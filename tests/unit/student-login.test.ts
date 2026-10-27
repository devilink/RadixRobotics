import { describe, expect, it } from "vitest";
import { isReservedLoginEmail, studentLoginEmail } from "@/lib/auth/student-login";
import { createUserSchema, studentLoginSchema } from "@/lib/erp/validation";

describe("student username logins", () => {
  it("maps a username to its reserved email", () => {
    expect(studentLoginEmail(" Aarav.STU023 ")).toBe("aarav.stu023@student.radix.school");
  });

  it("reserves school and student login domains", () => {
    expect(isReservedLoginEmail("dps01@radix.school")).toBe(true);
    expect(isReservedLoginEmail("aarav@student.radix.school")).toBe(true);
    expect(isReservedLoginEmail("x@radix.schoolhouse.com")).toBe(false);
    expect(isReservedLoginEmail("me@gmail.com")).toBe(false);
    expect(createUserSchema.shape.email.safeParse("aarav@student.radix.school").success).toBe(false);
  });

  it("validates usernames and passwords", () => {
    const ok = studentLoginSchema.safeParse({ login_username: "Aarav.K_2", login_password: "abcd1234" });
    expect(ok.success && ok.data.login_username).toBe("aarav.k_2");
    for (const login_username of ["ab", ".aarav", "aa rav", "aarav@x", "a".repeat(41)]) {
      expect(studentLoginSchema.safeParse({ login_username, login_password: "abcd1234" }).success).toBe(false);
    }
    expect(studentLoginSchema.safeParse({ login_username: "aarav", login_password: "abcdefgh" }).success).toBe(false);
    expect(studentLoginSchema.safeParse({ login_username: "aarav", login_password: "abc123" }).success).toBe(false);
  });
});
