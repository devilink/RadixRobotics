import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { asUser, createDb } from "./harness";
import { seedWorld, type World } from "./world";

let db: PGlite;
let w: World;
let submitted: string;

const insert = async (status: string) =>
  (await db.query<{ id: string }>(
    `insert into public.community_applications (full_name, phone, email, resume_path, resume_name, work_paths, status)
     values ('Asha Rao', '+91 98765 43210', 'asha@example.com', 'x/resume.pdf', 'cv.pdf', array['x/work-1.jpg'], $1)
     returning id`, [status])).rows[0].id;

const visible = (user: string | null) =>
  asUser(db, user, async () => (await db.query<{ id: string }>("select id from public.community_applications")).rows.map((r) => r.id));

beforeAll(async () => {
  db = await createDb();
  w = await seedWorld(db);
  submitted = await insert("new");
  await insert("incomplete");
});

describe("community applications", () => {
  it("are visible to Super Admins only, and never while incomplete", async () => {
    expect(await visible(w.u.super)).toEqual([submitted]);
    expect(await visible(w.u.adminA)).toEqual([]);
    expect(await visible(w.u.nobody)).toEqual([]);
    await expect(visible(null)).rejects.toThrow();
  });

  it("let Super Admins review, stamping who changed the status", async () => {
    await asUser(db, w.u.super, () =>
      db.query("update public.community_applications set status = 'shortlisted', admin_notes = 'Strong builds' where id = $1", [submitted]));
    const row = (await db.query<{ status: string; reviewed_by: string }>(
      "select status, reviewed_by from public.community_applications where id = $1", [submitted])).rows[0];
    expect(row).toMatchObject({ status: "shortlisted", reviewed_by: w.u.super });
  });

  it("do not let reviewers edit the applicant's details", async () => {
    await expect(asUser(db, w.u.super, () =>
      db.query("update public.community_applications set email = 'x@y.z' where id = $1", [submitted]))).rejects.toThrow();
  });

  it("cannot be changed by other staff", async () => {
    await asUser(db, w.u.adminA, () =>
      db.query("update public.community_applications set status = 'rejected' where id = $1", [submitted]));
    const row = (await db.query<{ status: string }>("select status from public.community_applications where id = $1", [submitted])).rows[0];
    expect(row.status).toBe("shortlisted");
  });
});
