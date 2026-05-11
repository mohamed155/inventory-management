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
import { useCurrentSettings } from '@/store/settings.store.ts';
import { formatDate } from '@/lib/format-date.ts';
import DashboardCard from '@/components/dashboard-card.tsx';
import {
  Alert,
  AlertBadge,
  AlertDescription,
  AlertSubtitle,
  AlertTitle,
} from '@/components/ui/alert';
import {
  getAllOverduePayments,
  getDueFromCustomers,
  getDueToProviders,
  getExpiringProducts,
  getLowStockProducts,
  getTopUpcomingPayingCustomers,
  getTopUpcomingPayingProviders,
  getTotalProfit,
  getTotalPurchasesAmount,
  getTotalSalesAmount,
} from '@/services/dashboard.ts';

function Dashboard() {
  const { t } = useTranslation();
  const expiryWarningDays = useCurrentSettings((s) => s.expiryWarningDays);
  const lowStockThreshold = useCurrentSettings((s) => s.lowStockThreshold);
  const currency = useCurrentSettings((s) => s.currency);
  const dateFormat = useCurrentSettings((s) => s.dateFormat);

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

  const { data: expiringProducts } = useQuery({
    queryKey: ['expiringProducts', expiryWarningDays],
    queryFn: () => getExpiringProducts(expiryWarningDays),
  });

  const { data: lowStockProducts } = useQuery({
    queryKey: ['lowStockProducts', lowStockThreshold],
    queryFn: () => getLowStockProducts(lowStockThreshold),
  });

  const { data: topCustomers } = useQuery({
    queryKey: ['topUpcomingPayingCustomers'],
    queryFn: getTopUpcomingPayingCustomers,
  });

  const { data: topProviders } = useQuery({
    queryKey: ['topUpcomingPayingProviders'],
    queryFn: getTopUpcomingPayingProviders,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
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
          count={
            overduePayments?.count ? Number(overduePayments.count) : undefined
          }
          icon={<CircleAlert />}
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="flex flex-col gap-4 bg-white rounded-lg p-4 border border-solid">
          <h6 className="font-normal">{t('Products about to expire')}</h6>
          {expiringProducts?.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {t('No products about to expire')}
            </p>
          )}
          {expiringProducts?.map((product) => {
            const daysLeft = Math.ceil(
              (new Date(product.expirationDate).getTime() - Date.now()) /
                (1000 * 60 * 60 * 24),
            );
            return (
              <Alert
                key={`${product.name}-${product.expirationDate}`}
                className="bg-yellow-50 border-yellow-200"
              >
                <AlertTitle>{product.name}</AlertTitle>
                <AlertDescription>
                  {t('Expires')}:{' '}
                  {formatDate(product.expirationDate, dateFormat)}
                </AlertDescription>
                <AlertBadge className="bg-yellow-100 border-yellow-200 text-black">
                  {daysLeft} {daysLeft === 1 ? t('day') : t('days')} {t('left')}
                </AlertBadge>
              </Alert>
            );
          })}
        </div>
        <div className="flex flex-col gap-4 bg-white rounded-lg p-4 border border-solid">
          <h6 className="font-normal">{t('Stock alerts')}</h6>
          {lowStockProducts?.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {t('No stock alerts')}
            </p>
          )}
          {lowStockProducts?.map((product) => {
            const isOutOfStock = product.totalQuantity === 0;
            return (
              <Alert
                key={product.name}
                className={
                  isOutOfStock
                    ? 'bg-red-50 border-red-200'
                    : 'bg-orange-50 border-orange-200'
                }
              >
                <AlertTitle>{product.name}</AlertTitle>
                <AlertDescription>
                  {isOutOfStock ? t('Out of stock') : t('Low stock')}
                </AlertDescription>
                <AlertBadge
                  className={
                    isOutOfStock
                      ? 'bg-red-100 border-red-200 text-black'
                      : 'bg-orange-100 border-orange-200 text-black'
                  }
                >
                  {product.totalQuantity} {t('units')}
                </AlertBadge>
              </Alert>
            );
          })}
        </div>
        <div className="flex flex-col gap-4 bg-white rounded-lg p-4 border border-solid">
          <h6 className="font-normal">
            <Users className="text-purple-500 inline-block me-2" />
            {t('Top 5 customers about to pay')}
          </h6>
          {topCustomers?.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {t('No upcoming customer payments')}
            </p>
          )}
          {topCustomers?.map((customer) => {
            const isOverdue = new Date(customer.payDueDate) < new Date();
            const dueLabel = `${t('Due')}: ${formatDate(customer.payDueDate, dateFormat)}${isOverdue ? ` (${t('Overdue')})` : ''}`;
            return (
              <Alert
                key={`${customer.name}-${customer.payDueDate}`}
                className="bg-red-50 border-red-200"
              >
                <AlertTitle>{customer.name}</AlertTitle>
                <AlertSubtitle>{dueLabel}</AlertSubtitle>
                <AlertDescription>{customer.phone}</AlertDescription>
                <AlertBadge className="bg-red-100 border-red-200 text-black">
                  {customer.amountDue} {t(currency)}
                </AlertBadge>
              </Alert>
            );
          })}
        </div>
        <div className="flex flex-col gap-4 bg-white rounded-lg p-4 border border-solid">
          <h6 className="font-normal">
            <Truck className="text-orange-500 inline-block me-2" />
            {t('Top 5 Providers About to Get Paid')}
          </h6>
          {topProviders?.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {t('No upcoming provider payments')}
            </p>
          )}
          {topProviders?.map((provider) => {
            const isOverdue = new Date(provider.payDueDate) < new Date();
            const dueLabel = `${t('Due')}: ${formatDate(provider.payDueDate, dateFormat)}${isOverdue ? ` (${t('Overdue')})` : ''}`;
            return (
              <Alert
                key={`${provider.name}-${provider.payDueDate}`}
                className="bg-red-50 border-red-200"
              >
                <AlertTitle>{provider.name}</AlertTitle>
                <AlertSubtitle>{dueLabel}</AlertSubtitle>
                <AlertDescription>{provider.phone}</AlertDescription>
                <AlertBadge className="bg-red-100 border-red-200 text-black">
                  {provider.amountDue} {t(currency)}
                </AlertBadge>
              </Alert>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
