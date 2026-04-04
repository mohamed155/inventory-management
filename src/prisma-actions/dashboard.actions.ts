import type {PrismaClient} from "@prisma/client";
import type {Purchase, PurchaseItem, Sale, SaleItem} from "../../generated/prisma/client.ts";

export const getTotalSalesAmount = async (prisma: PrismaClient) => {
	const result = await prisma.$queryRaw(`SELECT SUM(paidAmount - discount) as total
	                                       FROM Sale`) as { total: number }[];
	return result[0].total ?? 0;
};

export const getTotalPurchasesAmount = async (prisma: PrismaClient) => {
	const result = await prisma.$queryRaw(`SELECT SUM(paidAmount) as total FROM Purchase`) as { total: number }[];
	return result[0].total ?? 0;
}

export const getProfit = async (prisma: PrismaClient) => {
	const sales = await getTotalSalesAmount(prisma);
	const purchases = await getTotalPurchasesAmount(prisma);
	return sales - purchases;
};

export const getDueFromCustomers = async (prisma: PrismaClient) => {
	const sales = await prisma.sale.findMany({
		select: {
			paidAmount: true,
			discount: true,
			items: {
				select: {
					quantity: true,
					unitPrice: true,
				},
			},
		},
	});

	return sales.reduce((total: number, sale: Sale & { items: SaleItem[] }) => {
		const saleItemsTotal = sale.items.reduce(
			(sum: number, item: SaleItem) => sum + item.quantity * item.unitPrice,
			0
		);

		const saleTotalAfterDiscount = saleItemsTotal - sale.discount;
		const due = saleTotalAfterDiscount - sale.paidAmount;

		return total + Math.max(due, 0);
	}, 0);
};

export const getDueToProviders = async (prisma: PrismaClient) => {
	const purchases = await prisma.purchase.findMany({
select: {
	paidAmount: true,
		items: {
		select: {
			quantity: true,
				unitPrice: true,
		},
	},
},
});

return purchases.reduce((total: number, purchase: Purchase & { items: PurchaseItem[] }) => {
	const purchaseItemsTotal = purchase.items.reduce(
		(sum, item) => sum + item.quantity * item.unitPrice,
		0
	);

	const due = purchaseItemsTotal - purchase.paidAmount;

	return total + Math.max(due, 0);
}, 0);
};

export const getAllOverduePayments = async (prisma: PrismaClient) => {
	const overDuePayments = await prisma.sale.findMany({
		where: {
			payDueDate: {
				gt: new Date()
			}
		}
	});

	return {
		total: overDuePayments.reduce((acc: number, payment: Sale) => acc + payment.remainingCost, 0)
		number: 0
	}
}
