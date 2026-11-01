import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLegacyRole } from "@/lib/auth/legacy";
import { loadStudentHub } from "@/lib/student/hub";
import StudentHub from "./StudentHub";

export const metadata: Metadata = {
  title: "My Profile | Radix Robotics",
  robots: { index: false, follow: false },
};

/** Student home: profile, progress & badges, projects with blueprints, and the virtual lab. */
export default async function ProfilePage() {
  const me = await getLegacyRole();
  if (!me) redirect("/login");
  if (me.role !== "student") {
    // Only students have a profile here; send everyone else to their own home.
    if (me.role === "super_admin") redirect("/super-admin");
    if (me.role === "school_admin" && me.schoolId) redirect(`/curriculum/${me.schoolId}`);
    redirect("/erp");
  }
  const data = await loadStudentHub(me.userId, me.schoolId);
  return <StudentHub data={data} />;
}
