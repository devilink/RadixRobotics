import { getStudentsBySchoolId } from "@/app/actions/schoolAdminActions";
import StudentManager from "@/app/components/StudentManager";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{
    school_id: string;
  }>;
}

export default async function SchoolAdminDashboard({ params }: PageProps) {
  const { school_id } = await params;

  if (!school_id) {
    notFound();
  }

  // Await the server action to get the initial list of students mapped to emails
  const students = await getStudentsBySchoolId(school_id);

  return (
    <StudentManager initialStudents={students} schoolId={school_id} />
  );
}
