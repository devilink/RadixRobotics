"use client";

import { ActionForm, ConfirmSubmit, SubmitButton } from "../../_components/forms";
import { Field, inputClass } from "../../_components/ui";
import { WeekdayPicker } from "../../_components/WeekdayPicker";
import { addCampus, addShift, deleteShift } from "../actions";

export function CampusForm({ institutionId }: { institutionId: string }) {
  return (
    <ActionForm action={addCampus} resetOnSuccess className="mt-4 border-t border-zinc-800/60 pt-4">
      {({ errors }) => (
        <>
          <input type="hidden" name="institution_id" value={institutionId} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Campus name" htmlFor="campus-name" error={errors.name} required>
              <input id="campus-name" name="name" className={inputClass} />
            </Field>
            <Field label="Address" htmlFor="campus-address" error={errors.address_line}>
              <input id="campus-address" name="address_line" className={inputClass} />
            </Field>
            <Field label="City" htmlFor="campus-city" error={errors.city}>
              <input id="campus-city" name="city" className={inputClass} />
            </Field>
          </div>
          <div className="flex justify-end"><SubmitButton size="sm">Add campus</SubmitButton></div>
        </>
      )}
    </ActionForm>
  );
}

export function ShiftForm({ institutionId }: { institutionId: string }) {
  return (
    <ActionForm action={addShift} resetOnSuccess className="mt-4 border-t border-zinc-800/60 pt-4">
      {({ errors }) => (
        <>
          <input type="hidden" name="institution_id" value={institutionId} />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="col-span-2 sm:col-span-1">
              <Field label="Shift name" htmlFor="shift-name" error={errors.name} required>
                <input id="shift-name" name="name" placeholder="General" className={inputClass} />
              </Field>
            </div>
            <Field label="Start" htmlFor="shift-start" error={errors.start_time} required>
              <input id="shift-start" name="start_time" type="time" defaultValue="09:00" className={inputClass} />
            </Field>
            <Field label="End" htmlFor="shift-end" error={errors.end_time} required>
              <input id="shift-end" name="end_time" type="time" defaultValue="17:00" className={inputClass} />
            </Field>
            <Field label="Grace (min)" htmlFor="shift-grace" error={errors.grace_minutes}>
              <input id="shift-grace" name="grace_minutes" type="number" min={0} max={240} defaultValue={10} className={inputClass} />
            </Field>
          </div>
          <WeekdayPicker name="days_of_week" label="Days" defaultDays={[1, 2, 3, 4, 5, 6]} error={errors.days_of_week} />
          <div className="flex justify-end"><SubmitButton size="sm">Add shift</SubmitButton></div>
        </>
      )}
    </ActionForm>
  );
}

export function DeleteShiftButton({ id, institutionId, name }: { id: string; institutionId: string; name: string }) {
  return (
    <ActionForm action={deleteShift} className="space-y-0">
      {() => (
        <>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="institution_id" value={institutionId} />
          <ConfirmSubmit label="Remove" title={`Remove shift “${name}”?`} confirmLabel="Remove shift"
            body="Shifts that are still assigned to staff cannot be removed." />
        </>
      )}
    </ActionForm>
  );
}
