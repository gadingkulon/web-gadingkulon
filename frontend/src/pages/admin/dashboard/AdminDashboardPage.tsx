import { useAuth } from '@/hooks/use-auth';
import { AdminDashboard } from '@/features/infografis/components/AdminDashboard';

export default function AdminDashboardPage() {
  const { user } = useAuth();

  return <AdminDashboard namaPengurus={user?.nama ?? ''} />;
}
