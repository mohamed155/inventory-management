import type { PrismaClient } from '@prisma/client';
import type { DataParams } from '@/models/params.ts';
import type { PurchaseFormData } from '@/models/purchase-form.ts';
import { intersectIds } from '@/util/intersect-ids.ts';
import type {
  Product,
  ProductBatch,
  Provider,
  Purchase,
  PurchaseItem,
  User,
} from '../../generated/prisma/client.ts';
import type { PurchaseWhereInput } from '../../generated/prisma/models/Purchase.ts';

export const getAllPurchasesPaginated = async (
  prisma: PrismaClient,
  {
    page,
    orderDirection,
    orderProperty,
    filter,
  }: DataParams<
    Purchase,
    PurchaseWhereInput & {
      itemsCount?: number;
      totalCost?: number;
      remainingCost?: number;
    }
  >,
) => {
  const [idsByItemsCount, idsByTotalCost, idsByRemainingCost] =
    await Promise.all([
      getPurchaseIdsByItemsCount(prisma, filter?.itemsCount),
      getPurchaseIdsByTotalCost(prisma, filter?.totalCost),
      getPurchaseIdsByRemainingCost(prisma, filter?.remainingCost),
    ]);

  const filteredIds = intersectIds([
    idsByItemsCount,
    idsByTotalCost,
    idsByRemainingCost,
  ]);

  const purchases = await prisma.purchase.findMany({
    where: {
      AND: [
        ...(filter as PurchaseWhereInput[]),
        ...(filteredIds ? [{ id: { in: filteredIds } }] : []),
      ],
    },
    orderBy: orderProperty ? { [orderProperty]: orderDirection } : undefined,
    skip: (page - 1) * 10,
    take: 10,
    include: {
      user: true,
      provider: true,
      _count: { select: { items: true } },
      _sum: { select: { buyPrice: true } },
    },
  });

  const totals: { purchaseId: string; totalCost: number }[] =
    await prisma.$queryRaw<{ purchaseId: string; totalCost: number }[]>`
		SELECT purchaseId,
					 SUM(buyPrice * quantity) as totalCost
		FROM PurchaseItem
		GROUP BY purchaseId
	`;

  const data = purchases.map(
    (
      purchase: Purchase & {
        user: User;
        provider: Provider;
        _count: { items: number };
        _sum: { paidAmount: number };
      },
    ) => {
      const totalCost =
        totals.find((t) => t.purchaseId === purchase.id)?.totalCost ?? 0;
      return {
        ...purchase,
        purchasedBy: `${purchase.user.firstname} ${purchase.user.lastname}`,
        providerName: purchase.provider.name,
        itemsCount: purchase._count.items,
        totalCost,
        remainingCost: totalCost - purchase.paidAmount,
      };
    },
  );

  const total = (await prisma.purchase.count()) as number;
  return { data, total };
};

const getPurchaseIdsByItemsCount = async (
  prisma: PrismaClient,
  itemsCount?: number,
) => {
  if (!itemsCount) return undefined;

  const result = await prisma.purchaseItem.groupBy({
    by: ['purchaseId'],
    _count: { purchaseId: true },
    having: {
      purchaseId: {
        _count: {
          equals: itemsCount,
        },
      },
    },
  });

  return result.map((r: PurchaseItem) => r.purchaseId);
};

const getPurchaseIdsByTotalCost = async (
  prisma: PrismaClient,
  totalCost?: number,
) => {
  if (!totalCost) return undefined;

  const rows = await prisma.$queryRaw<
    { purchaseId: string; totalCost: number }[]
  >`
		SELECT purchaseId,
					 SUM(buyPrice * quantity) as totalCost
		FROM PurchaseItem
		GROUP BY purchaseId
		HAVING (${totalCost ?? 0} IS NULL OR totalCost = ${totalCost ?? 0})
	`;

  return rows.map((r: PurchaseItem) => r.purchaseId);
};

const getPurchaseIdsByRemainingCost = async (
  prisma: PrismaClient,
  remainingCost?: number,
) => {
  if (!remainingCost) return undefined;

  const rows = await prisma.$queryRaw<
    { purchaseId: string; remainingCost: number }[]
  >`
		SELECT p.id                                          as purchaseId,
					 SUM(pi.buyPrice * pi.quantity) - p.paidAmount AS remainingCost
		FROM Purchase p
					 JOIN PurchaseItem pi ON pi.purchaseId = p.id
		WHERE (${remainingCost ?? null} IS NULL OR remainingCost = ${remainingCost ?? 0})
		GROUP BY p.id
	`;

  return rows.map((r: PurchaseItem) => r.purchaseId);
};

export const getAllPurchases = async (prisma: PrismaClient) => {
  const purchases = await prisma.purchase.findMany({
    include: { user: true, provider: true },
  });
  return purchases.map(
    (purchase: Purchase & { user: User; provider: Provider }) => ({
      id: purchase.id,
      name: purchase.provider.name,
    }),
  );
};

export const getPurchaseById = (prisma: PrismaClient, id: string) => {
  return prisma.purchase.findUnique({
    where: { id },
  });
};

export const createPurchase = async (
  prisma: PrismaClient,
  body: PurchaseFormData,
) => {
  let providerId: string;
  if (body.providerId) {
    providerId = body.providerId;
  } else {
    const newProvider = await prisma.provider.create({
      data: {
        name: body.providerName,
        phone: body.providerPhone,
        address: body.providerAddress,
      },
    });
    providerId = newProvider.id;
  }

  const purchase = await prisma.purchase.create({
    data: {
      userId: body.userId,
      paidAmount: body.paidAmount,
      paymentDueDate: body.paymentDueDate,
      purchaseDate: body.purchaseDate,
      providerId,
    },
  });

  for (const product of body.products) {
    if (!product.id) {
      const newProduct = await prisma.product.create({
        data: {
          name: product.name || 'Unnamed Product',
        },
      });
      product.id = newProduct.id;
    }

    let productBatch = await prisma.productBatch.findFirst({
      where: {
        productId: product.id,
        productionDate: product.productionDate,
        expirationDate: product.expirationDate,
      },
    });

    if (!productBatch) {
      productBatch = await prisma.productBatch.create({
        data: {
          productId: product.id,
          productionDate: product.productionDate,
          expirationDate: product.expirationDate,
          quantity: 0,
        },
      });
    }

    await prisma.productBatch.update({
      where: { id: productBatch.id },
      data: {
        quantity: {
          increment: product.quantity,
        },
      },
    });

    await prisma.purchaseItem.create({
      data: {
        purchaseId: purchase.id,
        productId: product.id,
        productBatchId: productBatch.id,
        quantity: product.quantity,
        costPerUnit: product.costPerUnit,
      },
    });
  }

  return purchase;
};

export const updatePurchase = (
  prisma: PrismaClient,
  id: string,
  data: Partial<Purchase>,
) => {
  return prisma.purchase.update({
    where: { id },
    data,
  });
};

export const deletePurchase = (prisma: PrismaClient, id: string) => {
  return prisma.purchase.delete({
    where: { id },
  });
};

export const getAllPurchaseItems = async (
  prisma: PrismaClient,
  purchaseId: string,
) => {
  const items = await prisma.purchaseItem.findMany({
    where: { purchaseId },
    include: {
      product: true,
      productBatch: true,
    },
  });

  return items.map(
    (
      item: PurchaseItem & { product: Product } & {
        productBatch: ProductBatch;
      },
    ) => ({
      ...item.product,
      ...item.productBatch,
      ...item,
    }),
  );
};
