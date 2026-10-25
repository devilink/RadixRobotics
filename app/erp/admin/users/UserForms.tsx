"use client";

import { useState } from "react";
import { ActionForm, ConfirmSubmit, SubmitButton } from "../../_components/forms";
import { Field, inputClass } from "../../_components/ui";
import { assignRole, createUserAccount, linkPerson, revokeRole } from "../actions";

export type RoleOption = { key: string; name: string; scope: "platform" | "institution"; applies_to: string[] | null };
export type InstOption = { id: string; name: string; institution_type: string };

function RoleAndInstitution({ roles, institutions, errors, defaultInstitution, prefix }: {
  roles: RoleOption[]; institutions: InstOption[]; errors: Record<string, string>; defaultInstitution?: string; prefix: string;
}) {
  const [roleKey, setRoleKey] = useState(roles.find((r) => r.scope === "institution")?.key ?? roles[0]?.key);
  const role = roles.find((r) => r.key === roleKey);
  const insts = institutions.filter((i) => !role?.applies_to || role.applies_to.includes(i.institution_type));
  return (
    <>
      <Field label="Role" htmlFor={`${prefix}-role`} error={errors.role_key} required>
        <select id={`${prefix}-role`} name="role_key" value={roleKey} onChange={(e) => setRoleKey(e.target.value)} className={inputClass}>
          {roles.some((r) => r.scope === "institution") && (
            <optgroup label="Institution roles">
              {roles.filter((r) => r.scope === "institution").map((r) => <option key={r.key} value={r.key}>{r.name}</option>)}
            </optgroup>
          )}
          {roles.some((r) => r.scope === "platform") && (
            <optgroup label="Radix platform roles (all institutions)">
              {roles.filter((r) => r.scope === "platform").map((r) => <option key={r.key} value={r.key}>{r.name}</option>)}
            </optgroup>
          )}
        </select>
      </Field>
      {role?.scope === "institution" ? (
        <Field label="Institution" htmlFor={`${prefix}-inst`} error={errors.institution_id} required>
          <select id={`${prefix}-inst`} name="institution_id" defaultValue={defaultInstitution} key={roleKey} className={inputClass}>
            {insts.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </Field>
      ) : (
        <p className="self-end text-xs text-zinc-500 sm:pb-2">Platform roles apply across every institution.</p>
      )}
    </>
  );
}

export function CreateUserForm({ roles, institutions, link }: {
  roles: RoleOption[]; institutions: InstOption[];
  link?: { membership_id: string; institution_id: string; name: string; email: string | null };
}) {
  return (
    <ActionForm action={createUserAccount} resetOnSuccess>
      {({ errors }) => (
        <>
          {link && <input type="hidden" name="membership_id" value={link.membership_id} />}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Full name" htmlFor="full_name" error={errors.full_name} required>
              <input id="full_name" name="full_name" defaultValue={link?.name} autoComplete="off" className={inputClass} />
            </Field>
            <Field label="Email (login)" htmlFor="email" error={errors.email} required>
              <input id="email" name="email" type="email" defaultValue={link?.email ?? ""} autoComplete="off" className={inputClass} />
            </Field>
            <Field label="Temporary password" htmlFor="password" error={errors.password} required hint="At least 10 characters with a letter and a number.">
              <input id="password" name="password" type="password" autoComplete="new-password" className={inputClass} />
            </Field>
            <div className="hidden sm:block" />
            <RoleAndInstitution prefix="new" roles={roles} institutions={institutions} errors={errors} defaultInstitution={link?.institution_id} />
          </div>
          <div className="flex justify-end"><SubmitButton>Create account</SubmitButton></div>
        </>
      )}
    </ActionForm>
  );
}

export function AssignRoleForm({ userId, roles, institutions }: { userId: string; roles: RoleOption[]; institutions: InstOption[] }) {
  return (
    <ActionForm action={assignRole}>
      {({ errors }) => (
        <>
          <input type="hidden" name="user_id" value={userId} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <RoleAndInstitution prefix={`u-${userId}`} roles={roles} institutions={institutions} errors={errors} />
          </div>
          <div className="flex justify-end"><SubmitButton size="sm">Grant role</SubmitButton></div>
        </>
      )}
    </ActionForm>
  );
}

export function RevokeButton({ assignmentId, label }: { assignmentId: string; label: string }) {
  return (
    <ActionForm action={revokeRole} className="inline-block space-y-0">
      {() => (
        <>
          <input type="hidden" name="assignment_id" value={assignmentId} />
          <ConfirmSubmit label="Remove" title={`Remove ${label}?`} confirmLabel="Remove role" body="Access granted by this role ends immediately." />
        </>
      )}
    </ActionForm>
  );
}

export function LinkPersonButton({ userId, membershipId, name }: { userId: string; membershipId: string; name: string }) {
  return (
    <ActionForm action={linkPerson} className="inline-block space-y-0">
      {() => (
        <>
          <input type="hidden" name="user_id" value={userId} />
          <input type="hidden" name="membership_id" value={membershipId} />
          <SubmitButton size="sm" variant="secondary">Link to {name}</SubmitButton>
        </>
      )}
    </ActionForm>
  );
}
