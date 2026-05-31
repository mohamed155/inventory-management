import { unwrap } from '@/lib/ipc.ts';
import type { DataParams } from '@/models/params.ts';
import type { SaleFormData } from '@/models/sales-form.ts';
import { useInventoryStore } from '@/store/inventory.store.ts';
import type { Sale } from '../../generated/prisma/browser.ts';
import type { SaleWhereInput } from '../../generated/prisma/models/Sale.ts';

const getInventoryId = () => useInventoryStore.getState().activeInventoryId ?? '';

export const saleKeys = {
  all: (inventoryId: string) => ['sales', inventoryId] as const,
  paginated: (inventoryId: string, params: unknown) => ['sales', inventoryId, params] as const,
};

export const getAllSalesPaginated = (
  params: DataParams<
    Sale,
    SaleWhereInput & {
      itemsCount?: number;
      totalCost?: number;
      remainingCost?: number;
    }
  >,
) => window.electronAPI.getAllSalesPaginated(getInventoryId(), params).then(unwrap);

export const getAllSales = () =>
  window.electronAPI.getAllSales(getInventoryId()).then(unwrap);

export const getSaleById = (id: string) =>
  window.electronAPI.getSaleById(id).then(unwrap);

export const getAllSaleItems = (saleId: string) =>
  window.electronAPI.getAllSaleItems(saleId).then(unwrap);

export const getSalesByCustomerId = (customerId: string) =>
  window.electronAPI.getSalesByCustomerId(getInventoryId(), customerId).then(unwrap);

export const createSale = (sale: SaleFormData) =>
  window.electronAPI.createSale(getInventoryId(), sale).then(unwrap);

export const updateSale = (id: string, sale: Partial<Sale>) =>
  window.electronAPI.updateSale(id, sale).then(unwrap);

export const deleteSale = (id: string) =>
  window.electronAPI.deleteSale(id).then(unwrap);
