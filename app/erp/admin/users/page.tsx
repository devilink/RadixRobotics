import { db, requirePagePermission } from "@/lib/erp/context";
import { institutionsWith } from "@/lib/erp/permissions";
import { str } from "@/lib/erp/format";
import { Badge, Card, EmptyState, Notice, PageHeader, Table, buttonClass, cx, inputClass, td, th } from "../../_components/ui";
import { AssignRoleForm, CreateUserForm, LinkPersonButton, ResetPasswordForm, RevokeButton, type InstOption, type RoleOption } from "./UserForms";
import { STUDENT_LOGIN_DOMAIN } from "@/lib/auth/student-login";

export const metadata = { title: "Users & Roles" };

type Assignment = { id: string; user_id: string; role_key: string; institution_id: string | null; roles: { name: string } | null; institutions: { name: string } | null };

export default async function UsersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requirePagePermission(["users.manage"]);
  const sp = await searchParams;
  const q = (str(sp.q) ?? "").trim().slice(0, 100);
  const supabase = await db();
  const scope = institutionsWith(ctx.perms, "users.manage");
  const isPlatform = scope === "all";

  // Roles this admin may grant (mirrors erp_private.can_grant; the database re-checks).
  const { data: roleRows } = await supabase.from("roles").select("key, name, scope, applies_to").order("sort_order");
  const roles = ((roleRows ?? []) as RoleOption[]).filter((r) =>
    isPlatform || (r.scope === "institution" && !["school_admin", "centre_manager"].includes(r.key))
  );
  let iq = supabase.from("institutions").select("id, name, institution_type").eq("status", "active").order("name");
  if (!isPlatform) iq = iq.in("id", scope.length ? scope : ["00000000-0000-0000-0000-000000000000"]);
  const institutions = ((await iq).data ?? []) as InstOption[];

  // Optional: "create login for this person" flow from a person page.
  const linkId = /^[0-9a-f-]{36}$/i.test(str(sp.link) ?? "") ? str(sp.link)! : null;
  let link: { membership_id: string; institution_id: string; name: string; email: string | null; member_type: string | null } | undefined;
  if (linkId) {
    const { data: m } = await supabase.from("institution_memberships").select("id, institution_id, member_type, people(first_name, last_name, email)").eq("id", linkId).maybeSingle();
    const p = m?.people as unknown as { first_name: string; last_name: string; email: string | null } | null;
    if (m && p) link = { membership_id: m.id, institution_id: m.institution_id, name: `${p.first_name} ${p.last_name}`.trim(), email: p.email, member_type: m.member_type };
  }

  let pq = supabase.from("profiles").select("id, email, full_name, person_id, is_active").order("email").limit(200);
  if (q) pq = pq.or(`email.ilike.%${q.replace(/[%_,()]/g, "")}%,full_name.ilike.%${q.replace(/[%_,()]/g, "")}%`);
  const [{ data: profiles }, { data: assignments }] = await Promise.all([
    pq,
    supabase.from("user_role_assignments").select("id, user_id, role_key, institution_id, roles(name), institutions(name)"),
  ]);
  const byUser = new Map<string, Assignment[]>();
  for (const a of (assignments ?? []) as unknown as Assignment[]) byUser.set(a.user_id, [...(byUser.get(a.user_id) ?? []), a]);
  const canRevoke = (a: Assignment) =>
    isPlatform || (a.institution_id !== null && scope.includes(a.institution_id) && !["school_admin", "centre_manager"].includes(a.role_key));

  return (
    <>
      <PageHeader
        title="Users & Roles"
        description={isPlatform ? "All ERP accounts and their role assignments." : "Accounts with roles at institutions you administer."}
        crumbs={[{ href: "/erp", label: "Dashboard" }, { label: "Users & Roles" }]}
      />

      <Card title={link ? `Create a login for ${link.name}` : "Create an account"}>
        {link && <div className="mb-4"><Notice tone="info">The new login will be linked to {link.name}’s record so they see their own classes and attendance.</Notice></div>}
        {institutions.length === 0 && !isPlatform ? (
          <EmptyState title="No institutions to manage" />
        ) : (
          <CreateUserForm roles={roles} institutions={institutions} link={link} />
        )}
      </Card>

      <Card className="mt-6" title="Accounts">
        <form className="mb-4 flex gap-2" role="search">
          <label htmlFor="q" className="sr-only">Search accounts</label>
          <input id="q" name="q" defaultValue={q} placeholder="Search email or name" className={cx(inputClass, "max-w-xs")} />
          {linkId && <input type="hidden" name="link" value={linkId} />}
          <button className={buttonClass("secondary")}>Search</button>
        </form>
        {(profiles ?? []).length === 0 ? (
          <EmptyState title="No accounts found" />
        ) : (
          <Table caption="Accounts">
            <thead>
              <tr><th className={th}>Account</th><th className={th}>Roles</th><th className={th}><span className="sr-only">Manage</span></th></tr>
            </thead>
            <tbody>
              {(profiles ?? []).map((p) => (
                <tr key={p.id} className="align-top">
                  <td className={td}>
                    <p className="font-medium">{p.full_name || "—"}</p>
                    <p className="text-xs text-zinc-500">{p.email}</p>
                    <p className="mt-1 flex gap-1">
                      {p.person_id ? <Badge tone="green">Linked to person</Badge> : <Badge>No person link</Badge>}
                      {!p.is_active && <Badge tone="red">Inactive</Badge>}
                    </p>
                    {link && !p.person_id && p.id !== ctx.userId && <div className="mt-2"><LinkPersonButton userId={p.id} membershipId={link.membership_id} name={link.name} /></div>}
                  </td>
                  <td className={td}>
                    <ul className="space-y-1">
                      {(byUser.get(p.id) ?? []).map((a) => (
                        <li key={a.id} className="flex flex-wrap items-center gap-2">
                          <Badge tone={a.institution_id ? "sky" : "dark"}>{a.roles?.name ?? a.role_key}</Badge>
                          <span className="text-xs text-zinc-400">{a.institutions?.name ?? "All institutions"}</span>
                          {canRevoke(a) && <RevokeButton assignmentId={a.id} label={`${a.roles?.name ?? a.role_key}${a.institutions ? ` at ${a.institutions.name}` : ""}`} />}
                        </li>
                      ))}
                      {!(byUser.get(p.id) ?? []).length && <li className="text-xs text-zinc-500">No roles</li>}
                    </ul>
                  </td>
                  <td className={cx(td, "w-[22rem]")}>
                    <details>
                      <summary className="cursor-pointer text-sm text-zinc-300 hover:text-zinc-100">Grant a role</summary>
                      <div className="mt-2"><AssignRoleForm userId={p.id} roles={roles} institutions={institutions} /></div>
                    </details>
                    {p.email?.endsWith(`@${STUDENT_LOGIN_DOMAIN}`) && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm text-zinc-300 hover:text-zinc-100">Reset password</summary>
                        <div className="mt-2"><ResetPasswordForm userId={p.id} /></div>
                      </details>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
