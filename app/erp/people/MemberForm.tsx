"use client";

import { useRef, useState } from "react";
import { MEMBER_TYPE_LABELS, MEMBER_TYPES_BY_INSTITUTION, type InstitutionType, type MemberType } from "@/lib/erp/types";
import type { ActionResult } from "@/lib/erp/types";
import { ActionForm, SubmitButton } from "../_components/forms";
import { buttonClass, Field, inputClass } from "../_components/ui";
import { LoginCredentials } from "./LoginCredentials";
import type { StudentLoginResult } from "./actions";

export type InstitutionChoice = {
  id: string; name: string; institution_type: InstitutionType;
  campuses: { id: string; name: string }[];
  shifts: { id: string; name: string }[];
  canStudents: boolean; canStaff: boolean;
  /** May create logins here (users.manage). */
  canLogins: boolean;
  /** The curriculum-portal school or center this institution came from, if any. */
  legacy_school_id: string | null;
};

const slug = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "");

function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint32Array(10));
  return Array.from(bytes, (b) => chars[b % chars.length]).join("") + (bytes[0] % 10);
}

export type MemberValues = {
  membership_id: string; member_type: MemberType; institution_id: string;
  first_name: string; last_name: string; member_code: string; email: string | null; phone: string | null;
  campus_id: string | null; status: string; end_date: string | null;
  registration_number: string | null; admission_date: string | null;
  department: string | null; position: string | null; employment_type: string | null; shift_id: string | null;
};

export function MemberForm({ action, institutions, mode, defaultInstitution, defaultKind, initial, showHr = true }: {
  action: (prev: ActionResult<unknown> | null, fd: FormData) => Promise<ActionResult<unknown>>;
  institutions: InstitutionChoice[];
  mode: "create" | "edit";
  defaultInstitution?: string;
  defaultKind?: "student" | "staff";
  initial?: MemberValues;
  showHr?: boolean;
}) {
  const initialInst = initial?.institution_id ?? (institutions.some((i) => i.id === defaultInstitution) ? defaultInstitution! : institutions[0]?.id);
  const [instId, setInstId] = useState(initialInst);
  const inst = institutions.find((i) => i.id === instId);
  const allowedTypes = (inst ? MEMBER_TYPES_BY_INSTITUTION[inst.institution_type] : []).filter((t) =>
    t === "student" ? inst?.canStudents : inst?.canStaff
  );
  const preferred = initial?.member_type ?? (defaultKind === "student" ? "student" : allowedTypes.find((t) => t !== "student"));
  const [memberType, setMemberType] = useState<MemberType | undefined>(preferred);
  const type = mode === "edit" ? initial?.member_type : allowedTypes.includes(memberType as MemberType) ? memberType : allowedTypes[0];
  const isStudent = type === "student";
  const v = initial;
  const formRef = useRef<HTMLDivElement>(null);
  const [loginOn, setLoginOn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const offerLogin = mode === "create" && isStudent && !!inst?.canLogins;

  // e.g. "aarav.stu023": first name + student ID, editable before saving.
  const suggestUsername = () => {
    const el = formRef.current;
    const first = slug((el?.querySelector<HTMLInputElement>("#first_name")?.value ?? "").split(/\s+/)[0] ?? "");
    const code = slug(el?.querySelector<HTMLInputElement>("#member_code")?.value ?? "");
    setUsername([first, code].filter(Boolean).join(".").slice(0, 40));
  };
  const toggleLogin = (on: boolean) => {
    setLoginOn(on);
    if (on && !username) suggestUsername();
    if (on && !password) setPassword(generatePassword());
  };

  return (
    <ActionForm action={action}>
      {({ errors, result }) => result?.ok && result.data ? (
        <LoginCredentials login={result.data as StudentLoginResult} institutionId={instId ?? ""} />
      ) : (
        <div ref={formRef} className="space-y-4">
          {v && <input type="hidden" name="membership_id" value={v.membership_id} />}
          <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <legend className="sr-only">Membership</legend>
            {mode === "create" ? (
              <>
                <Field label="Institution" htmlFor="institution_id" error={errors.institution_id} required>
                  <select id="institution_id" name="institution_id" value={instId} onChange={(e) => setInstId(e.target.value)} className={inputClass}>
                    {institutions.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                </Field>
                <Field label="Person type" htmlFor="member_type" error={errors.member_type} required>
                  <select id="member_type" name="member_type" value={type} onChange={(e) => setMemberType(e.target.value as MemberType)} className={inputClass}>
                    {allowedTypes.map((t) => <option key={t} value={t}>{MEMBER_TYPE_LABELS[t]}</option>)}
                  </select>
                </Field>
              </>
            ) : (
              <Field label="Status" htmlFor="status" error={errors.status} hint="Leaving or graduating sets an end date and removes them from future registers.">
                <select id="status" name="status" defaultValue={v?.status} className={inputClass}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="graduated">Graduated</option>
                  <option value="left">Left</option>
                </select>
              </Field>
            )}
            <Field label={isStudent ? "Student ID" : "Employee / staff ID"} htmlFor="member_code" error={errors.member_code} required
              hint="Unique within this institution.">
              <input id="member_code" name="member_code" defaultValue={v?.member_code} required className={`${inputClass} uppercase`} aria-invalid={!!errors.member_code} />
            </Field>
            <Field label="First name" htmlFor="first_name" error={errors.first_name} required>
              <input id="first_name" name="first_name" defaultValue={v?.first_name} required autoComplete="off" className={inputClass} aria-invalid={!!errors.first_name} />
            </Field>
            <Field label="Last name" htmlFor="last_name" error={errors.last_name}>
              <input id="last_name" name="last_name" defaultValue={v?.last_name} autoComplete="off" className={inputClass} />
            </Field>
            <Field label="Email" htmlFor="email" error={errors.email} hint={isStudent ? "Optional. For minors, prefer a guardian contact instead." : undefined}>
              <input id="email" name="email" type="email" defaultValue={v?.email ?? ""} autoComplete="off" className={inputClass} aria-invalid={!!errors.email} />
            </Field>
            <Field label="Phone" htmlFor="phone" error={errors.phone}>
              <input id="phone" name="phone" type="tel" defaultValue={v?.phone ?? ""} autoComplete="off" className={inputClass} aria-invalid={!!errors.phone} />
            </Field>
            {inst && inst.campuses.length > 1 && (
              <Field label="Campus" htmlFor="campus_id" error={errors.campus_id}>
                <select id="campus_id" name="campus_id" defaultValue={v?.campus_id ?? ""} className={inputClass}>
                  <option value="">—</option>
                  {inst.campuses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
            )}
            {mode === "create" ? (
              <Field label="Start date" htmlFor="start_date" error={errors.start_date} hint="Defaults to today.">
                <input id="start_date" name="start_date" type="date" className={inputClass} />
              </Field>
            ) : (
              <Field label="End date" htmlFor="end_date" error={errors.end_date}>
                <input id="end_date" name="end_date" type="date" defaultValue={v?.end_date ?? ""} className={inputClass} />
              </Field>
            )}
          </fieldset>

          {isStudent ? (
            <fieldset className="grid grid-cols-1 gap-4 border-t border-zinc-800/60 pt-4 sm:grid-cols-2">
              <legend className="mb-2 text-sm font-semibold text-zinc-100">Student details</legend>
              <Field label="Registration number" htmlFor="registration_number" error={errors.registration_number}>
                <input id="registration_number" name="registration_number" defaultValue={v?.registration_number ?? ""} className={inputClass} />
              </Field>
              <Field label="Admission date" htmlFor="admission_date" error={errors.admission_date}>
                <input id="admission_date" name="admission_date" type="date" defaultValue={v?.admission_date ?? ""} className={inputClass} />
              </Field>
            </fieldset>
          ) : showHr ? (
            <fieldset className="grid grid-cols-1 gap-4 border-t border-zinc-800/60 pt-4 sm:grid-cols-2">
              <legend className="mb-2 text-sm font-semibold text-zinc-100">Employment</legend>
              <Field label="Department" htmlFor="department" error={errors.department}>
                <input id="department" name="department" defaultValue={v?.department ?? ""} className={inputClass} />
              </Field>
              <Field label="Position" htmlFor="position" error={errors.position}>
                <input id="position" name="position" defaultValue={v?.position ?? ""} className={inputClass} />
              </Field>
              <Field label="Employment type" htmlFor="employment_type" error={errors.employment_type}>
                <select id="employment_type" name="employment_type" defaultValue={v?.employment_type ?? ""} className={inputClass}>
                  <option value="">—</option>
                  <option value="full_time">Full-time</option>
                  <option value="part_time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="intern">Intern</option>
                  <option value="volunteer">Volunteer</option>
                </select>
              </Field>
              <Field label="Work shift" htmlFor="shift_id" error={errors.shift_id} hint={inst?.shifts.length ? undefined : "Define shifts on the institution page."}>
                <select id="shift_id" name="shift_id" defaultValue={v?.shift_id ?? ""} className={inputClass} disabled={!inst?.shifts.length}>
                  <option value="">—</option>
                  {inst?.shifts.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </Field>
            </fieldset>
          ) : null}

          {offerLogin && (
            <fieldset className="space-y-4 border-t border-zinc-800/60 pt-4">
              <legend className="sr-only">Student login</legend>
              <label className="flex items-start gap-3">
                <input type="checkbox" name="create_login" checked={loginOn} onChange={(e) => toggleLogin(e.target.checked)} className="mt-0.5 h-4 w-4 accent-brand-500" />
                <span>
                  <span className="block text-sm font-semibold text-zinc-100">Create a login for this student</span>
                  <span className="block text-xs text-zinc-500">
                    They sign in with a username and password, no email needed.
                    {inst?.legacy_school_id ? ` The login opens ${inst.name}'s curriculum.` : " This institution has no curriculum school yet, so the login opens their ERP page only."}
                  </span>
                </span>
              </label>
              {loginOn && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Username" htmlFor="login_username" error={errors.login_username} required hint="Letters, numbers, . _ - Must be unique.">
                    <div className="flex gap-2">
                      <input id="login_username" name="login_username" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())}
                        required autoComplete="off" autoCapitalize="none" spellCheck={false} className={`${inputClass} font-mono`} aria-invalid={!!errors.login_username} />
                      <button type="button" onClick={suggestUsername} className={buttonClass("secondary", "sm")}>Suggest</button>
                    </div>
                  </Field>
                  <Field label="Password" htmlFor="login_password" error={errors.login_password} required hint="At least 8 characters with a letter and a number.">
                    <div className="flex gap-2">
                      <input id="login_password" name="login_password" value={password} onChange={(e) => setPassword(e.target.value)}
                        required autoComplete="new-password" spellCheck={false} className={`${inputClass} font-mono`} aria-invalid={!!errors.login_password} />
                      <button type="button" onClick={() => setPassword(generatePassword())} className={buttonClass("secondary", "sm")}>Generate</button>
                    </div>
                  </Field>
                </div>
              )}
            </fieldset>
          )}

          <div className="flex justify-end">
            <SubmitButton>{mode === "create" ? (loginOn && offerLogin ? "Create student and login" : "Create record") : "Save changes"}</SubmitButton>
          </div>
        </div>
      )}
    </ActionForm>
  );
}
