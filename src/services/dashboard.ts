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

export const getExpiringProducts = () =>
  window.electronAPI.getExpiringProducts();

export const getLowStockProducts = () =>
  window.electronAPI.getLowStockProducts();

export const getTopUpcomingPayingCustomers = () =>
  window.electronAPI.getTopUpcomingPayingCustomers();

export const getTopUpcomingPayingProviders = () =>
  window.electronAPI.getTopUpcomingPayingProviders();
