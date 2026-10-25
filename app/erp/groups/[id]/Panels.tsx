"use client";

import { useMemo, useState } from "react";
import { ActionForm, ConfirmSubmit, SubmitButton } from "../../_components/forms";
import { inputClass } from "../../_components/ui";
import { assignStaff, endEnrollment, enrollStudents, removeAssignment } from "../actions";

type Candidate = { id: string; name: string; code: string };

/** Searchable multi-select of candidates, submitted as membership_ids[]. */
function CandidatePicker({ candidates, label }: { candidates: Candidate[]; label: string }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? candidates.filter((c) => c.name.toLowerCase().includes(s) || c.code.toLowerCase().includes(s)) : candidates;
  }, [q, candidates]);
  return (
    <div>
      <label htmlFor={`${label}-search`} className="mb-1 block text-sm font-medium text-zinc-200">{label}</label>
      <input id={`${label}-search`} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by name or ID" className={inputClass} />
      <fieldset className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-zinc-800">
        <legend className="sr-only">{label}</legend>
        {filtered.length === 0 && <p className="p-3 text-sm text-zinc-500">No matches.</p>}
        {filtered.map((c) => (
          <label key={c.id} className="flex cursor-pointer items-center gap-2 border-b border-zinc-800/60 px-3 py-2 text-sm last:border-0 hover:bg-zinc-800/40">
            <input type="checkbox" name="membership_ids" value={c.id} className="accent-brand-500 h-4 w-4 rounded border-zinc-700" />
            <span>{c.name}</span>
            <span className="ml-auto font-mono text-xs text-zinc-500">{c.code}</span>
          </label>
        ))}
      </fieldset>
    </div>
  );
}

export function EnrollPanel({ groupId, institutionId, candidates }: { groupId: string; institutionId: string; candidates: Candidate[] }) {
  if (candidates.length === 0) return <p className="mt-4 text-sm text-zinc-500">All active students at this institution are already enrolled.</p>;
  return (
    <ActionForm action={enrollStudents} resetOnSuccess className="mt-4 border-t border-zinc-800/60 pt-4">
      {({ errors }) => (
        <>
          <input type="hidden" name="group_id" value={groupId} />
          <input type="hidden" name="institution_id" value={institutionId} />
          <CandidatePicker candidates={candidates} label="Enrol students" />
          {errors.membership_ids && <p className="text-xs font-medium text-rose-400">{errors.membership_ids}</p>}
          <div className="flex justify-end"><SubmitButton size="sm">Enrol selected</SubmitButton></div>
        </>
      )}
    </ActionForm>
  );
}

export function AssignPanel({ groupId, institutionId, candidates }: { groupId: string; institutionId: string; candidates: Candidate[] }) {
  if (candidates.length === 0) return <p className="mt-4 text-sm text-zinc-500">No other teachers or instructors are available at this institution.</p>;
  return (
    <ActionForm action={assignStaff} resetOnSuccess className="mt-4 border-t border-zinc-800/60 pt-4">
      {({ errors }) => (
        <>
          <input type="hidden" name="group_id" value={groupId} />
          <input type="hidden" name="institution_id" value={institutionId} />
          <CandidatePicker candidates={candidates} label="Assign teachers or instructors" />
          {errors.membership_ids && <p className="text-xs font-medium text-rose-400">{errors.membership_ids}</p>}
          <div className="flex items-center justify-end gap-2">
            <label htmlFor="assignment_role" className="text-sm text-zinc-300">Role</label>
            <select id="assignment_role" name="assignment_role" className={`${inputClass} w-auto`}>
              <option value="lead">Lead</option>
              <option value="assistant">Assistant</option>
            </select>
            <SubmitButton size="sm">Assign</SubmitButton>
          </div>
        </>
      )}
    </ActionForm>
  );
}

export function UnenrollButton({ enrollmentId, groupId, institutionId, name }: { enrollmentId: string; groupId: string; institutionId: string; name: string }) {
  return (
    <ActionForm action={endEnrollment} className="space-y-0">
      {() => (
        <>
          <input type="hidden" name="enrollment_id" value={enrollmentId} />
          <input type="hidden" name="group_id" value={groupId} />
          <input type="hidden" name="institution_id" value={institutionId} />
          <ConfirmSubmit label="Remove" title={`Remove ${name}?`} confirmLabel="Remove from group"
            body="The enrolment ends today. Past attendance is kept and still appears in reports." />
        </>
      )}
    </ActionForm>
  );
}

export function UnassignButton({ assignmentId, groupId, institutionId, name }: { assignmentId: string; groupId: string; institutionId: string; name: string }) {
  return (
    <ActionForm action={removeAssignment} className="space-y-0">
      {() => (
        <>
          <input type="hidden" name="assignment_id" value={assignmentId} />
          <input type="hidden" name="group_id" value={groupId} />
          <input type="hidden" name="institution_id" value={institutionId} />
          <ConfirmSubmit label="Remove" title={`Unassign ${name}?`} confirmLabel="Unassign"
            body="They will no longer be able to take this group's register." />
        </>
      )}
    </ActionForm>
  );
}
