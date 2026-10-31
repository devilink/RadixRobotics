"use client";

import { ActionForm, ConfirmSubmit, SubmitButton } from "../_components/forms";
import { Field, inputClass } from "../_components/ui";
import { COMMUNITY_STATUSES, COMMUNITY_STATUS_LABELS, type CommunityStatus } from "@/lib/community";
import { deleteApplication, reviewApplication } from "./actions";

export function ReviewForm({ id, status, notes }: { id: string; status: CommunityStatus; notes: string | null }) {
  return (
    <ActionForm action={reviewApplication}>
      {({ errors }) => (
        <>
          <input type="hidden" name="id" value={id} />
          <Field label="Status" htmlFor="status" error={errors.status}>
            <select id="status" name="status" defaultValue={status} className={inputClass}>
              {COMMUNITY_STATUSES.map((s) => <option key={s} value={s}>{COMMUNITY_STATUS_LABELS[s]}</option>)}
            </select>
          </Field>
          <Field label="Internal notes" htmlFor="admin_notes" error={errors.admin_notes} hint="Only Super Admins can see these.">
            <textarea id="admin_notes" name="admin_notes" rows={5} maxLength={2000} defaultValue={notes ?? ""} className={inputClass} />
          </Field>
          <SubmitButton>Save review</SubmitButton>
        </>
      )}
    </ActionForm>
  );
}

export function DeleteApplication({ id, name }: { id: string; name: string }) {
  return (
    <ActionForm action={deleteApplication}>
      {() => (
        <>
          <input type="hidden" name="id" value={id} />
          <ConfirmSubmit
            label="Delete application"
            title="Delete this application?"
            body={<>This permanently removes {name}&apos;s details, resume and work images. This cannot be undone.</>}
            confirmLabel="Delete"
          />
        </>
      )}
    </ActionForm>
  );
}
