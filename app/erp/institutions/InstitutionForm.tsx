"use client";

import { ActionForm, SubmitButton } from "../_components/forms";
import { Field, inputClass } from "../_components/ui";
import { WEEKDAYS } from "@/lib/erp/format";
import type { ActionResult } from "@/lib/erp/types";

export type InstitutionValues = {
  code: string; name: string; institution_type: "school" | "learning_center"; status: string; timezone: string;
  email: string | null; phone: string | null; address_line: string | null; city: string | null; state: string | null;
  postal_code: string | null; working_days: number[]; attendance_backdate_days: number; require_correction_approval: boolean;
};

const TIMEZONES = ["Asia/Kolkata", "Asia/Dubai", "Asia/Singapore", "Europe/London", "UTC"];

export function InstitutionForm({ action, initial, isEdit }: {
  action: (prev: ActionResult<unknown> | null, fd: FormData) => Promise<ActionResult<unknown>>;
  initial?: Partial<InstitutionValues>;
  isEdit?: boolean;
}) {
  const v = initial ?? {};
  const days = v.working_days ?? [1, 2, 3, 4, 5, 6];
  return (
    <ActionForm action={action}>
      {({ errors }) => (
        <>
          <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <legend className="sr-only">Basic details</legend>
            <Field label="Institution name" htmlFor="name" error={errors.name} required>
              <input id="name" name="name" defaultValue={v.name} required className={inputClass} aria-invalid={!!errors.name} />
            </Field>
            <Field label="Code" htmlFor="code" error={errors.code} hint="Short unique ID, e.g. SCH-DPS-01" required>
              <input id="code" name="code" defaultValue={v.code} required className={`${inputClass} uppercase`} aria-invalid={!!errors.code} />
            </Field>
            <Field label="Category" htmlFor="institution_type" error={errors.institution_type} hint={isEdit ? "The category cannot be changed after creation." : undefined} required>
              {isEdit ? (
                <>
                  <input type="hidden" name="institution_type" value={v.institution_type} />
                  <input id="institution_type" disabled value={v.institution_type === "school" ? "School" : "Radix Learning Center"} className={inputClass} />
                </>
              ) : (
                <select id="institution_type" name="institution_type" defaultValue={v.institution_type ?? "school"} className={inputClass}>
                  <option value="school">School</option>
                  <option value="learning_center">Radix Learning Center</option>
                </select>
              )}
            </Field>
            <Field label="Status" htmlFor="status" error={errors.status}>
              <select id="status" name="status" defaultValue={v.status ?? "active"} className={inputClass}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>
            </Field>
            <Field label="Email" htmlFor="email" error={errors.email}>
              <input id="email" name="email" type="email" defaultValue={v.email ?? ""} className={inputClass} aria-invalid={!!errors.email} />
            </Field>
            <Field label="Phone" htmlFor="phone" error={errors.phone}>
              <input id="phone" name="phone" type="tel" defaultValue={v.phone ?? ""} className={inputClass} aria-invalid={!!errors.phone} />
            </Field>
            <Field label="Address" htmlFor="address_line" error={errors.address_line}>
              <input id="address_line" name="address_line" defaultValue={v.address_line ?? ""} className={inputClass} />
            </Field>
            <Field label="City" htmlFor="city" error={errors.city}>
              <input id="city" name="city" defaultValue={v.city ?? ""} className={inputClass} />
            </Field>
            <Field label="State" htmlFor="state" error={errors.state}>
              <input id="state" name="state" defaultValue={v.state ?? ""} className={inputClass} />
            </Field>
            <Field label="Postal code" htmlFor="postal_code" error={errors.postal_code}>
              <input id="postal_code" name="postal_code" defaultValue={v.postal_code ?? ""} className={inputClass} />
            </Field>
          </fieldset>

          <fieldset className="grid grid-cols-1 gap-4 border-t border-zinc-800/60 pt-4 sm:grid-cols-2">
            <legend className="mb-2 text-sm font-semibold text-zinc-100">Attendance policy</legend>
            <Field label="Time zone" htmlFor="timezone" error={errors.timezone} hint="Dates and check-in times are recorded in this zone.">
              <select id="timezone" name="timezone" defaultValue={v.timezone ?? "Asia/Kolkata"} className={inputClass}>
                {[...new Set([v.timezone ?? "Asia/Kolkata", ...TIMEZONES])].map((tz) => <option key={tz}>{tz}</option>)}
              </select>
            </Field>
            <Field label="Back-date window (days)" htmlFor="attendance_backdate_days" error={errors.attendance_backdate_days}
              hint="How far back teachers may open or edit registers. Older changes need correction rights.">
              <input id="attendance_backdate_days" name="attendance_backdate_days" type="number" min={0} max={365}
                defaultValue={v.attendance_backdate_days ?? 7} className={inputClass} />
            </Field>
            <div className="sm:col-span-2">
              <p className="mb-1 text-sm font-medium text-zinc-200" id="wd-label">Working days</p>
              <div role="group" aria-labelledby="wd-label" className="flex flex-wrap gap-2">
                {WEEKDAYS.map((d) => (
                  <label key={d.n} className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 px-2.5 py-1.5 text-sm has-[:checked]:border-brand-500/50 has-[:checked]:bg-brand-500/15 has-[:checked]:text-brand-400 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-500 has-[:focus-visible]:ring-offset-2">
                    <input type="checkbox" name="working_days" value={d.n} defaultChecked={days.includes(d.n)} className="accent-brand-500 sr-only" />
                    {d.short}
                  </label>
                ))}
              </div>
              {errors.working_days && <p className="mt-1 text-xs font-medium text-rose-400">{errors.working_days}</p>}
            </div>
            <label className="flex items-start gap-2 text-sm text-zinc-200 sm:col-span-2">
              <input type="checkbox" name="require_correction_approval" defaultChecked={v.require_correction_approval} className="accent-brand-500 mt-0.5 h-4 w-4 rounded border-zinc-700" />
              <span>
                Require approval for every attendance correction
                <span className="block text-xs text-zinc-500">When on, corrections are routed to an approver even for users with correction rights.</span>
              </span>
            </label>
          </fieldset>

          <div className="flex justify-end">
            <SubmitButton>{isEdit ? "Save changes" : "Create institution"}</SubmitButton>
          </div>
        </>
      )}
    </ActionForm>
  );
}
