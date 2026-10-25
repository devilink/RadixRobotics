"use client";

import { useState } from "react";
import type { InstitutionOption } from "@/lib/erp/queries";
import { ActionForm, SubmitButton } from "../../_components/forms";
import { Field, inputClass } from "../../_components/ui";
import { WeekdayPicker } from "../../_components/WeekdayPicker";
import { createGroup } from "../actions";

export function GroupForm({ institutions, defaultInstitution }: { institutions: InstitutionOption[]; defaultInstitution?: string }) {
  const [instId, setInstId] = useState(
    institutions.some((i) => i.id === defaultInstitution) ? defaultInstitution! : institutions[0].id
  );
  const isSchool = institutions.find((i) => i.id === instId)?.institution_type === "school";
  return (
    <ActionForm action={createGroup}>
      {({ errors }) => (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Institution" htmlFor="institution_id" error={errors.institution_id} required>
              <select id="institution_id" name="institution_id" value={instId} onChange={(e) => setInstId(e.target.value)} className={inputClass}>
                {institutions.map((i) => (
                  <option key={i.id} value={i.id}>{i.name} ({i.institution_type === "school" ? "School" : "Radix Learning Center"})</option>
                ))}
              </select>
            </Field>
            <Field label={isSchool ? "Class name" : "Batch name"} htmlFor="name" error={errors.name} required
              hint={isSchool ? "e.g. Grade 6 - A" : "e.g. Saturday Drones 10am"}>
              <input id="name" name="name" required className={inputClass} aria-invalid={!!errors.name} />
            </Field>
            {isSchool && (
              <>
                <Field label="Grade" htmlFor="grade" error={errors.grade}>
                  <input id="grade" name="grade" className={inputClass} />
                </Field>
                <Field label="Section" htmlFor="section" error={errors.section}>
                  <input id="section" name="section" className={inputClass} />
                </Field>
              </>
            )}
            <Field label="Academic year" htmlFor="academic_year" error={errors.academic_year} hint="e.g. 2026-27">
              <input id="academic_year" name="academic_year" className={inputClass} aria-invalid={!!errors.academic_year} />
            </Field>
            <Field label="Capacity" htmlFor="capacity" error={errors.capacity}>
              <input id="capacity" name="capacity" type="number" min={1} max={1000} className={inputClass} />
            </Field>
            <Field label="Start time" htmlFor="start_time" error={errors.start_time}>
              <input id="start_time" name="start_time" type="time" className={inputClass} />
            </Field>
            <Field label="End time" htmlFor="end_time" error={errors.end_time}>
              <input id="end_time" name="end_time" type="time" className={inputClass} aria-invalid={!!errors.end_time} />
            </Field>
          </div>
          <WeekdayPicker
            key={instId}
            name="meeting_days"
            label={isSchool ? "Meeting days (leave empty to follow the school’s working days)" : "Meeting days"}
            defaultDays={isSchool ? [] : [6]}
            error={errors.meeting_days}
          />
          <p className="text-xs text-zinc-500">Registers are expected on meeting days; missing ones are flagged on the dashboard.</p>
          <div className="flex justify-end"><SubmitButton>Create</SubmitButton></div>
        </>
      )}
    </ActionForm>
  );
}
