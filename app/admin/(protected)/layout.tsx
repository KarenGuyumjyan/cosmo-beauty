import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import AdminNav from '../_components/AdminNav';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect('/admin/login');

  return (
    <div className="flex min-h-dvh bg-gray-50">
      <AdminNav email={session.user?.email} />
      <main className="flex-1 md:ml-64 min-h-dvh overflow-scroll">
        {children}
      </main>
    </div>
  );
}
