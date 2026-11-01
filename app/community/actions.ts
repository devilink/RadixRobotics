"use server";

import { createHash, randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { serviceClient } from "@/lib/erp/context";
import { rateLimit } from "@/lib/erp/rate-limit";
import { applicationSchema, COMMUNITY_BUCKET, IMAGE_TYPES, OTHER_TYPES, RESUME_TYPES } from "@/lib/community";

// Public join flow, in two steps so large files never pass through our server:
//   1. startApplication checks the details, records an `incomplete` row and
//      returns one-time signed upload URLs for each file.
//   2. The browser uploads the files straight to private Storage, then calls
//      finishApplication, which checks every file arrived and marks it `new`.
// The service role is used because visitors are not signed in; nothing they
// send is trusted without validation here, and they can never read anything back.

type StartResult =
  | { ok: true; id: string; uploads: { path: string; token: string }[] }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

const UUID = /^[0-9a-f-]{36}$/i;
const HOUR = 3600_000;

async function clientIpHash() {
  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown").trim();
  const salt = process.env.SCHOOL_TOKEN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return createHash("sha256").update(`community:${salt}:${ip}`).digest("hex").slice(0, 32);
}

export async function startApplication(input: unknown, honeypot?: string): Promise<StartResult> {
  // Only bots fill the hidden field; store nothing.
  if (honeypot) return { ok: false, error: "Something went wrong. Please try again." };

  const parsed = applicationSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors };
  }
  const data = parsed.data;

  const ipHash = await clientIpHash();
  if (!rateLimit(`community:${ipHash}`, 5, HOUR)) {
    return { ok: false, error: "Too many attempts. Please try again in an hour." };
  }

  try {
    const supabase = serviceClient();
    const since = new Date(Date.now() - 24 * HOUR).toISOString();
    const [byIp, byEmail] = await Promise.all([
      supabase.from("community_applications").select("id", { count: "exact", head: true })
        .eq("ip_hash", ipHash).gte("created_at", since),
      supabase.from("community_applications").select("id", { count: "exact", head: true })
        .eq("email", data.email).neq("status", "incomplete").gte("created_at", since),
    ]);
    if ((byIp.count ?? 0) >= 10) return { ok: false, error: "Too many applications from this network today. Please try again tomorrow." };
    if ((byEmail.count ?? 0) >= 1) return { ok: false, error: "We already received an application from this email today. We'll be in touch soon!" };

    const id = randomUUID();
    const resumePath = `${id}/resume.${RESUME_TYPES[data.resume.type]}`;
    const workPaths = data.works.map((w, i) => `${id}/work-${i + 1}.${IMAGE_TYPES[w.type]}`);
    const otherPaths = data.others.map((f, i) => `${id}/file-${i + 1}.${OTHER_TYPES[f.type]}`);

    const { error: insertError } = await supabase.from("community_applications").insert({
      id,
      full_name: data.full_name,
      phone: data.phone,
      email: data.email,
      resume_path: resumePath,
      resume_name: data.resume.name,
      work_paths: workPaths,
      // Only sent when used, so the form keeps working where the other-files migration isn't applied yet.
      ...(otherPaths.length ? { other_paths: otherPaths, other_names: data.others.map((f) => f.name) } : {}),
      ip_hash: ipHash,
    });
    if (insertError) {
      if (otherPaths.length && /other_(paths|names)/.test(insertError.message)) {
        return { ok: false, error: "Extra files can't be accepted right now. Please remove them from \"Other files\" and submit again.", fieldErrors: { others: "Not available yet" } };
      }
      throw insertError;
    }

    const uploads: { path: string; token: string }[] = [];
    for (const path of [resumePath, ...workPaths, ...otherPaths]) {
      const { data: signed, error } = await supabase.storage.from(COMMUNITY_BUCKET).createSignedUploadUrl(path);
      if (error || !signed) throw error ?? new Error("No upload URL");
      uploads.push({ path, token: signed.token });
    }
    return { ok: true, id, uploads };
  } catch (err) {
    console.error("[community] start failed", err);
    return { ok: false, error: "We couldn't start your application. Please try again in a moment." };
  }
}

export async function finishApplication(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!UUID.test(id)) return { ok: false, error: "Application not found." };
  try {
    const supabase = serviceClient();
    const { data: row } = await supabase.from("community_applications")
      .select("*").eq("id", id).maybeSingle();
    if (!row) return { ok: false, error: "Application not found." };
    if (row.status !== "incomplete") return { ok: true };
    if (Date.parse(row.created_at) < Date.now() - HOUR) {
      return { ok: false, error: "This upload expired. Please submit the form again." };
    }

    const { data: objects, error: listError } = await supabase.storage.from(COMMUNITY_BUCKET).list(id, { limit: 100 });
    if (listError) throw listError;
    const present = new Set((objects ?? []).map((o) => `${id}/${o.name}`));
    const expected = [row.resume_path as string, ...(row.work_paths as string[]), ...((row.other_paths as string[] | undefined) ?? [])];
    if (!expected.every((p) => present.has(p))) {
      return { ok: false, error: "Some files didn't finish uploading. Please try again." };
    }

    const { error } = await supabase.from("community_applications")
      .update({ status: "new", submitted_at: new Date().toISOString() })
      .eq("id", id).eq("status", "incomplete");
    if (error) throw error;
    return { ok: true };
  } catch (err) {
    console.error("[community] finish failed", err);
    return { ok: false, error: "We couldn't complete your application. Please try again." };
  }
}
