import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function CurriculumLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  if (cookieStore.get('curriculum_auth')?.value !== 'true') {
    redirect('/');
  }
  return <>{children}</>
}
