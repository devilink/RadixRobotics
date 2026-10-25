"use client";

import { ActionForm, ConfirmSubmit, SubmitButton } from "../../_components/forms";
import { Field, inputClass } from "../../_components/ui";
import { LEAVE_TYPES } from "@/lib/erp/types";
import { cancelLeave, requestLeave } from "../actions";

export function LeaveRequestForm({ memberships }: { memberships: { id: string; label: string }[] }) {
  return (
    <ActionForm action={requestLeave} resetOnSuccess>
      {({ errors }) => (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {memberships.length > 1 ? (
              <Field label="For" htmlFor="membership_id" error={errors.membership_id} required>
                <select id="membership_id" name="membership_id" className={inputClass}>
                  {memberships.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
                </select>
              </Field>
            ) : (
              <input type="hidden" name="membership_id" value={memberships[0].id} />
            )}
            <Field label="Leave type" htmlFor="leave_type" error={errors.leave_type} required>
              <select id="leave_type" name="leave_type" className={`${inputClass} capitalize`}>
                {LEAVE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="From" htmlFor="start_date" error={errors.start_date} required>
              <input id="start_date" name="start_date" type="date" required className={inputClass} />
            </Field>
            <Field label="To" htmlFor="end_date" error={errors.end_date} required>
              <input id="end_date" name="end_date" type="date" required className={inputClass} />
            </Field>
          </div>
          <Field label="Reason" htmlFor="reason" error={errors.reason} required>
            <textarea id="reason" name="reason" rows={2} maxLength={500} required className={inputClass} />
          </Field>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="half_day" className="accent-brand-500 h-4 w-4 rounded border-zinc-700" /> Half day
            </label>
            {errors.half_day && <p className="text-xs font-medium text-rose-400">{errors.half_day}</p>}
            <SubmitButton>Submit request</SubmitButton>
          </div>
        </>
      )}
    </ActionForm>
  );
}

export function CancelLeaveButton({ id }: { id: string }) {
  return (
    <ActionForm action={cancelLeave} className="space-y-0">
      {() => (
        <>
          <input type="hidden" name="id" value={id} />
          <ConfirmSubmit label="Cancel" title="Cancel this leave request?" confirmLabel="Cancel request" body="Your approver will see it as cancelled." />
        </>
      )}
    </ActionForm>
  );
}
