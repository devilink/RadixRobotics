"use client";

import { ActionForm, SubmitButton } from "../../_components/forms";
import { Field, inputClass } from "../../_components/ui";
import { enrollStudents } from "../../groups/actions";

/** Add this student to a class or batch, from the student's own page. */
export function EnrollInGroup({ membershipId, institutionId, groups }: {
  membershipId: string; institutionId: string; groups: { id: string; name: string }[];
}) {
  if (groups.length === 0) {
    return <p className="mt-3 text-xs text-zinc-500">No other active classes or batches to add this student to.</p>;
  }
  return (
    <ActionForm action={enrollStudents} className="mt-4 border-t border-zinc-800/60 pt-3">
      {({ errors }) => (
        <>
          <input type="hidden" name="membership_ids" value={membershipId} />
          <input type="hidden" name="institution_id" value={institutionId} />
          <Field label="Add to a class / batch" htmlFor="enrol-group" error={errors.group_id ?? errors.membership_ids}>
            <div className="flex gap-2">
              <select id="enrol-group" name="group_id" required defaultValue="" className={inputClass}>
                <option value="" disabled>Choose…</option>
                {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
              <SubmitButton>Add</SubmitButton>
            </div>
          </Field>
        </>
      )}
    </ActionForm>
  );
}
