"use client";

import { ActionForm, ConfirmSubmit, SubmitButton } from "../../_components/forms";
import { Badge, Field, inputClass } from "../../_components/ui";
import { addGuardian, removeGuardian } from "../actions";

export type GuardianRow = { id: string; full_name: string; phone: string | null; email: string | null; relationship: string; is_primary_contact: boolean };

export function Guardians({ studentId, institutionId, guardians, canManage }: {
  studentId: string; institutionId: string; guardians: GuardianRow[]; canManage: boolean;
}) {
  return (
    <>
      {guardians.length === 0 ? (
        <p className="text-sm text-zinc-500">No guardian contacts recorded.</p>
      ) : (
        <ul className="divide-y divide-zinc-800/60">
          {guardians.map((g) => (
            <li key={g.id} className="flex items-start justify-between gap-2 py-2 text-sm">
              <div>
                <p className="font-medium">
                  {g.full_name} <span className="font-normal capitalize text-zinc-500">· {g.relationship}</span>{" "}
                  {g.is_primary_contact && <Badge tone="green">Primary</Badge>}
                </p>
                <p className="text-xs text-zinc-400">{[g.phone, g.email].filter(Boolean).join(" · ") || "No contact details"}</p>
              </div>
              {canManage && (
                <ActionForm action={removeGuardian.bind(null, institutionId)} className="space-y-0">
                  {() => (
                    <>
                      <input type="hidden" name="guardian_id" value={g.id} />
                      <input type="hidden" name="student_membership_id" value={studentId} />
                      <ConfirmSubmit label="Remove" title={`Remove ${g.full_name}?`} confirmLabel="Remove" body="This guardian contact will be deleted." />
                    </>
                  )}
                </ActionForm>
              )}
            </li>
          ))}
        </ul>
      )}
      {canManage && (
        <ActionForm action={addGuardian.bind(null, institutionId)} resetOnSuccess className="mt-4 border-t border-zinc-800/60 pt-4">
          {({ errors }) => (
            <>
              <input type="hidden" name="student_membership_id" value={studentId} />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Guardian name" htmlFor="g-name" error={errors.full_name} required>
                  <input id="g-name" name="full_name" className={inputClass} autoComplete="off" />
                </Field>
                <Field label="Relationship" htmlFor="g-rel" error={errors.relationship}>
                  <select id="g-rel" name="relationship" className={inputClass}>
                    <option value="mother">Mother</option>
                    <option value="father">Father</option>
                    <option value="guardian">Guardian</option>
                    <option value="other">Other</option>
                  </select>
                </Field>
                <Field label="Phone" htmlFor="g-phone" error={errors.phone}>
                  <input id="g-phone" name="phone" type="tel" className={inputClass} autoComplete="off" />
                </Field>
                <Field label="Email" htmlFor="g-email" error={errors.email}>
                  <input id="g-email" name="email" type="email" className={inputClass} autoComplete="off" />
                </Field>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_primary" className="accent-brand-500 h-4 w-4 rounded border-zinc-700" /> Primary contact</label>
                <SubmitButton size="sm">Add guardian</SubmitButton>
              </div>
            </>
          )}
        </ActionForm>
      )}
    </>
  );
}
