import { getCurrentUser } from '@/lib/actions/authActions';
import { AdminAuthGate } from '@/components/admin/AdminAuthGate';
import { AdminLayoutClient } from './AdminLayoutClient';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  // RBAC Access Guard: Only staff roles are allowed to access the admin console
  const allowedRoles = ['owner', 'admin', 'editor', 'operator', 'moderator'];

  if (!user || !allowedRoles.includes(user.role)) {
    return <AdminAuthGate />;
  }

  return (
    <AdminLayoutClient user={user}>
      {children}
    </AdminLayoutClient>
  );
}
