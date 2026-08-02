import type { PurchaseEditData } from '@/models/purchase-form.ts';

export type PurchaseEditSource = {
  id: string;
  providerId: string;
  paidAmount: number;
  discount: number;
  payDueDate: Date | string;
  date: Date | string;
};

export type PurchaseItemRow = {
  id?: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  isExpirable: boolean;
  productionDate?: Date | string | null;
  expirationDate?: Date | string | null;
};

const toDate = (value: Date | string) =>
  value instanceof Date ? value : new Date(value);

const toOptionalDate = (value?: Date | string | null) =>
  value === null || value === undefined ? undefined : toDate(value);

export const toPurchaseEditData = (
  purchase: PurchaseEditSource,
  items: PurchaseItemRow[],
): PurchaseEditData => ({
  id: purchase.id,
  providerId: purchase.providerId,
  paidAmount: purchase.paidAmount,
  discount: purchase.discount,
  payDueDate: toDate(purchase.payDueDate),
  date: toDate(purchase.date),
  products: items.map((item) => ({
    id: item.productId,
    isExpirable: item.isExpirable,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    productionDate: toOptionalDate(item.productionDate),
    expirationDate: toOptionalDate(item.expirationDate),
  })),
});
