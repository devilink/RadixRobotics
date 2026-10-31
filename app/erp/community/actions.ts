"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, ForbiddenError } from "@/lib/erp/context";
import { requireCommunityAction } from "@/lib/erp/community";
import { check, failure } from "@/lib/erp/action-utils";
import { COMMUNITY_BUCKET, COMMUNITY_STATUSES, type CommunityStatus } from "@/lib/community";
import type { ActionResult } from "@/lib/erp/types";

const UUID = /^[0-9a-f-]{36}$/i;

export async function reviewApplication(_prev: unknown, fd: FormData): Promise<ActionResult> {
  try {
    await requireCommunityAction();
    const id = String(fd.get("id") ?? "");
    if (!UUID.test(id)) throw new ForbiddenError("Application not found.");
    const status = String(fd.get("status") ?? "") as CommunityStatus;
    if (!COMMUNITY_STATUSES.includes(status)) return { ok: false, error: "Choose a valid status.", fieldErrors: { status: "Choose a status" } };
    const notes = String(fd.get("admin_notes") ?? "").trim();
    if (notes.length > 2000) return { ok: false, error: "Notes are too long.", fieldErrors: { admin_notes: "2000 characters at most" } };

    const supabase = await db();
    const rows = check(await supabase.from("community_applications")
      .update({ status, admin_notes: notes || null }).eq("id", id).select("id"));
    if (!rows?.length) throw new ForbiddenError("Application not found.");
    revalidatePath("/erp/community");
    revalidatePath(`/erp/community/${id}`);
    return { ok: true, message: "Saved." };
  } catch (err) {
    return failure(err);
  }
}

export async function deleteApplication(_prev: unknown, fd: FormData): Promise<ActionResult> {
  try {
    await requireCommunityAction();
    const id = String(fd.get("id") ?? "");
    if (!UUID.test(id)) throw new ForbiddenError("Application not found.");
    const supabase = await db();
    const row = check(await supabase.from("community_applications")
      .select("resume_path, work_paths").eq("id", id).maybeSingle());
    if (!row) throw new ForbiddenError("Application not found.");

    const { error: storageError } = await supabase.storage.from(COMMUNITY_BUCKET)
      .remove([row.resume_path as string, ...(row.work_paths as string[])]);
    if (storageError) throw new ForbiddenError("The files could not be deleted. Please try again.");
    check(await supabase.from("community_applications").delete().eq("id", id));
  } catch (err) {
    return failure(err);
  }
  revalidatePath("/erp/community");
  redirect("/erp/community");
}
