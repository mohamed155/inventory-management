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
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import DashboardCard from '@/components/dashboard-card.tsx';
import {
  getAllOverduePayments,
  getDueFromCustomers,
  getDueToProviders,
  getMonthlyChartData,
  getTotalProfit,
  getTotalPurchasesAmount,
  getTotalSalesAmount,
} from '@/services/dashboard.ts';
function Reports() {
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

  const { data: monthlyChartData } = useQuery({
    queryKey: ['monthlyChartData'],
    queryFn: getMonthlyChartData,
  });

  const chartData = monthlyChartData?.map((item) => ({
    ...item,
    monthLabel: new Date(`${item.month}-01`).toLocaleDateString(undefined, {
      month: 'short',
      year: 'numeric',
    }),
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold pb-2">{t('Reports')}</h2>
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
          count={
            overduePayments?.count ? Number(overduePayments.count) : undefined
          }
          icon={<CircleAlert />}
        />
      </div>

      {chartData && chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="flex flex-col gap-4 bg-white rounded-lg p-4 border border-solid">
            <h6 className="font-normal">{t('Monthly Trends')}</h6>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="monthLabel" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#8884d8"
                  activeDot={{ r: 8 }}
                  name={t('Sales')}
                />
                <Line
                  type="monotone"
                  dataKey="purchases"
                  stroke="#82ca9d"
                  name={t('Purchases')}
                />
                <Line
                  type="monotone"
                  dataKey="profit"
                  stroke="#ff7300"
                  name={t('Profit')}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-4 bg-white rounded-lg p-4 border border-solid">
            <h6 className="font-normal">{t('Monthly Comparison')}</h6>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="monthLabel" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="sales" fill="#8884d8" name={t('Sales')} />
                <Bar dataKey="purchases" fill="#82ca9d" name={t('Purchases')} />
                <Bar dataKey="profit" fill="#ff7300" name={t('Profit')} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reports;
