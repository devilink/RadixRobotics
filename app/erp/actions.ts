"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CATEGORIES, type Category } from "@/lib/erp/types";
import { CATEGORY_COOKIE, db } from "@/lib/erp/context";

export async function setCategory(value: string) {
  if (!(CATEGORIES as readonly string[]).includes(value)) return;
  // Setting a cookie in a server action re-renders the current route with the new filter.
  (await cookies()).set(CATEGORY_COOKIE, value as Category, {
    path: "/erp",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function signOut() {
  const supabase = await db();
  await supabase.auth.signOut();
  redirect("/login");
}

/** For the login page: whether the signed-in user has any ERP role. */
export async function hasErpAccess(): Promise<boolean> {
  const supabase = await db();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { count } = await supabase
    .from("user_role_assignments")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  return (count ?? 0) > 0;
}
