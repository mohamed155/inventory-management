// @ts-expect-error
import type { PrismaClient } from '@prisma/client';

export const getTotalSalesAmount = async (prisma: PrismaClient) => {
  const result = await prisma.$queryRaw<
    { total: number }[]
  >`SELECT SUM(paidAmount - discount) as total FROM Sale`;
  return result[0].total ?? 0;
};

export const getTotalPurchasesAmount = async (prisma: PrismaClient) => {
  const result = await prisma.$queryRaw<
    { total: number }[]
  >`SELECT SUM(paidAmount) as total FROM Purchase`;
  return result[0].total ?? 0;
};

export const getTotalProfit = async (prisma: PrismaClient) => {
  const sales = await getTotalSalesAmount(prisma);
  const purchases = await getTotalPurchasesAmount(prisma);
  return sales - purchases;
};

export const getDueFromCustomers = async (
  prisma: PrismaClient,
): Promise<number> => {
  const result = await prisma.$queryRaw<{ totalDue: number }[]>`
		SELECT SUM(
						 (SELECT SUM("quantity" * "unitPrice")
			        FROM "SaleItem"
			        WHERE "SaleItem"."saleId" = "Sale"."id") - "Sale"."discount" - "Sale"."paidAmount"
		       ) as "totalDue"
		FROM "Sale"
	`;

  return result[0]?.totalDue ?? 0;
};

export const getDueToProviders = async (
  prisma: PrismaClient,
): Promise<number> => {
  const result = await prisma.$queryRaw<{ totalDue: number }[]>`
		SELECT SUM(
						 (SELECT SUM("quantity" * "unitPrice")
			        FROM "PurchaseItem"
			        WHERE "PurchaseItem"."purchaseId" = "Purchase"."id") - "Purchase"."paidAmount"
		       ) as "totalDue"
		FROM "Purchase"
	`;

  return result[0]?.totalDue ?? 0;
};

export const getAllOverduePayments = async (
  prisma: PrismaClient,
): Promise<{
  totalRemainingAmount: number;
  count: number;
}> => {
  const result = await prisma.$queryRaw<
    { totalRemainingAmount: number; count: number }[]
  >`
		SELECT SUM(remaining) as "totalRemainingAmount",
		       COUNT(*)       as "count"
		FROM (SELECT (
									 (SELECT SUM("quantity" * "unitPrice")
			              FROM "SaleItem"
			              WHERE "SaleItem"."saleId" = "Sale"."id")
										 - "Sale"."discount"
										 - "Sale"."paidAmount"
									 ) as remaining
		      FROM "Sale"
		      WHERE "payDueDate" < CURRENT_TIMESTAMP) t
		WHERE remaining > 0
	`;

  return result[0] ?? { totalRemainingAmount: 0, count: 0 };
};

export const getExpiringProducts = async (
  prisma: PrismaClient,
): Promise<{ name: string; expirationDate: Date; quantity: number }[]> => {
  const result = await prisma.$queryRaw<
    { name: string; expirationDate: Date; quantity: number }[]
  >`
    SELECT p."name", pb."expirationDate", pb."quantity"
    FROM "ProductBatch" pb
    JOIN "Product" p ON p."id" = pb."productId"
    WHERE pb."expirationDate" <= datetime('now', '+10 days')
      AND pb."expirationDate" >= datetime('now')
    ORDER BY pb."expirationDate"
  `;
  return result ?? [];
};

export const getLowStockProducts = async (
  prisma: PrismaClient,
): Promise<{ name: string; totalQuantity: number }[]> => {
  const result = await prisma.$queryRaw<
    { name: string; totalQuantity: number }[]
  >`
    SELECT p."name", SUM(pb."quantity") as "totalQuantity"
    FROM "ProductBatch" pb
    JOIN "Product" p ON p."id" = pb."productId"
    GROUP BY p."id", p."name"
    HAVING SUM(pb."quantity") <= 10
    ORDER BY "totalQuantity"
  `;
  return result ?? [];
};

export const getTopUpcomingPayingCustomers = async (
  prisma: PrismaClient,
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
              FROM "SaleItem" si
              WHERE si."saleId" = s."id") - s."discount" - s."paidAmount" as "amountDue"
      FROM "Sale" s
      JOIN "Customer" c ON c."id" = s."customerId"
    )
    WHERE "amountDue" > 0
    ORDER BY "payDueDate"
    LIMIT 5
  `;
  return result ?? [];
};

export const getTopUpcomingPayingProviders = async (
  prisma: PrismaClient,
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
              FROM "PurchaseItem" pi
              WHERE pi."purchaseId" = pu."id") - pu."paidAmount" as "amountDue"
      FROM "Purchase" pu
      JOIN "Provider" p ON p."id" = pu."providerId"
    )
    WHERE "amountDue" > 0
    ORDER BY "payDueDate"
    LIMIT 5
  `;
  return result ?? [];
};
