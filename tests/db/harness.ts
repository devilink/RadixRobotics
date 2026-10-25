import { PGlite } from "@electric-sql/pglite";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const MIGRATIONS_DIR = process.env.ERP_MIGRATIONS_DIR ?? path.join(__dirname, "..", "..", "supabase", "migrations");

// Minimal stand-in for what Supabase provides before our migrations run:
// the auth schema, API roles, Supabase's permissive default grants (which our
// migrations must tighten), and the legacy tables from supabase_rbac_schema.sql.
const SUPABASE_STUB = `
create schema auth;
create table auth.users (id uuid primary key, email text);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
grant usage on schema public to anon, authenticated, service_role;
grant usage on schema auth to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;

create table public.schools (
  custom_id text primary key,
  school_name text not null,
  admin_auth_id uuid,
  created_at timestamptz not null default now()
);
create table public.user_roles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('super_admin', 'school_admin', 'student')),
  school_id text references public.schools(custom_id) on delete cascade,
  is_approved boolean default true,
  created_at timestamptz not null default now()
);
`;

export type Db = PGlite;

export async function createDb(beforeMigrations?: (db: PGlite) => Promise<void>) {
  const db = new PGlite();
  await db.exec(SUPABASE_STUB);
  if (beforeMigrations) await beforeMigrations(db);
  const files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files) {
    try {
      await db.exec(readFileSync(path.join(MIGRATIONS_DIR, file), "utf8"));
    } catch (err) {
      throw new Error(`Migration ${file} failed: ${(err as Error).message}`);
    }
  }
  return db;
}

/** Run statements as a signed-in Supabase user (role `authenticated`, RLS applies). */
export async function asUser<T>(db: PGlite, userId: string | null, fn: () => Promise<T>): Promise<T> {
  await db.exec(
    `select set_config('request.jwt.claim.sub', '${userId ?? ""}', false); set role ${userId ? "authenticated" : "anon"};`
  );
  try {
    return await fn();
  } finally {
    await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`);
  }
}

export async function createUser(db: PGlite, email: string): Promise<string> {
  const { rows } = await db.query<{ id: string }>(
    "insert into auth.users (id, email) values (gen_random_uuid(), $1) returning id",
    [email]
  );
  return rows[0].id;
}

export async function grantRole(db: PGlite, userId: string, role: string, institutionId: string | null) {
  await db.query(
    "insert into public.user_role_assignments (user_id, role_key, institution_id) values ($1, $2, $3)",
    [userId, role, institutionId]
  );
}

export async function createInstitution(db: PGlite, code: string, name: string, type: string) {
  const { rows } = await db.query<{ id: string }>(
    "insert into public.institutions (code, name, institution_type) values ($1, $2, $3) returning id",
    [code, name, type]
  );
  return rows[0].id;
}

/** Postgres SQLSTATE of a rejected promise (or null if it resolved). */
export async function sqlState(p: Promise<unknown>): Promise<string | null> {
  try {
    await p;
    return null;
  } catch (err) {
    return (err as { code?: string }).code ?? "unknown";
  }
}
