"use client";

import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import type { ActionResult } from "@/lib/erp/types";
import { buttonClass, cx, Notice, type ButtonVariant } from "./ui";

export function SubmitButton({ children, variant = "primary", size = "md", pendingLabel, name, value, disabled }: {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: "sm" | "md";
  pendingLabel?: string;
  name?: string;
  value?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" name={name} value={value} disabled={pending || disabled} aria-disabled={pending || disabled} className={buttonClass(variant, size)}>
      {pending && <Loader2 aria-hidden className="h-4 w-4 animate-spin" />}
      {pending ? pendingLabel ?? "Saving…" : children}
    </button>
  );
}

type FormAction = (prev: ActionResult<unknown> | null, fd: FormData) => Promise<ActionResult<unknown>>;

/**
 * Form wrapper around a server action returning ActionResult. Renders the
 * result message and exposes field errors to children via a render prop.
 */
export function ActionForm({ action, children, className, resetOnSuccess = false, onSuccess }: {
  action: FormAction;
  children: (state: { errors: Record<string, string>; pending: boolean }) => ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  onSuccess?: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) {
      if (resetOnSuccess) ref.current?.reset();
      onSuccess?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
  const errors = state && !state.ok ? state.fieldErrors ?? {} : {};
  return (
    <form ref={ref} action={formAction} className={cx("space-y-4", className)} noValidate>
      {state && !state.ok && <Notice tone="error">{state.error}</Notice>}
      {state?.ok && state.message && <Notice tone="success">{state.message}</Notice>}
      {children({ errors, pending })}
    </form>
  );
}

/** Button that asks for confirmation in an accessible modal before submitting its form. */
export function ConfirmSubmit({ label, title, body, confirmLabel = "Confirm", variant = "danger", size = "sm", name, value }: {
  label: ReactNode;
  title: string;
  body: ReactNode;
  confirmLabel?: string;
  variant?: ButtonVariant;
  size?: "sm" | "md";
  name?: string;
  value?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <>
      <button type="button" className={buttonClass(variant, size)} onClick={() => setOpen(true)}>
        {label}
      </button>
      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        aria-labelledby="confirm-title"
        className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-2xl border border-zinc-800 bg-zinc-900 p-0 text-zinc-100 shadow-2xl backdrop:bg-black/70 backdrop:backdrop-blur-sm"
      >
        <div className="p-5">
          <h2 id="confirm-title" className="text-base font-semibold text-zinc-100">{title}</h2>
          <div className="mt-2 text-sm text-zinc-400">{body}</div>
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" className={buttonClass("secondary")} onClick={() => setOpen(false)}>
              Cancel
            </button>
            <SubmitButton variant={variant} name={name} value={value}>
              {confirmLabel}
            </SubmitButton>
            <CloseWhenDone onDone={() => setOpen(false)} />
          </div>
        </div>
      </dialog>
    </>
  );
}

function CloseWhenDone({ onDone }: { onDone: () => void }) {
  const { pending } = useFormStatus();
  const was = useRef(false);
  useEffect(() => {
    if (was.current && !pending) onDone();
    was.current = pending;
  }, [pending, onDone]);
  return null;
}
