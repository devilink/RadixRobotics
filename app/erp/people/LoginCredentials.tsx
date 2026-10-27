"use client";

import { useState } from "react";
import { Check, Copy, Printer } from "lucide-react";
import type { StudentLoginResult } from "./actions";
import { buttonClass, LinkButton, Notice } from "../_components/ui";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** Shown once after a student is created with a login: the details to hand to the student. */
export function LoginCredentials({ login, institutionId }: { login: StudentLoginResult; institutionId: string }) {
  const [copied, setCopied] = useState(false);
  // Only ever rendered in the browser, after the form's server action returns.
  const loginUrl = `${typeof window === "undefined" ? "" : window.location.origin}/login`;
  const text = [
    `${login.name} · ${login.institutionName}`,
    `Sign in at: ${loginUrl} (choose "Student")`,
    `Username: ${login.username}`,
    `Password: ${login.password}`,
  ].join("\n");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked: the details stay visible to copy by hand */
    }
  };

  // A one-slip print window, so the rest of the ERP page is not printed.
  const print = () => {
    const w = window.open("", "_blank", "width=480,height=420");
    if (!w) return;
    w.document.write(`<!doctype html><title>Login for ${esc(login.name)}</title>
<style>body{font:15px/1.5 system-ui,sans-serif;margin:32px;color:#111}.slip{border:2px dashed #999;border-radius:12px;padding:20px 24px;max-width:380px}
h1{font-size:18px;margin:0 0 2px}p{margin:0 0 14px;color:#555}dl{display:grid;grid-template-columns:auto 1fr;gap:6px 14px;margin:0}dt{color:#555}dd{margin:0;font:600 16px ui-monospace,Consolas,monospace}</style>
<div class="slip"><h1>${esc(login.name)}</h1><p>${esc(login.institutionName)}</p>
<dl><dt>Sign in at</dt><dd style="font:inherit">${esc(loginUrl)} → Student</dd><dt>Username</dt><dd>${esc(login.username)}</dd><dt>Password</dt><dd>${esc(login.password)}</dd></dl></div>`);
    w.document.close();
    w.focus();
    w.print();
  };

  return (
    <div className="space-y-4">
      <Notice tone="success">
        Student added and their login is ready.
        {login.curriculum ? " They can sign in to the curriculum now." : " This institution is not linked to a curriculum school, so the login opens their ERP page only."}
      </Notice>
      <div className="rounded-xl border border-zinc-700 bg-zinc-950/60 p-5">
        <p className="text-sm font-semibold text-zinc-100">{login.name}</p>
        <p className="mb-4 text-xs text-zinc-500">{login.institutionName}</p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
          <dt className="text-zinc-500">Sign in at</dt>
          <dd className="text-zinc-200">{loginUrl} <span className="text-zinc-500">→ Student tab</span></dd>
          <dt className="text-zinc-500">Username</dt>
          <dd className="font-mono font-semibold text-white">{login.username}</dd>
          <dt className="text-zinc-500">Password</dt>
          <dd className="font-mono font-semibold text-white">{login.password}</dd>
        </dl>
        <p className="mt-4 text-xs text-amber-300/80">The password is shown only now. Copy or print it before leaving this page.</p>
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" onClick={copy} className={buttonClass("secondary")}>
          {copied ? <Check aria-hidden className="h-4 w-4" /> : <Copy aria-hidden className="h-4 w-4" />}
          {copied ? "Copied" : "Copy details"}
        </button>
        <button type="button" onClick={print} className={buttonClass("secondary")}>
          <Printer aria-hidden className="h-4 w-4" /> Print slip
        </button>
        <LinkButton variant="secondary" href={`/erp/people/${login.membershipId}?created=1`}>Open student record</LinkButton>
        {/* A full load resets the form for the next student. */}
        <a href={`/erp/people/new?type=student&institution=${institutionId}`} className={buttonClass("primary")}>Add another student</a>
      </div>
    </div>
  );
}
