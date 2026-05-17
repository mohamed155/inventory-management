import { vi } from 'vitest'

export function createMockElectronAPI(
  overrides: Record<string, unknown> = {},
) {
  return {
    platform: vi.fn().mockResolvedValue('win32'),
    isMaximized: vi.fn().mockResolvedValue(false),
    onWindowMaximized: vi.fn(),
    closeWindow: vi.fn(),
    maximizeWindow: vi.fn(),
    minimizeWindow: vi.fn(),
    restoreWindow: vi.fn(),
    // dashboard
    getDueFromCustomers: vi.fn().mockResolvedValue(0),
    getDueToProviders: vi.fn().mockResolvedValue(0),
    getTotalProfit: vi.fn().mockResolvedValue(0),
    getTotalPurchasesAmount: vi.fn().mockResolvedValue(0),
    getTotalSalesAmount: vi.fn().mockResolvedValue(0),
    getAllOverduePayments: vi
      .fn()
      .mockResolvedValue({ totalRemainingAmount: 0, count: 0 }),
    getExpiringProducts: vi.fn().mockResolvedValue([]),
    getLowStockProducts: vi.fn().mockResolvedValue([]),
    getTopUpcomingPayingCustomers: vi.fn().mockResolvedValue([]),
    getTopUpcomingPayingProviders: vi.fn().mockResolvedValue([]),
    // users
    getUsers: vi.fn().mockResolvedValue([]),
    getUserById: vi.fn().mockResolvedValue(null),
    getUserByUsername: vi.fn().mockResolvedValue(null),
    getUsersCount: vi.fn().mockResolvedValue(0),
    createUser: vi.fn().mockResolvedValue({}),
    signIn: vi.fn().mockResolvedValue(null),
    // products
    getAllProductsPaginated: vi.fn().mockResolvedValue({ data: [], total: 0 }),
    getAllProducts: vi.fn().mockResolvedValue([]),
    getProductById: vi.fn().mockResolvedValue(null),
    createProduct: vi.fn().mockResolvedValue({}),
    updateProduct: vi.fn().mockResolvedValue({}),
    deleteProduct: vi.fn().mockResolvedValue({}),
    // product batches
    getAllProductBatchesPaginated: vi
      .fn()
      .mockResolvedValue({ data: [], total: 0 }),
    getAllProductBatches: vi.fn().mockResolvedValue([]),
    getProductBatchById: vi.fn().mockResolvedValue(null),
    createProductBatch: vi.fn().mockResolvedValue({}),
    updateProductBatch: vi.fn().mockResolvedValue({}),
    deleteProductBatch: vi.fn().mockResolvedValue({}),
    // customers
    getAllCustomersPaginated: vi
      .fn()
      .mockResolvedValue({ data: [], total: 0 }),
    getAllCustomers: vi.fn().mockResolvedValue([]),
    getCustomerById: vi.fn().mockResolvedValue(null),
    createCustomer: vi.fn().mockResolvedValue({}),
    updateCustomer: vi.fn().mockResolvedValue({}),
    deleteCustomer: vi.fn().mockResolvedValue({}),
    // providers
    getAllProvidersPaginated: vi
      .fn()
      .mockResolvedValue({ data: [], total: 0 }),
    getAllProviders: vi.fn().mockResolvedValue([]),
    getProviderById: vi.fn().mockResolvedValue(null),
    createProvider: vi.fn().mockResolvedValue({}),
    updateProvider: vi.fn().mockResolvedValue({}),
    deleteProvider: vi.fn().mockResolvedValue({}),
    // purchases
    getAllPurchasesPaginated: vi
      .fn()
      .mockResolvedValue({ data: [], total: 0 }),
    getAllPurchases: vi.fn().mockResolvedValue([]),
    getPurchaseById: vi.fn().mockResolvedValue(null),
    createPurchase: vi.fn().mockResolvedValue({}),
    updatePurchase: vi.fn().mockResolvedValue({}),
    deletePurchase: vi.fn().mockResolvedValue({}),
    getAllPurchaseItems: vi.fn().mockResolvedValue([]),
    // sales
    getAllSalesPaginated: vi.fn().mockResolvedValue({ data: [], total: 0 }),
    getAllSales: vi.fn().mockResolvedValue([]),
    getSaleById: vi.fn().mockResolvedValue(null),
    createSale: vi.fn().mockResolvedValue({}),
    updateSale: vi.fn().mockResolvedValue({}),
    deleteSale: vi.fn().mockResolvedValue({}),
    getAllSaleItems: vi.fn().mockResolvedValue([]),
    ...overrides,
  }
}

export function stubElectronAPI(overrides: Record<string, unknown> = {}) {
  const mock = createMockElectronAPI(overrides)
  vi.stubGlobal('window', { electronAPI: mock })
  return mock
}
