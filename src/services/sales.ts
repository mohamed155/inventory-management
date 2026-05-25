import { unwrap } from '@/lib/ipc.ts';
import type { DataParams } from '@/models/params.ts';
import type { SaleFormData } from '@/models/sales-form.ts';
import type { Sale } from '../../generated/prisma/browser.ts';
import type { SaleWhereInput } from '../../generated/prisma/models/Sale.ts';

export const getAllSalesPaginated = (
  params: DataParams<
    Sale,
    SaleWhereInput & {
      itemsCount?: number;
      totalCost?: number;
      remainingCost?: number;
    }
  >,
) => window.electronAPI.getAllSalesPaginated(params).then(unwrap);

export const getAllSales = () => window.electronAPI.getAllSales().then(unwrap);

export const getSaleById = (id: string) =>
  window.electronAPI.getSaleById(id).then(unwrap);

export const getAllSaleItems = (saleId: string) =>
  window.electronAPI.getAllSaleItems(saleId).then(unwrap);

export const getSalesByCustomerId = (customerId: string) =>
  window.electronAPI.getSalesByCustomerId(customerId).then(unwrap);

export const createSale = (sale: SaleFormData) =>
  window.electronAPI.createSale(sale).then(unwrap);

export const updateSale = (id: string, sale: Partial<Sale>) =>
  window.electronAPI.updateSale(id, sale).then(unwrap);

export const deleteSale = (id: string) =>
  window.electronAPI.deleteSale(id).then(unwrap);
