"use client";

import { ActionForm, SubmitButton } from "../../_components/forms";
import { inputClass } from "../../_components/ui";
import type { ActionResult } from "@/lib/erp/types";

/** Approve / reject with an optional note. Shared by correction and leave reviews. */
export function ReviewForm({ id, action }: {
  id: string;
  action: (prev: ActionResult<unknown> | null, fd: FormData) => Promise<ActionResult<unknown>>;
}) {
  return (
    <ActionForm action={action} className="space-y-2">
      {() => (
        <>
          <input type="hidden" name="id" value={id} />
          <label htmlFor={`note-${id}`} className="sr-only">Review note</label>
          <input id={`note-${id}`} name="note" maxLength={500} placeholder="Note (optional)" className={`${inputClass} py-1.5 text-xs`} />
          <div className="flex gap-2">
            <SubmitButton size="sm" name="approve" value="true">Approve</SubmitButton>
            <SubmitButton size="sm" variant="secondary" name="approve" value="false">Reject</SubmitButton>
          </div>
        </>
      )}
    </ActionForm>
  );
}
