import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { actionsFor, navFor } from "@/lib/erp/nav";
import { getCategory, requireErpContext } from "@/lib/erp/context";
import { Shell } from "./_components/Shell";
import { signOut } from "./actions";

export const metadata: Metadata = {
  title: { default: "ERP", template: "%s · RADIX ERP" },
  robots: { index: false, follow: false },
};

export default async function ErpLayout({ children }: { children: ReactNode }) {
  const ctx = await requireErpContext();

  if (!ctx.databaseReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-6 text-zinc-100">
        <div className="max-w-md rounded-2xl border border-amber-500/30 bg-zinc-900/50 p-8 text-center">
          <h1 className="text-lg font-semibold text-zinc-100">The ERP database is not set up yet</h1>
          <p className="mt-2 text-sm text-zinc-400">
            The ERP tables were not found in this Supabase project. Apply the migrations in{" "}
            <code>supabase/migrations/</code> (see <code>docs/ERP.md</code>), then sign in again.
          </p>
        </div>
      </div>
    );
  }

  if (ctx.assignments.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-6 text-zinc-100">
        <div className="max-w-md rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-8 text-center">
          <h1 className="text-lg font-semibold text-zinc-100">No ERP access yet</h1>
          <p className="mt-2 text-sm text-zinc-400">
            You are signed in as <strong>{ctx.email}</strong>, but no role has been assigned to your account.
            Ask your administrator to grant you access.
          </p>
          <form action={signOut} className="mt-6">
            <button type="submit" className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-zinc-950 hover:bg-brand-400">
              Sign out
            </button>
          </form>
        </div>
      </div>
    );
  }

  const roles = [...new Set(ctx.assignments.map((a) => a.role_name))];
  return (
    <Suspense>
      <Shell
        nav={navFor(ctx.perms)}
        actions={actionsFor(ctx.perms)}
        category={await getCategory()}
        user={{ name: ctx.displayName, email: ctx.email, roles }}
      >
        {children}
      </Shell>
    </Suspense>
  );
}
