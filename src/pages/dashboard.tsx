import {
  CircleAlert,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Truck,
  Users,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import DashboardCard from '@/components/dashboard-card.tsx';

function Dashboard() {
  const { t } = useTranslation();

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold pb-2">{t('Dashboard')}</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <DashboardCard
          title={t('Total sales')}
          value={12345}
          color="success"
          icon={<DollarSign />}
        />
        <DashboardCard
          title={t('Total Purchases')}
          value={678}
          color="info"
          icon={<ShoppingCart />}
        />
        <DashboardCard
          title={t('Profit')}
          value={90}
          color="error"
          icon={<TrendingUp />}
        />
        <DashboardCard
          title={t('Due from customers')}
          value={45}
          color="warning"
          icon={<Users />}
        />
        <DashboardCard
          title={t('Due to Providers')}
          value={45}
          color="warning"
          icon={<Truck />}
        />
        <DashboardCard
          title={t('Overdue payments')}
          value={45}
          color="error"
          count={6}
          icon={<CircleAlert />}
        />
      </div>
    </div>
  );
}

export default Dashboard;
