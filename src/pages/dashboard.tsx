import { useQuery } from '@tanstack/react-query';
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
import {
  getAllOverduePayments,
  getDueFromCustomers,
  getDueToProviders,
  getTotalProfit,
  getTotalPurchasesAmount,
  getTotalSalesAmount,
} from '@/services/dashboard.ts';

function Dashboard() {
  const { t } = useTranslation();

  const { data: totalSales } = useQuery({
    queryKey: ['totalSalesAmount'],
    queryFn: getTotalSalesAmount,
  });

  const { data: totalPurchases } = useQuery({
    queryKey: ['totalPurchasesAmount'],
    queryFn: getTotalPurchasesAmount,
  });

  const { data: profit } = useQuery({
    queryKey: ['totalProfit'],
    queryFn: getTotalProfit,
  });

  const { data: dueFromCustomers } = useQuery({
    queryKey: ['dueFromCustomers'],
    queryFn: getDueFromCustomers,
  });

  const { data: dueToProviders } = useQuery({
    queryKey: ['dueToProviders'],
    queryFn: getDueToProviders,
  });

  const { data: overduePayments } = useQuery({
    queryKey: ['allOverduePayments'],
    queryFn: getAllOverduePayments,
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold pb-2">{t('Dashboard')}</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <DashboardCard
          title={t('Total sales')}
          value={totalSales ?? 0}
          color="success"
          icon={<DollarSign />}
        />
        <DashboardCard
          title={t('Total Purchases')}
          value={totalPurchases ?? 0}
          color="info"
          icon={<ShoppingCart />}
        />
        <DashboardCard
          title={t('Profit')}
          value={profit ?? 0}
          color="error"
          icon={<TrendingUp />}
        />
        <DashboardCard
          title={t('Due from customers')}
          value={dueFromCustomers ?? 0}
          color="warning"
          icon={<Users />}
        />
        <DashboardCard
          title={t('Due to Providers')}
          value={dueToProviders ?? 0}
          color="warning"
          icon={<Truck />}
        />
        <DashboardCard
          title={t('Overdue payments')}
          value={overduePayments?.totalRemainingAmount ?? 0}
          color="error"
          count={overduePayments?.count ? Number(overduePayments.count) : undefined}
          icon={<CircleAlert />}
        />
      </div>
    </div>
  );
}

export default Dashboard;
