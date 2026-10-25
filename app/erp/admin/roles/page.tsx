import { Fragment } from "react";
import { Check } from "lucide-react";
import { db, requirePagePermission } from "@/lib/erp/context";
import { Card, PageHeader, cx } from "../../_components/ui";

export const metadata = { title: "Permission Matrix" };

export default async function RolesPage() {
  await requirePagePermission(["users.manage"]);
  const supabase = await db();
  const [{ data: roles }, { data: perms }, { data: rp }] = await Promise.all([
    supabase.from("roles").select("key, name, scope, description").order("sort_order"),
    supabase.from("permissions").select("key, module, description").order("module").order("key"),
    supabase.from("role_permissions").select("role_key, permission_key"),
  ]);
  const has = new Set((rp ?? []).map((r) => `${r.role_key}|${r.permission_key}`));
  const modules = [...new Set((perms ?? []).map((p) => p.module))];

  return (
    <>
      <PageHeader
        title="Permission Matrix"
        description="Read-only view of what each role can do. Roles and permissions are defined in database migrations and enforced by Row-Level Security."
        crumbs={[{ href: "/erp/admin/users", label: "Users & Roles" }, { label: "Permission Matrix" }]}
      />
      <Card bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse text-xs">
            <caption className="sr-only">Permissions granted to each role</caption>
            <thead className="sticky top-0 bg-zinc-900">
              <tr>
                <th scope="col" className="border-b border-zinc-800 px-3 py-2 text-left font-semibold text-zinc-400">Permission</th>
                {(roles ?? []).map((r) => (
                  <th key={r.key} scope="col" title={r.description ?? ""} className={cx("border-b border-zinc-800 px-1 py-2 text-center font-semibold", r.scope === "platform" ? "text-zinc-100" : "text-sky-300")}>
                    <span className="inline-block max-w-[5.5rem] leading-tight">{r.name}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {modules.map((mod) => (
                <Fragment key={mod}>
                  <tr><th colSpan={(roles ?? []).length + 1} scope="colgroup" className="bg-zinc-800 px-3 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{mod}</th></tr>
                  {(perms ?? []).filter((p) => p.module === mod).map((p) => (
                    <tr key={p.key} className="hover:bg-zinc-800/40">
                      <th scope="row" className="border-b border-zinc-800/60 px-3 py-1.5 text-left font-normal">
                        <span className="font-mono text-zinc-100">{p.key}</span>
                        <span className="block text-zinc-500">{p.description}</span>
                      </th>
                      {(roles ?? []).map((r) => (
                        <td key={r.key} className="border-b border-zinc-800/60 text-center">
                          {has.has(`${r.key}|${p.key}`)
                            ? <><Check aria-hidden className="mx-auto h-4 w-4 text-emerald-400" /><span className="sr-only">Granted</span></>
                            : <span className="sr-only">Not granted</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="mt-3 text-xs text-zinc-500">Dark column headings are platform-wide roles; blue headings are granted per institution.</p>
    </>
  );
}
