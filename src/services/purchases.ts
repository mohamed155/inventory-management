import { unwrap } from '@/lib/ipc.ts';
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
) => window.electronAPI.getAllPurchasesPaginated(params).then(unwrap);

export const getAllPurchases = () =>
  window.electronAPI.getAllPurchases().then(unwrap);

export const getPurchaseById = (id: string) =>
  window.electronAPI.getPurchaseById(id).then(unwrap);

export const getAllPurchaseItems = (purchaseId: string) =>
  window.electronAPI.getAllPurchaseItems(purchaseId).then(unwrap);

export const getPurchasesByProviderId = (providerId: string) =>
  window.electronAPI.getPurchasesByProviderId(providerId).then(unwrap);

export const createPurchase = (purchase: PurchaseFormData) =>
  window.electronAPI.createPurchase(purchase).then(unwrap);

export const updatePurchase = (id: string, purchase: Partial<Purchase>) =>
  window.electronAPI.updatePurchase(id, purchase).then(unwrap);

export const deletePurchase = (id: string) =>
  window.electronAPI.deletePurchase(id).then(unwrap);
