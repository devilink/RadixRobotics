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

  it("lets admins create a student account with a username and an optional contact email", () => {
    const base = { full_name: "Aarav K", password: "longenough1", role_key: "student" };
    const noEmail = createUserSchema.safeParse({ ...base, username: "Aarav.K", email: "" });
    expect(noEmail.success && noEmail.data).toMatchObject({ username: "aarav.k", email: undefined });
    const withEmail = createUserSchema.safeParse({ ...base, username: "aarav.k", email: "Parent@Example.test" });
    expect(withEmail.success && withEmail.data.email).toBe("parent@example.test");
    expect(createUserSchema.safeParse({ ...base, username: "a b" }).success).toBe(false);
  });
});
