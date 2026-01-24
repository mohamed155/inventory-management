import type { DataParams } from '@/models/params.ts';
import type { PurchaseFormData } from '@/models/purchase-form.ts';
import type { Purchase } from '../../generated/prisma/browser.ts';
import type { PurchaseWhereInput } from '../../generated/prisma/models/Purchase.ts';

export const getAllPurchasesPaginated = (
  params: DataParams<
    Purchase,
    PurchaseWhereInput & {
      itemsCount?: number;
      totalCost?: number;
      remainingCost?: number;
    }
  >,
) => {
  const getAllPurchasesPaginated = window.electronAPI.getAllPurchasesPaginated;
  return getAllPurchasesPaginated(params);
};

export const getAllPurchases = () => {
  const getAllPurchases = window.electronAPI.getAllPurchases;
  return getAllPurchases();
};

export const getPurchaseById = (id: string) => {
  const getPurchaseBtId = window.electronAPI.getPurchaseById;
  return getPurchaseBtId(id);
};

export const createPurchase = (provider: PurchaseFormData) => {
  const createPurchase = window.electronAPI.createPurchase;
  return createPurchase(provider);
};

export const updatePurchase = (id: string, provider: Purchase) => {
  const updatePurchase = window.electronAPI.updatePurchase;
  return updatePurchase(id, provider);
};

export const deletePurchase = (id: string) => {
  const deletePurchase = window.electronAPI.deletePurchase;
  return deletePurchase(id);
};
