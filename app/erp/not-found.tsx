import { LinkButton } from "./_components/ui";

export default function ErpNotFound() {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
      <h1 className="text-lg font-semibold text-zinc-100">Not found</h1>
      <p className="mt-2 text-sm text-zinc-400">
        This record does not exist, or you do not have access to it.
      </p>
      <div className="mt-6"><LinkButton href="/erp">Back to dashboard</LinkButton></div>
    </div>
  );
}
