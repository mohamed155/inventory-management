import bcrypt from 'bcryptjs'
import type { PrismaClient } from '../../generated/prisma/client.ts'

let counter = 0

export function makeUser(overrides: Record<string, unknown> = {}) {
  counter++
  return {
    firstname: 'Test',
    lastname: `User${counter}`,
    username: `testuser${counter}`,
    password: 'plaintext123',
    ...overrides,
  }
}

export async function seedUser(
  prisma: PrismaClient,
  overrides: Record<string, unknown> = {},
) {
  const data = makeUser(overrides)
  const hashedPassword = await bcrypt.hash(data.password as string, 10)
  return prisma.user.create({
    data: { ...data, password: hashedPassword } as Parameters<
      typeof prisma.user.create
    >[0]['data'],
  })
}

export function resetUserCounter() {
  counter = 0
}
