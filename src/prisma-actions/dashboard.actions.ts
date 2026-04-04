// @ts-expect-error
import type {PrismaClient} from "@prisma/client";

export const getTotalSalesAmount = async (prisma: PrismaClient) => {
	const result = await prisma.$queryRaw(`SELECT SUM(paidAmount - discount) as total
	                                       FROM Sale`) as { total: number }[];
	return result[0].total ?? 0;
};

export const getTotalPurchasesAmount = async (prisma: PrismaClient) => {
	const result = await prisma.$queryRaw(`
		SELECT SUM(paidAmount) as total
		FROM Purchase`) as { total: number }[];
	return result[0].total ?? 0;
}

export const getTotalProfit = async (prisma: PrismaClient) => {
	const sales = await getTotalSalesAmount(prisma);
	const purchases = await getTotalPurchasesAmount(prisma);
	return sales - purchases;
};

export const getDueFromCustomers = async (prisma: PrismaClient): Promise<number> => {
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

export const getDueToProviders = async (prisma: PrismaClient): Promise<number> => {
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

export const getAllOverduePayments = async (prisma: PrismaClient): Promise<{
	totalRemainingAmount: number;
	count: number
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

	return result[0] ?? {totalRemainingAmount: 0, count: 0};
};
