import { vi } from 'vitest';

const ok = <T>(data: T) => ({ success: true as const, data });

export function createMockElectronAPI(overrides: Record<string, unknown> = {}) {
  return {
    platform: vi.fn().mockResolvedValue('win32'),
    isMaximized: vi.fn().mockResolvedValue(false),
    onWindowMaximized: vi.fn(),
    closeWindow: vi.fn(),
    maximizeWindow: vi.fn(),
    minimizeWindow: vi.fn(),
    restoreWindow: vi.fn(),
    // dashboard
    getDueFromCustomers: vi.fn().mockResolvedValue(ok(0)),
    getDueToProviders: vi.fn().mockResolvedValue(ok(0)),
    getTotalProfit: vi.fn().mockResolvedValue(ok(0)),
    getTotalPurchasesAmount: vi.fn().mockResolvedValue(ok(0)),
    getTotalSalesAmount: vi.fn().mockResolvedValue(ok(0)),
    getAllOverduePayments: vi
      .fn()
      .mockResolvedValue(ok({ totalRemainingAmount: 0, count: 0 })),
    getExpiringProducts: vi.fn().mockResolvedValue(ok([])),
    getLowStockProducts: vi.fn().mockResolvedValue(ok([])),
    getTopUpcomingPayingCustomers: vi.fn().mockResolvedValue(ok([])),
    getTopUpcomingPayingProviders: vi.fn().mockResolvedValue(ok([])),
    getMonthlyChartData: vi.fn().mockResolvedValue(ok([])),
    // users
    getUsers: vi.fn().mockResolvedValue(ok([])),
    getUserById: vi.fn().mockResolvedValue(ok(null)),
    getUserByUsername: vi.fn().mockResolvedValue(ok(null)),
    getUsersCount: vi.fn().mockResolvedValue(ok(0)),
    createUser: vi.fn().mockResolvedValue(ok({})),
    signIn: vi.fn().mockResolvedValue(ok(null)),
    // products
    getAllProductsPaginated: vi
      .fn()
      .mockResolvedValue(ok({ data: [], total: 0 })),
    getAllProducts: vi.fn().mockResolvedValue(ok([])),
    getProductById: vi.fn().mockResolvedValue(ok(null)),
    createProduct: vi.fn().mockResolvedValue(ok({})),
    updateProduct: vi.fn().mockResolvedValue(ok({})),
    deleteProduct: vi.fn().mockResolvedValue(ok({})),
    // product batches
    getAllProductBatchesPaginated: vi
      .fn()
      .mockResolvedValue(ok({ data: [], total: 0 })),
    getAllProductBatches: vi.fn().mockResolvedValue(ok([])),
    getProductBatchById: vi.fn().mockResolvedValue(ok(null)),
    createProductBatch: vi.fn().mockResolvedValue(ok({})),
    updateProductBatch: vi.fn().mockResolvedValue(ok({})),
    deleteProductBatch: vi.fn().mockResolvedValue(ok({})),
    // customers
    getAllCustomersPaginated: vi
      .fn()
      .mockResolvedValue(ok({ data: [], total: 0 })),
    getAllCustomers: vi.fn().mockResolvedValue(ok([])),
    getCustomerById: vi.fn().mockResolvedValue(ok(null)),
    createCustomer: vi.fn().mockResolvedValue(ok({})),
    updateCustomer: vi.fn().mockResolvedValue(ok({})),
    deleteCustomer: vi.fn().mockResolvedValue(ok({})),
    // providers
    getAllProvidersPaginated: vi
      .fn()
      .mockResolvedValue(ok({ data: [], total: 0 })),
    getAllProviders: vi.fn().mockResolvedValue(ok([])),
    getProviderById: vi.fn().mockResolvedValue(ok(null)),
    createProvider: vi.fn().mockResolvedValue(ok({})),
    updateProvider: vi.fn().mockResolvedValue(ok({})),
    deleteProvider: vi.fn().mockResolvedValue(ok({})),
    // purchases
    getAllPurchasesPaginated: vi
      .fn()
      .mockResolvedValue(ok({ data: [], total: 0 })),
    getAllPurchases: vi.fn().mockResolvedValue(ok([])),
    getPurchaseById: vi.fn().mockResolvedValue(ok(null)),
    createPurchase: vi.fn().mockResolvedValue(ok({})),
    updatePurchase: vi.fn().mockResolvedValue(ok({})),
    deletePurchase: vi.fn().mockResolvedValue(ok({})),
    getAllPurchaseItems: vi.fn().mockResolvedValue(ok([])),
    getPurchasesByProviderId: vi.fn().mockResolvedValue(ok([])),
    // sales
    getAllSalesPaginated: vi.fn().mockResolvedValue(ok({ data: [], total: 0 })),
    getAllSales: vi.fn().mockResolvedValue(ok([])),
    getSaleById: vi.fn().mockResolvedValue(ok(null)),
    createSale: vi.fn().mockResolvedValue(ok({})),
    updateSale: vi.fn().mockResolvedValue(ok({})),
    deleteSale: vi.fn().mockResolvedValue(ok({})),
    getAllSaleItems: vi.fn().mockResolvedValue(ok([])),
    getSalesByCustomerId: vi.fn().mockResolvedValue(ok([])),
    ...overrides,
  };
}

export function stubElectronAPI(overrides: Record<string, unknown> = {}) {
  const mock = createMockElectronAPI(overrides);
  vi.stubGlobal('window', { electronAPI: mock });
  return mock;
}
