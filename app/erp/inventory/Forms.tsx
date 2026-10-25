"use client";

import { useState } from "react";
import { ActionForm, ConfirmSubmit, SubmitButton } from "../_components/forms";
import { Field, inputClass } from "../_components/ui";
import { MANUAL_MOVEMENT_TYPES, MOVEMENT_LABELS, type InventoryItem, type ManualMovementType } from "@/lib/erp/inventory-types";
import type { ActionResult } from "@/lib/erp/types";
import {
  addKitComponent, buildKits, createCategory, deleteCategory, deleteItem, recordMovement, removeKitComponent,
} from "./actions";

type Option = { id: string; name: string };

export function ItemForm({ action, initial, categories, isEdit }: {
  action: (prev: ActionResult<unknown> | null, fd: FormData) => Promise<ActionResult<unknown>>;
  initial?: Partial<InventoryItem>;
  categories: Option[];
  isEdit?: boolean;
}) {
  const v = initial ?? {};
  return (
    <ActionForm action={action}>
      {({ errors }) => (
        <>
          <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <legend className="sr-only">Item details</legend>
            <Field label="Name" htmlFor="name" error={errors.name} required>
              <input id="name" name="name" defaultValue={v.name} placeholder="Arduino Uno R3" className={inputClass} aria-invalid={!!errors.name} />
            </Field>
            <Field label="SKU" htmlFor="sku" error={errors.sku} hint="Unique stock code, e.g. MCU-UNO-R3" required>
              <input id="sku" name="sku" defaultValue={v.sku} className={`${inputClass} uppercase`} aria-invalid={!!errors.sku} />
            </Field>
            <Field label="Type" htmlFor="kind" error={errors.kind}
              hint={isEdit ? "Can only change while the item is not part of any kit." : "A kit is built from components you list on its page."}>
              <select id="kind" name="kind" defaultValue={v.kind ?? "component"} className={inputClass}>
                <option value="component">Component</option>
                <option value="kit">Kit</option>
              </select>
            </Field>
            <Field label="Category" htmlFor="category_id" error={errors.category_id}>
              <select id="category_id" name="category_id" defaultValue={v.category_id ?? ""} className={inputClass}>
                <option value="">Uncategorised</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Unit" htmlFor="unit" error={errors.unit} hint="pcs, m, set, box…">
              <input id="unit" name="unit" defaultValue={v.unit ?? "pcs"} className={inputClass} />
            </Field>
            <Field label="Reorder level" htmlFor="reorder_level" error={errors.reorder_level} hint="Flag as low stock at or below this quantity. 0 turns it off.">
              <input id="reorder_level" name="reorder_level" type="number" min={0} defaultValue={v.reorder_level ?? 0} className={inputClass} />
            </Field>
            <Field label="Unit cost (₹)" htmlFor="unit_cost" error={errors.unit_cost}>
              <input id="unit_cost" name="unit_cost" type="number" min={0} step="0.01" defaultValue={v.unit_cost ?? ""} className={inputClass} />
            </Field>
            <Field label="Storage location" htmlFor="storage_location" error={errors.storage_location} hint="Shelf, bin or room">
              <input id="storage_location" name="storage_location" defaultValue={v.storage_location ?? ""} className={inputClass} />
            </Field>
            <Field label="Manufacturer / brand" htmlFor="manufacturer" error={errors.manufacturer}>
              <input id="manufacturer" name="manufacturer" defaultValue={v.manufacturer ?? ""} className={inputClass} />
            </Field>
            {!isEdit && (
              <Field label="Opening stock" htmlFor="opening_stock" error={errors.opening_stock} hint="Recorded as a ‘Received’ movement.">
                <input id="opening_stock" name="opening_stock" type="number" min={0} placeholder="0" className={inputClass} />
              </Field>
            )}
            <div className="sm:col-span-2">
              <Field label="Description / specs" htmlFor="description" error={errors.description}>
                <textarea id="description" name="description" rows={3} defaultValue={v.description ?? ""} className={inputClass} />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm text-zinc-200 sm:col-span-2">
              <input type="checkbox" name="is_active" value="true" defaultChecked={v.is_active ?? true} className="h-4 w-4 accent-brand-500" />
              Active (inactive items are hidden from lists and pickers)
            </label>
          </fieldset>
          <div className="flex justify-end">
            <SubmitButton>{isEdit ? "Save changes" : "Create item"}</SubmitButton>
          </div>
        </>
      )}
    </ActionForm>
  );
}

const QTY_LABEL: Record<ManualMovementType, string> = {
  receive: "Quantity received",
  issue: "Quantity issued",
  return: "Quantity returned",
  adjust: "Counted quantity on shelf",
  write_off: "Quantity written off",
};

export function MovementForm({ itemId, unit, institutions }: { itemId: string; unit: string; institutions: Option[] }) {
  const [type, setType] = useState<ManualMovementType>("receive");
  const toSite = type === "issue" || type === "return";
  const needsReason = type === "adjust" || type === "write_off";
  return (
    <ActionForm action={recordMovement} resetOnSuccess onSuccess={() => setType("receive")}>
      {({ errors }) => (
        <>
          <input type="hidden" name="item_id" value={itemId} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Movement" htmlFor="mv-type" error={errors.type}>
              <select id="mv-type" name="type" value={type} onChange={(e) => setType(e.target.value as ManualMovementType)} className={inputClass}>
                {MANUAL_MOVEMENT_TYPES.map((t) => <option key={t} value={t}>{MOVEMENT_LABELS[t]}</option>)}
              </select>
            </Field>
            <Field label={`${QTY_LABEL[type]} (${unit})`} htmlFor="mv-qty" error={errors.quantity} required>
              <input id="mv-qty" name="quantity" type="number" min={type === "adjust" ? 0 : 1} className={inputClass} aria-invalid={!!errors.quantity} />
            </Field>
            {toSite && (
              <>
                <Field label={type === "issue" ? "Issue to school / centre" : "Returned by school / centre"} htmlFor="mv-inst" error={errors.institution_id}>
                  <select id="mv-inst" name="institution_id" defaultValue="" className={inputClass} aria-invalid={!!errors.institution_id}>
                    <option value="">— None —</option>
                    {institutions.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                </Field>
                <Field label="Person / team" htmlFor="mv-to" error={errors.issued_to} hint="Trainer, event or team name">
                  <input id="mv-to" name="issued_to" className={inputClass} />
                </Field>
              </>
            )}
            <Field label="Reference" htmlFor="mv-ref" error={errors.reference} hint="Invoice, PO or challan number">
              <input id="mv-ref" name="reference" className={inputClass} />
            </Field>
            <Field label={needsReason ? "Reason" : "Note"} htmlFor="mv-note" error={errors.note} required={needsReason}>
              <input id="mv-note" name="note" className={inputClass} aria-invalid={!!errors.note}
                placeholder={type === "write_off" ? "Damaged, lost, burnt out…" : undefined} />
            </Field>
          </div>
          <div className="flex justify-end"><SubmitButton size="sm">Record movement</SubmitButton></div>
        </>
      )}
    </ActionForm>
  );
}

export function KitBuildForm({ kitId, canBuild }: { kitId: string; canBuild: number }) {
  return (
    <ActionForm action={buildKits} resetOnSuccess>
      {({ errors }) => (
        <>
          <input type="hidden" name="kit_id" value={kitId} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Action" htmlFor="kb-mode">
              <select id="kb-mode" name="mode" className={inputClass}>
                <option value="assemble">Build kits</option>
                <option value="disassemble">Break up kits</option>
              </select>
            </Field>
            <Field label="Number of kits" htmlFor="kb-count" error={errors.count} hint={`Components on hand make ${canBuild}.`} required>
              <input id="kb-count" name="count" type="number" min={1} defaultValue={1} className={inputClass} />
            </Field>
            <Field label="Note" htmlFor="kb-note" error={errors.note}>
              <input id="kb-note" name="note" className={inputClass} />
            </Field>
          </div>
          <div className="flex justify-end"><SubmitButton size="sm">Apply</SubmitButton></div>
        </>
      )}
    </ActionForm>
  );
}

export function KitComponentForm({ kitId, components }: { kitId: string; components: (Option & { sku: string })[] }) {
  return (
    <ActionForm action={addKitComponent} resetOnSuccess className="mt-4 border-t border-zinc-800/60 pt-4">
      {({ errors }) => (
        <>
          <input type="hidden" name="kit_id" value={kitId} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_8rem_auto] sm:items-end">
            <Field label="Component" htmlFor="kc-item" error={errors.component_id}>
              <select id="kc-item" name="component_id" defaultValue="" className={inputClass}>
                <option value="" disabled>Choose a component…</option>
                {components.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.sku})</option>)}
              </select>
            </Field>
            <Field label="Per kit" htmlFor="kc-qty" error={errors.quantity}>
              <input id="kc-qty" name="quantity" type="number" min={1} defaultValue={1} className={inputClass} />
            </Field>
            <SubmitButton size="sm">Add</SubmitButton>
          </div>
        </>
      )}
    </ActionForm>
  );
}

export function RemoveComponentButton({ id, kitId, name }: { id: string; kitId: string; name: string }) {
  return (
    <ActionForm action={removeKitComponent} className="space-y-0">
      {() => (
        <>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="kit_id" value={kitId} />
          <ConfirmSubmit label="Remove" title={`Remove ${name} from this kit?`} confirmLabel="Remove"
            body="Kits already built keep their stock. Future builds will no longer use this component." />
        </>
      )}
    </ActionForm>
  );
}

export function DeleteItemButton({ id, name }: { id: string; name: string }) {
  return (
    <ActionForm action={deleteItem} className="space-y-0">
      {() => (
        <>
          <input type="hidden" name="id" value={id} />
          <ConfirmSubmit label="Delete item" size="md" title={`Delete “${name}”?`} confirmLabel="Delete"
            body="Only items with no stock history can be deleted. Items that have moved stock should be marked inactive instead." />
        </>
      )}
    </ActionForm>
  );
}

export function CategoryForm() {
  return (
    <ActionForm action={createCategory} resetOnSuccess>
      {({ errors }) => (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
          <Field label="Name" htmlFor="cat-name" error={errors.name} required>
            <input id="cat-name" name="name" placeholder="Sensors" className={inputClass} />
          </Field>
          <Field label="Description" htmlFor="cat-desc" error={errors.description}>
            <input id="cat-desc" name="description" className={inputClass} />
          </Field>
          <SubmitButton size="sm">Add category</SubmitButton>
        </div>
      )}
    </ActionForm>
  );
}

export function DeleteCategoryButton({ id, name }: { id: string; name: string }) {
  return (
    <ActionForm action={deleteCategory} className="space-y-0">
      {() => (
        <>
          <input type="hidden" name="id" value={id} />
          <ConfirmSubmit label="Remove" title={`Remove category “${name}”?`} confirmLabel="Remove"
            body="Items in this category are kept and become uncategorised." />
        </>
      )}
    </ActionForm>
  );
}
