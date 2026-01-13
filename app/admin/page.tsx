import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

export default async function AdminPage() {
  const session = await getSession();

  if (!session) {
    redirect('/auth/signin');
  }

  // Redirect to content management as default
  redirect('/admin/content');
}
