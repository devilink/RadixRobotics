// Student logins created by staff use a username instead of an email. Supabase Auth
// still needs an email, so each username maps to an address on a reserved domain
// that nobody can register or receive mail at.

export const STUDENT_LOGIN_DOMAIN = "student.radix.school";

export const STUDENT_USERNAME_RE = /^[a-z0-9][a-z0-9._-]{2,39}$/;

export function studentLoginEmail(username: string) {
  return `${username.trim().toLowerCase()}@${STUDENT_LOGIN_DOMAIN}`;
}

/** School logins (@radix.school) and student usernames (@student.radix.school) are created by staff only. */
export function isReservedLoginEmail(email: string) {
  return /(@|\.)radix\.school$/i.test(email.trim());
}
