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
) => {
  const getAllSalesPaginated = window.electronAPI.getAllSalesPaginated;
  return getAllSalesPaginated(params);
};

export const getAllSales = () => {
  const getAllSales = window.electronAPI.getAllSales;
  return getAllSales();
};

export const getSaleById = (id: string) => {
  const getSaleById = window.electronAPI.getSaleById;
  return getSaleById(id);
};

export const getAllSaleItems = (saleId: string) => {
  const getAllSaleItems = window.electronAPI.getAllSaleItems;
  return getAllSaleItems(saleId);
};

export const createSale = (sale: SaleFormData) => {
  const createSale = window.electronAPI.createSale;
  return createSale(sale);
};

export const updateSale = (id: string, sale: Partial<Sale>) => {
  const updateSale = window.electronAPI.updateSale;
  return updateSale(id, sale);
};

export const deleteSale = (id: string) => {
  const deleteSale = window.electronAPI.deleteSale;
  return deleteSale(id);
};
