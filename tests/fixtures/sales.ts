import type { SaleFormData } from '../../src/models/sales-form.ts'
import type { PrismaClient } from '../../generated/prisma/client.ts'
import { createSale } from '../../src/prisma-actions/sales.action.ts'

export function makeSaleFormData(
  userId: string,
  customerId: string,
  products: SaleFormData['products'],
  overrides: Partial<SaleFormData> = {},
): SaleFormData {
  return {
    userId,
    customerId,
    paidAmount: 200,
    payDueDate: new Date('2026-12-31'),
    date: new Date('2026-01-01'),
    discount: 0,
    products,
    ...overrides,
  }
}

export async function seedSale(prisma: PrismaClient, formData: SaleFormData) {
  return createSale(prisma, formData)
}
