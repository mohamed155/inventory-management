import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { createClient } from '@libsql/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '../../generated/prisma/client.ts'

const migrationsDir = join(process.cwd(), 'prisma/migrations')

async function applyMigrations(
  client: ReturnType<typeof createClient>,
): Promise<void> {
  const migrations = readdirSync(migrationsDir)
    .sort()
    .map((name) => join(migrationsDir, name, 'migration.sql'))
    .filter(existsSync)

  for (const file of migrations) {
    const sql = readFileSync(file, 'utf-8')
    const statements = sql
      .split('\n')
      .filter((line) => !line.trim().startsWith('--'))
      .join('\n')
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean)
    for (const stmt of statements) {
      await client.execute(stmt)
    }
  }
}

export async function createTestPrisma(): Promise<{
  prisma: PrismaClient
  close: () => void
}> {
  const tmpDir = mkdtempSync(join(tmpdir(), 'inv-test-'))
  const dbPath = join(tmpDir, 'test.db')
  const dbUrl = `file:${dbPath}`

  // Apply migrations using a raw client before the Prisma adapter connects
  const migrationClient = createClient({ url: dbUrl })
  await applyMigrations(migrationClient)
  migrationClient.close()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adapter = new PrismaLibSql({ url: dbUrl }) as any
  const prisma = new PrismaClient({ adapter })

  return {
    prisma,
    close: () => {
      rmSync(tmpDir, { recursive: true, force: true })
    },
  }
}

export async function clearDatabase(prisma: PrismaClient): Promise<void> {
  await prisma.saleItem.deleteMany()
  await prisma.purchaseItem.deleteMany()
  await prisma.sale.deleteMany()
  await prisma.purchase.deleteMany()
  await prisma.productBatch.deleteMany()
  await prisma.product.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.provider.deleteMany()
  await prisma.user.deleteMany()
}
