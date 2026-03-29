// @ts-expect-error
import type {PrismaClient} from "@prisma/client";

export const getTotalSales = async (prisma: PrismaClient) => {
	return await prisma.order.aggregate({
		_sum: {
			total: true,
		},
	});
};

export const getTotalPurchases = async (prisma: PrismaClient) => {
	return await prisma.purchase.aggregate({
		_sum: {
			total: true,
		},
	});
}

export const getProfit = async (prisma: PrismaClient) => {
	const sales = await getTotalSales(prisma);
	const purchases = await getTotalPurchases(prisma);
	return (sales._sum.total ?? 0) - (purchases._sum.total ?? 0);
};

export const getDueFromCustomers = async (prisma: PrismaClient) => {
	return await prisma.order.aggregate({
		_sum: {
			remainingCost: true,
		},
	});
};

export const getDueToProviders = async (prisma: PrismaClient) => {
	return await prisma.purchase.aggregate({
		_sum: {
			remainingCost: true,
		},
	});
};

export const getAllOverduePayments = async (prisma: PrismaClient) => {
	

	return {
		total: 0,
		number: 0
	}
}
