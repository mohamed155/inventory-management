import type { PrismaClient } from '../../generated/prisma/client.ts'

let counter = 0

export function makeProvider(overrides: Record<string, unknown> = {}) {
  counter++
  return {
    name: `Provider ${counter}`,
    phone: `011${String(counter).padStart(8, '0')}`,
    address: `${counter} Provider Street`,
    ...overrides,
  }
}

export async function seedProvider(
  prisma: PrismaClient,
  overrides: Record<string, unknown> = {},
) {
  const data = makeProvider(overrides)
  return prisma.provider.create({
    data: data as Parameters<typeof prisma.provider.create>[0]['data'],
  })
}

export function resetProviderCounter() {
  counter = 0
}
