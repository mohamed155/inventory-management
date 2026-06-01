import type { PurchaseFormData } from '../../src/models/purchase-form.ts'
import type { PrismaClient } from '../../generated/prisma/client.ts'
import { createPurchase } from '../../src/prisma-actions/purchases.action.ts'

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
  }
}

export async function seedPurchase(
  prisma: PrismaClient,
  formData: PurchaseFormData,
) {
  return createPurchase(prisma, formData)
}
