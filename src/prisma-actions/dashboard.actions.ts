// @ts-expect-error -- @prisma/client types are resolved at runtime in the Electron main process
import type { PrismaClient } from '@prisma/client';

export const getTotalSalesAmount = async (prisma: PrismaClient, inventoryId: string) => {
  const result = await prisma.$queryRaw<
    { total: number }[]
  >`SELECT SUM(paidAmount - discount) as total FROM Sale WHERE inventoryId = ${inventoryId}`;
  return result[0].total ?? 0;
};

export const getTotalPurchasesAmount = async (prisma: PrismaClient, inventoryId: string) => {
  const result = await prisma.$queryRaw<
    { total: number }[]
  >`SELECT SUM(paidAmount) as total FROM Purchase WHERE inventoryId = ${inventoryId}`;
  return result[0].total ?? 0;
};

export const getTotalProfit = async (prisma: PrismaClient, inventoryId: string) => {
  const sales = await getTotalSalesAmount(prisma, inventoryId);
  const purchases = await getTotalPurchasesAmount(prisma, inventoryId);
  return sales - purchases;
};

export const getDueFromCustomers = async (
  prisma: PrismaClient,
  inventoryId: string,
): Promise<number> => {
  const result = await prisma.$queryRaw<{ totalDue: number }[]>`
    SELECT SUM(
      (SELECT SUM("quantity" * "unitPrice")
       FROM "SaleItem"
       WHERE "SaleItem"."saleId" = "Sale"."id") - "Sale"."discount" - "Sale"."paidAmount"
    ) as "totalDue"
    FROM "Sale"
    WHERE "Sale"."inventoryId" = ${inventoryId}
  `;

  return result[0]?.totalDue ?? 0;
};

export const getDueToProviders = async (
  prisma: PrismaClient,
  inventoryId: string,
): Promise<number> => {
  const result = await prisma.$queryRaw<{ totalDue: number }[]>`
    SELECT SUM(
      (SELECT SUM("quantity" * "unitPrice")
       FROM "PurchaseItem"
       WHERE "PurchaseItem"."purchaseId" = "Purchase"."id") - "Purchase"."discount" - "Purchase"."paidAmount"
    ) as "totalDue"
    FROM "Purchase"
    WHERE "Purchase"."inventoryId" = ${inventoryId}
  `;

  return result[0]?.totalDue ?? 0;
};

export const getAllOverduePayments = async (
  prisma: PrismaClient,
  inventoryId: string,
): Promise<{
  totalRemainingAmount: number;
  count: number;
}> => {
  const result = await prisma.$queryRaw<
    { totalRemainingAmount: number; count: number }[]
  >`
    SELECT SUM(remaining) as "totalRemainingAmount", COUNT(*) as "count"
    FROM (
      SELECT (
        (SELECT SUM("quantity" * "unitPrice") FROM "SaleItem" WHERE "SaleItem"."saleId" = "Sale"."id")
        - "Sale"."discount" - "Sale"."paidAmount"
      ) as remaining
      FROM "Sale"
      WHERE "payDueDate" < CURRENT_TIMESTAMP
        AND "Sale"."inventoryId" = ${inventoryId}
    ) t
    WHERE remaining > 0
  `;

  return result[0] ?? { totalRemainingAmount: 0, count: 0 };
};

export const getExpiringProducts = async (
  prisma: PrismaClient,
  inventoryId: string,
  days = 10,
): Promise<{ name: string; expirationDate: Date; quantity: number }[]> => {
  const result = await prisma.$queryRaw<
    { name: string; expirationDate: Date; quantity: number }[]
  >`
    SELECT p."name", pb."expirationDate", pb."quantity"
    FROM "ProductBatch" pb
    JOIN "Product" p ON p."id" = pb."productId"
    WHERE pb."expirationDate" IS NOT NULL
      AND pb."expirationDate" <= datetime('now', '+' || ${days} || ' days')
      AND pb."expirationDate" >= datetime('now')
      AND p."inventoryId" = ${inventoryId}
    ORDER BY pb."expirationDate"
  `;
  return result ?? [];
};

export const getLowStockProducts = async (
  prisma: PrismaClient,
  inventoryId: string,
  threshold = 10,
): Promise<{ name: string; totalQuantity: number }[]> => {
  const result = await prisma.$queryRaw<
    { name: string; totalQuantity: number }[]
  >`
    SELECT p."name", SUM(pb."quantity") as "totalQuantity"
    FROM "ProductBatch" pb
    JOIN "Product" p ON p."id" = pb."productId"
    WHERE p."inventoryId" = ${inventoryId}
    GROUP BY p."id", p."name"
    HAVING SUM(pb."quantity") <= ${threshold}
    ORDER BY "totalQuantity"
  `;
  return result ?? [];
};

export const getTopUpcomingPayingCustomers = async (
  prisma: PrismaClient,
  inventoryId: string,
): Promise<
  {
    name: string;
    phone: string;
    payDueDate: Date;
    amountDue: number;
  }[]
> => {
  const result = await prisma.$queryRaw<
    { name: string; phone: string; payDueDate: Date; amountDue: number }[]
  >`
    SELECT *
    FROM (
      SELECT c."firstname" || ' ' || c."lastname" as "name",
             c."phone",
             s."payDueDate",
             (SELECT SUM(si."quantity" * si."unitPrice")
              FROM "SaleItem" si WHERE si."saleId" = s."id") - s."discount" - s."paidAmount" as "amountDue"
      FROM "Sale" s
      JOIN "Customer" c ON c."id" = s."customerId"
      WHERE s."inventoryId" = ${inventoryId}
    )
    WHERE "amountDue" > 0
    ORDER BY "payDueDate"
    LIMIT 5
  `;
  return result ?? [];
};

export const getMonthlyChartData = async (
  prisma: PrismaClient,
  inventoryId: string,
): Promise<
  { month: string; sales: number; purchases: number; profit: number }[]
> => {
  const salesData: { month: string; total: number }[] = await prisma.$queryRaw<
    { month: string; total: number }[]
  >`
    SELECT strftime('%Y-%m', "date") as "month",
           SUM("paidAmount" - "discount") as "total"
    FROM "Sale"
    WHERE "inventoryId" = ${inventoryId}
    GROUP BY strftime('%Y-%m', "date")
    ORDER BY "month"
  `;

  const purchasesData: { month: string; total: number }[] =
    await prisma.$queryRaw<{ month: string; total: number }[]>`
    SELECT strftime('%Y-%m', "date") as "month",
           SUM("paidAmount") as "total"
    FROM "Purchase"
    WHERE "inventoryId" = ${inventoryId}
    GROUP BY strftime('%Y-%m', "date")
    ORDER BY "month"
  `;

  const monthSet = new Set([
    ...salesData.map((r) => r.month),
    ...purchasesData.map((r) => r.month),
  ]);

  const salesMap = new Map(salesData.map((r) => [r.month, Number(r.total)]));
  const purchasesMap = new Map(
    purchasesData.map((r) => [r.month, Number(r.total)]),
  );

  return Array.from(monthSet)
    .sort()
    .map((month) => {
      const sales = salesMap.get(month) ?? 0;
      const purchases = purchasesMap.get(month) ?? 0;
      return { month, sales, purchases, profit: sales - purchases };
    });
};

export const getTopUpcomingPayingProviders = async (
  prisma: PrismaClient,
  inventoryId: string,
): Promise<
  {
    name: string;
    phone: string;
    payDueDate: Date;
    amountDue: number;
  }[]
> => {
  const result = await prisma.$queryRaw<
    { name: string; phone: string; payDueDate: Date; amountDue: number }[]
  >`
    SELECT *
    FROM (
      SELECT p."name",
             p."phone",
             pu."payDueDate",
             (SELECT SUM(pi."quantity" * pi."unitPrice")
              FROM "PurchaseItem" pi WHERE pi."purchaseId" = pu."id") - pu."discount" - pu."paidAmount" as "amountDue"
      FROM "Purchase" pu
      JOIN "Provider" p ON p."id" = pu."providerId"
      WHERE pu."inventoryId" = ${inventoryId}
    )
    WHERE "amountDue" > 0
    ORDER BY "payDueDate"
    LIMIT 5
  `;
  return result ?? [];
};
