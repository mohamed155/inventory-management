export const getTotalSalesAmount = () =>
  window.electronAPI.getTotalSalesAmount();

export const getTotalPurchasesAmount = () =>
  window.electronAPI.getTotalPurchasesAmount();

export const getTotalProfit = () =>
  window.electronAPI.getTotalProfit();

export const getDueFromCustomers = () =>
  window.electronAPI.getDueFromCustomers();

export const getDueToProviders = () =>
  window.electronAPI.getDueToProviders();

export const getAllOverduePayments = () =>
  window.electronAPI.getAllOverduePayments();

export const getExpiringProducts = (days: number) =>
  window.electronAPI.getExpiringProducts(days);

export const getLowStockProducts = (threshold: number) =>
  window.electronAPI.getLowStockProducts(threshold);

export const getTopUpcomingPayingCustomers = () =>
  window.electronAPI.getTopUpcomingPayingCustomers();

export const getTopUpcomingPayingProviders = () =>
  window.electronAPI.getTopUpcomingPayingProviders();

export const getMonthlyChartData = () =>
  window.electronAPI.getMonthlyChartData();
