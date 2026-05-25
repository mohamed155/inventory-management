import { unwrap } from '@/lib/ipc.ts';

export const getTotalSalesAmount = () =>
  window.electronAPI.getTotalSalesAmount().then(unwrap);

export const getTotalPurchasesAmount = () =>
  window.electronAPI.getTotalPurchasesAmount().then(unwrap);

export const getTotalProfit = () =>
  window.electronAPI.getTotalProfit().then(unwrap);

export const getDueFromCustomers = () =>
  window.electronAPI.getDueFromCustomers().then(unwrap);

export const getDueToProviders = () =>
  window.electronAPI.getDueToProviders().then(unwrap);

export const getAllOverduePayments = () =>
  window.electronAPI.getAllOverduePayments().then(unwrap);

export const getExpiringProducts = (days: number) =>
  window.electronAPI.getExpiringProducts(days).then(unwrap);

export const getLowStockProducts = (threshold: number) =>
  window.electronAPI.getLowStockProducts(threshold).then(unwrap);

export const getTopUpcomingPayingCustomers = () =>
  window.electronAPI.getTopUpcomingPayingCustomers().then(unwrap);

export const getTopUpcomingPayingProviders = () =>
  window.electronAPI.getTopUpcomingPayingProviders().then(unwrap);

export const getMonthlyChartData = () =>
  window.electronAPI.getMonthlyChartData().then(unwrap);
