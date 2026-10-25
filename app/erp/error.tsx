"use client";

import { buttonClass } from "./_components/ui";

export default function ErpError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div role="alert" className="mx-auto max-w-lg rounded-2xl border border-rose-500/30 bg-zinc-900/50 p-8 text-center">
      <h1 className="text-lg font-semibold text-zinc-100">Something went wrong</h1>
      <p className="mt-2 text-sm text-zinc-400">
        This page could not be loaded. Your saved data is safe. Try again, and contact support if the problem continues.
      </p>
      <button type="button" onClick={reset} className={`${buttonClass("primary")} mt-6`}>Try again</button>
    </div>
  );
}
