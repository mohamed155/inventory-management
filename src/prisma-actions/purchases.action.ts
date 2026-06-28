// @ts-expect-error -- @prisma/client types are resolved at runtime in the Electron main process
import type { PrismaClient } from '@prisma/client';
import type {
  Product,
  ProductBatch,
  Provider,
  Purchase,
  PurchaseItem,
  User,
} from '../../generated/prisma/client.ts';
import type { PurchaseWhereInput } from '../../generated/prisma/models/Purchase.ts';
import type { DataParams } from '../models/params.ts';
import type { PurchaseFormData } from '../models/purchase-form.ts';
import { intersectIds } from '../util/intersect-ids.ts';

type PurchaseOrderKey =
  | keyof Purchase
  | 'providerName'
  | 'itemsCount'
  | 'totalCost'
  | 'remainingCost'
  | 'purchasedBy'
  | 'status';

const buildPurchaseOrderBy = (
  orderProperty?: PurchaseOrderKey,
  orderDirection?: 'asc' | 'desc',
) => {
  if (!orderProperty || !orderDirection) return undefined;

  switch (orderProperty) {
    case 'providerName':
      return { provider: { name: orderDirection } };

    case 'purchasedBy':
      return { user: { firstname: orderDirection } };

    case 'itemsCount':
      return { items: { _count: orderDirection } };

    case 'totalCost':
    case 'remainingCost':
    case 'status':
      return undefined;

    default:
      return {
        [orderProperty]: orderDirection,
      };
  }
};

export const getAllPurchasesPaginated = async (
  prisma: PrismaClient,
  inventoryId: string,
  {
    page,
    orderDirection,
    orderProperty,
    filter,
  }: DataParams<
    Purchase & {
      totalCost?: number;
      remainingCost?: number;
    },
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

  const where = {
    AND: [
      { inventoryId },
      filter as PurchaseWhereInput,
      ...(filteredIds ? [{ id: { in: filteredIds } }] : []),
    ],
  } satisfies PurchaseWhereInput;

  const isComputedSort =
    orderProperty === 'totalCost' || orderProperty === 'remainingCost';

  const purchases = await prisma.purchase.findMany({
    where,
    orderBy: isComputedSort
      ? undefined
      : buildPurchaseOrderBy(orderProperty as PurchaseOrderKey, orderDirection),
    skip: isComputedSort ? undefined : (page - 1) * 10,
    take: isComputedSort ? undefined : 10,
    include: {
      user: true,
      provider: true,
      _count: { select: { items: true } },
    },
  });

  const totals: { purchaseId: string; totalCost: number }[] =
    await prisma.$queryRaw<{ purchaseId: string; totalCost: number }[]>`
		SELECT purchaseId,
					 SUM(unitPrice * quantity) as totalCost
		FROM PurchaseItem
		GROUP BY purchaseId
	`;

  const dataUnpaged = purchases.map(
    (
      purchase: Purchase & {
        user: User;
        provider: Provider | null;
        _count: { items: number };
      },
    ) => {
      const totalCost =
        totals.find((t) => t.purchaseId === purchase.id)?.totalCost ?? 0;

      return {
        ...purchase,
        purchasedBy: `${purchase.user.firstname} ${purchase.user.lastname}`,
        providerName: purchase.provider?.name ?? '',
        itemsCount: purchase._count.items,
        totalCost,
        remainingCost: totalCost - purchase.paidAmount,
      };
    },
  );

  const data = isComputedSort
    ? dataUnpaged
        .sort(
          (
            a: { totalCost: number; remainingCost: number },
            b: { totalCost: number; remainingCost: number },
          ) => {
            const key = orderProperty as 'totalCost' | 'remainingCost';
            const dir = orderDirection === 'desc' ? -1 : 1;
            return (a[key] - b[key]) * dir;
          },
        )
        .slice((page - 1) * 10, page * 10)
    : dataUnpaged;

  const total = await prisma.purchase.count({ where });

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
					 SUM(unitPrice * quantity) as totalCost
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
					 SUM(pi.unitPrice * pi.quantity) - p.paidAmount AS remainingCost
		FROM Purchase p
					 JOIN PurchaseItem pi ON pi.purchaseId = p.id
		WHERE (${remainingCost ?? null} IS NULL OR remainingCost = ${remainingCost ?? 0})
		GROUP BY p.id
	`;

  return rows.map((r: PurchaseItem) => r.purchaseId);
};

export const getAllPurchases = async (
  prisma: PrismaClient,
  inventoryId: string,
) => {
  const purchases = await prisma.purchase.findMany({
    where: { inventoryId },
    include: { user: true, provider: true },
  });
  return purchases.map(
    (purchase: Purchase & { user: User; provider: Provider | null }) => ({
      id: purchase.id,
      name: purchase.provider?.name ?? '',
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
  inventoryId: string,
  body: PurchaseFormData,
) => {
  return prisma.$transaction(async (tx: PrismaClient) => {
    let providerId: string;
    if (body.providerId) {
      const provider = await tx.provider.findFirst({
        where: { id: body.providerId, inventoryId },
        select: { id: true },
      });
      if (!provider) {
        throw new Error('Provider not found in selected inventory');
      }
      providerId = body.providerId;
    } else {
      const provider = await tx.provider.upsert({
        where: {
          inventoryId_phone: { inventoryId, phone: body.providerPhone },
        },
        update: {},
        create: {
          name: body.providerName,
          phone: body.providerPhone,
          address: body.providerAddress,
          inventory: { connect: { id: inventoryId } },
        },
      });
      providerId = provider.id;
    }

    const purchase = await tx.purchase.create({
      data: {
        paidAmount: body.paidAmount,
        payDueDate: body.payDueDate,
        date: body.date,
        inventory: { connect: { id: inventoryId } },
        user: { connect: { id: body.userId } },
        provider: { connect: { id: providerId } },
      },
    });

    for (const product of body.products) {
      if (!product.id) {
        const newProduct = await tx.product.create({
          data: {
            name: product.name || 'Unnamed Product',
            inventory: { connect: { id: inventoryId } },
          },
        });
        product.id = newProduct.id;
      } else {
        const existingProduct = await tx.product.findFirst({
          where: { id: product.id, inventoryId },
          select: { id: true },
        });
        if (!existingProduct) {
          throw new Error('Product not found in selected inventory');
        }
      }

      let productBatch = await tx.productBatch.findFirst({
        where: {
          productId: product.id,
          productionDate: product.productionDate ?? null,
          expirationDate: product.expirationDate ?? null,
        },
      });

      if (!productBatch) {
        productBatch = await tx.productBatch.create({
          data: {
            productId: product.id,
            productionDate: product.productionDate ?? null,
            expirationDate: product.expirationDate ?? null,
            quantity: product.quantity,
          },
        });
      } else {
        productBatch = await tx.productBatch.update({
          where: { id: productBatch.id },
          data: {
            quantity: {
              increment: product.quantity,
            },
          },
        });
      }

      await tx.purchaseItem.create({
        data: {
          quantity: product.quantity,
          unitPrice: product.unitPrice,
          purchase: { connect: { id: purchase.id } },
          product: { connect: { id: product.id } },
          batch: { connect: { id: productBatch.id } },
        },
      });

      await tx.product.update({
        where: { id: product.id },
        data: { unitPrice: product.unitPrice },
      });
    }

    return purchase;
  });
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

export const deletePurchase = async (prisma: PrismaClient, id: string) => {
  const items = await prisma.purchaseItem.findMany({
    where: { purchaseId: id },
    select: {
      batchId: true,
      quantity: true,
      batch: { select: { quantity: true } },
    },
  });

  const consumedItem = items.find(
    (item: { quantity: number; batch: { quantity: number } }) =>
      item.batch.quantity < item.quantity,
  );
  if (consumedItem) {
    throw new Error(
      'Cannot delete purchase because some purchased stock has already been sold',
    );
  }

  return prisma.$transaction([
    ...items.map((item: { batchId: string; quantity: number }) =>
      prisma.productBatch.update({
        where: { id: item.batchId },
        data: { quantity: { decrement: item.quantity } },
      }),
    ),
    prisma.purchase.delete({ where: { id } }),
  ]);
};

export const getPurchasesByProviderId = async (
  prisma: PrismaClient,
  inventoryId: string,
  providerId: string,
) => {
  const purchases = await prisma.purchase.findMany({
    where: { providerId, inventoryId },
    include: { items: { include: { product: true } } },
    orderBy: { date: 'desc' },
  });

  return purchases.map(
    (
      purchase: Purchase & { items: (PurchaseItem & { product: Product })[] },
    ) => {
      const totalCost = purchase.items.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0,
      );
      const remainingCost = totalCost - purchase.paidAmount;
      return {
        id: purchase.id,
        date: purchase.date,
        payDueDate: purchase.payDueDate,
        totalCost,
        paidAmount: purchase.paidAmount,
        remainingCost,
        items: purchase.items.map((item) => ({
          name: item.product.name,
          quantity: item.quantity,
        })),
      };
    },
  );
};

export const getAllPurchaseItems = async (
  prisma: PrismaClient,
  purchaseId: string,
) => {
  const items = await prisma.purchaseItem.findMany({
    where: { purchaseId },
    include: {
      product: true,
      batch: true,
    },
  });

  return items.map(
    (
      item: PurchaseItem & { product: Product } & {
        batch: ProductBatch;
      },
    ) => ({
      ...item.product,
      ...item.batch,
      ...item,
    }),
  );
};
