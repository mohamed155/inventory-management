import type { PrismaClient } from '../../generated/prisma/client.ts'

let counter = 0

export function makeCustomer(overrides: Record<string, unknown> = {}) {
  counter++
  return {
    firstname: 'Customer',
    lastname: `${counter}`,
    phone: `010${String(counter).padStart(8, '0')}`,
    address: `${counter} Test Street`,
    ...overrides,
  }
}

export async function seedCustomer(
  prisma: PrismaClient,
  overrides: Record<string, unknown> = {},
) {
  const data = makeCustomer(overrides)
  return prisma.customer.create({
    data: data as Parameters<typeof prisma.customer.create>[0]['data'],
  })
}

export function resetCustomerCounter() {
  counter = 0
}
