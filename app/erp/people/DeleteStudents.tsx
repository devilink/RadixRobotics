"use client";

import { useActionState, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { ActionForm, ConfirmSubmit } from "../_components/forms";
import { Notice } from "../_components/ui";
import { deleteStudents } from "./actions";

const RULES = "Students with attendance records cannot be deleted (set their status to Left instead), and students with a portal login need the login removed first.";

/** "Delete student" on a student's own page; goes back to the list when done. */
export function DeleteStudentButton({ membershipId, name }: { membershipId: string; name: string }) {
  return (
    <ActionForm action={deleteStudents} className="space-y-2">
      {() => (
        <>
          <input type="hidden" name="membership_ids" value={membershipId} />
          <input type="hidden" name="return_to_list" value="1" />
          <ConfirmSubmit
            label={<><Trash2 aria-hidden className="h-4 w-4" /> Delete</>}
            size="md"
            title={`Delete ${name}?`}
            confirmLabel="Delete permanently"
            body={<>This permanently removes the student, their class enrolments and guardian contacts. It cannot be undone. {RULES}</>}
          />
        </>
      )}
    </ActionForm>
  );
}

export const BULK_FORM_ID = "bulk-delete-students";

/**
 * Bulk delete for the students list. The row checkboxes live in the
 * server-rendered table and join this form through form={BULK_FORM_ID}.
 */
export function BulkDeleteStudents() {
  const [state, action] = useActionState(deleteStudents, null);
  const [count, setCount] = useState(0);

  // Count ticked rows (they are outside this component, so listen on the document).
  useEffect(() => {
    const update = () =>
      setCount(document.querySelectorAll(`input[form="${BULK_FORM_ID}"][name="membership_ids"]:checked`).length);
    document.addEventListener("change", update);
    update();
    return () => document.removeEventListener("change", update);
  }, [state]);

  return (
    <form id={BULK_FORM_ID} action={action} className="mb-3 space-y-2">
      {state && !state.ok && <Notice tone="error">{state.error}</Notice>}
      {state?.ok && state.message && <Notice tone="success">{state.message}</Notice>}
      {count > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/5 px-3 py-2 text-sm">
          <span className="text-zinc-300">{count} selected</span>
          <ConfirmSubmit
            label={<><Trash2 aria-hidden className="h-4 w-4" /> Delete selected</>}
            title={`Delete ${count} student${count === 1 ? "" : "s"}?`}
            confirmLabel="Delete permanently"
            body={<>The selected students are removed permanently with their enrolments and guardian contacts. This cannot be undone. {RULES}</>}
          />
        </div>
      )}
    </form>
  );
}

/** Header checkbox that ticks every row on the page. */
export function SelectAllStudents() {
  return (
    <input
      type="checkbox"
      aria-label="Select all students on this page"
      className="h-4 w-4 accent-brand-500"
      onChange={(e) => {
        document.querySelectorAll<HTMLInputElement>(`input[form="${BULK_FORM_ID}"][name="membership_ids"]`)
          .forEach((cb) => { cb.checked = e.target.checked; });
        document.dispatchEvent(new Event("change"));
      }}
    />
  );
}
