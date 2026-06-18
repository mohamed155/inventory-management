import type { PurchaseFormData } from '@/models/purchase-form.ts';
import { createPurchase } from '@/prisma-actions/purchases.action.ts';
import type { PrismaClient } from '../../generated/prisma/client.ts';

export function makePurchaseFormData(
  userId: string,
  providerId: string,
  products: PurchaseFormData['products'],
  overrides: Partial<PurchaseFormData> = {},
): PurchaseFormData {
  return {
    userId,
    providerId,
    paidAmount: 500,
    payDueDate: new Date('2026-12-31'),
    date: new Date('2026-01-01'),
    products,
    ...overrides,
  };
}

export async function seedPurchase(
  prisma: PrismaClient,
  inventoryId: string,
  formData: PurchaseFormData,
) {
  return createPurchase(prisma, inventoryId, formData);
}
