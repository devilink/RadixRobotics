"use client";

import { useState } from "react";
import { ActionForm, SubmitButton } from "../../_components/forms";
import { Field, inputClass } from "../../_components/ui";
import { openRegister } from "../actions";

export type PickerInstitution = {
  id: string; name: string; type: string; today: string;
  canStudent: boolean; canStaff: boolean;
  groups: { id: string; name: string }[];
};

export function RegisterPicker({ institutions, defaults }: {
  institutions: PickerInstitution[];
  defaults: { institution?: string; group?: string; date?: string; kind?: string };
}) {
  const [instId, setInstId] = useState(institutions.some((i) => i.id === defaults.institution) ? defaults.institution! : institutions[0]?.id);
  const inst = institutions.find((i) => i.id === instId);
  const kinds = [inst?.canStudent && "student", inst?.canStaff && "staff"].filter(Boolean) as ("student" | "staff")[];
  const [kindPref, setKind] = useState(defaults.kind === "staff" ? "staff" : "student");
  const kind = kinds.includes(kindPref as "student") ? kindPref : kinds[0];
  const groupLabel = inst?.type === "school" ? "Class" : "Batch";

  return (
    <ActionForm action={openRegister}>
      {({ errors }) => (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Field label="Date" htmlFor="date" error={errors.date} required>
              <input id="date" name="date" type="date" required defaultValue={defaults.date ?? inst?.today} max={inst?.today} className={inputClass} />
            </Field>
            <Field label="Institution" htmlFor="institution_id" error={errors.institution_id} required>
              <select id="institution_id" name="institution_id" value={instId} onChange={(e) => setInstId(e.target.value)} className={inputClass}>
                {institutions.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </Field>
            <Field label="Register" htmlFor="kind" error={errors.kind}>
              <select id="kind" name="kind" value={kind} onChange={(e) => setKind(e.target.value)} className={inputClass}>
                {kinds.includes("student") && <option value="student">Students</option>}
                {kinds.includes("staff") && <option value="staff">Teachers & staff</option>}
              </select>
            </Field>
            {kind === "student" ? (
              <Field label={groupLabel} htmlFor="group_id" error={errors.group_id} required>
                <select id="group_id" name="group_id" defaultValue={defaults.group} key={instId} className={inputClass}>
                  {inst?.groups.length ? null : <option value="">No {groupLabel.toLowerCase()}es available</option>}
                  {inst?.groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </Field>
            ) : <div className="hidden lg:block" />}
            <Field label="Period / slot" htmlFor="period" error={errors.period} hint="Optional, for multiple sessions a day.">
              <input id="period" name="period" maxLength={60} placeholder="e.g. Lab period 3" className={inputClass} />
            </Field>
          </div>
          <div className="flex justify-end">
            <SubmitButton pendingLabel="Opening…" disabled={kind === "student" && !inst?.groups.length}>Open register</SubmitButton>
          </div>
        </>
      )}
    </ActionForm>
  );
}
