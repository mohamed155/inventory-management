// @ts-expect-error -- @prisma/client types are resolved at runtime in the Electron main process
import type { PrismaClient } from '@prisma/client';
import type {
  Customer,
  Product,
  ProductBatch,
  Sale,
  SaleItem,
  User,
} from '../../generated/prisma/client.ts';
import type { SaleWhereInput } from '../../generated/prisma/models/Sale.ts';
import type { DataParams } from '../models/params.ts';
import type { SaleFormData } from '../models/sales-form.ts';
import { intersectIds } from '../util/intersect-ids.ts';

type SaleOrderKey =
  | keyof Sale
  | 'customerName'
  | 'itemsCount'
  | 'totalCost'
  | 'remainingCost'
  | 'soldBy'
  | 'status';

const buildSaleOrderBy = (
  orderProperty?: SaleOrderKey,
  orderDirection?: 'asc' | 'desc',
) => {
  if (!orderProperty || !orderDirection) return undefined;

  switch (orderProperty) {
    case 'customerName':
      return { customer: { firstname: orderDirection } };

    case 'soldBy':
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

export const getAllSalesPaginated = async (
  prisma: PrismaClient,
  inventoryId: string,
  {
    page,
    orderDirection,
    orderProperty,
    filter,
  }: DataParams<
    Sale & {
      totalCost?: number;
      remainingCost?: number;
    },
    SaleWhereInput & {
      itemsCount?: number;
      totalCost?: number;
      remainingCost?: number;
    }
  >,
) => {
  const [idsByItemsCount, idsByTotalCost, idsByRemainingCost] =
    await Promise.all([
      getSaleIdsByItemsCount(prisma, filter?.itemsCount),
      getSaleIdsByTotalCost(prisma, filter?.totalCost),
      getSaleIdsByRemainingCost(prisma, filter?.remainingCost),
    ]);

  const filteredIds = intersectIds([
    idsByItemsCount,
    idsByTotalCost,
    idsByRemainingCost,
  ]);

  const where = {
    AND: [
      { inventoryId },
      filter as SaleWhereInput,
      ...(filteredIds ? [{ id: { in: filteredIds } }] : []),
    ],
  } satisfies SaleWhereInput;

  const isComputedSort =
    orderProperty === 'totalCost' || orderProperty === 'remainingCost';

  const sales = await prisma.sale.findMany({
    where,
    orderBy: isComputedSort
      ? undefined
      : buildSaleOrderBy(orderProperty as SaleOrderKey, orderDirection),
    skip: isComputedSort ? undefined : (page - 1) * 10,
    take: isComputedSort ? undefined : 10,
    include: {
      user: true,
      customer: true,
      _count: { select: { items: true } },
    },
  });

  const totals: { saleId: string; totalCost: number }[] =
    await prisma.$queryRaw<{ saleId: string; totalCost: number }[]>`
		SELECT saleId,
				 SUM(unitPrice * quantity) as totalCost
		FROM SaleItem
		GROUP BY saleId
	`;

  const dataUnpaged = sales.map(
    (
      sale: Sale & {
        user: User;
        customer: Customer;
        _count: { items: number };
      },
    ) => {
      const totalCost =
        totals.find((t) => t.saleId === sale.id)?.totalCost ?? 0;

      return {
        ...sale,
        soldBy: `${sale.user.firstname} ${sale.user.lastname}`,
        customerName: `${sale.customer.firstname} ${sale.customer.lastname}`,
        itemsCount: sale._count.items,
        totalCost: totalCost - sale.discount,
        remainingCost: totalCost - sale.discount - sale.paidAmount,
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

  const total = await prisma.sale.count({ where });

  return { data, total };
};

const getSaleIdsByItemsCount = async (
  prisma: PrismaClient,
  itemsCount?: number,
) => {
  if (!itemsCount) return undefined;

  const result = await prisma.saleItem.groupBy({
    by: ['saleId'],
    _count: { saleId: true },
    having: {
      saleId: {
        _count: {
          equals: itemsCount,
        },
      },
    },
  });

  return result.map((r: SaleItem) => r.saleId);
};

const getSaleIdsByTotalCost = async (
  prisma: PrismaClient,
  totalCost?: number,
) => {
  if (!totalCost) return undefined;

  const rows = await prisma.$queryRaw<{ saleId: string; totalCost: number }[]>`
		SELECT saleId,
				 SUM(unitPrice * quantity) as totalCost
		FROM SaleItem
		GROUP BY saleId
		HAVING (${totalCost ?? 0} IS NULL OR totalCost = ${totalCost ?? 0})
	`;

  return rows.map((r: SaleItem) => r.saleId);
};

const getSaleIdsByRemainingCost = async (
  prisma: PrismaClient,
  remainingCost?: number,
) => {
  if (!remainingCost) return undefined;

  const rows = await prisma.$queryRaw<
    { saleId: string; remainingCost: number }[]
  >`
		SELECT s.id                                          as saleId,
				 SUM(si.unitPrice * si.quantity) - s.paidAmount - s.discount AS remainingCost
		FROM Sale s
				 JOIN SaleItem si ON si.saleId = s.id
		WHERE (${remainingCost ?? null} IS NULL OR remainingCost = ${remainingCost ?? 0})
		GROUP BY s.id
	`;

  return rows.map((r: SaleItem) => r.saleId);
};

export const getAllSales = async (
  prisma: PrismaClient,
  inventoryId: string,
) => {
  const sales = await prisma.sale.findMany({
    where: { inventoryId },
    include: { user: true, customer: true },
  });
  return sales.map((sale: Sale & { user: User; customer: Customer }) => ({
    id: sale.id,
    name: `${sale.customer.firstname} ${sale.customer.lastname}`,
  }));
};

export const getSaleById = (prisma: PrismaClient, id: string) => {
  return prisma.sale.findUnique({
    where: { id },
  });
};

export const createSale = async (
  prisma: PrismaClient,
  inventoryId: string,
  body: SaleFormData,
) => {
  return prisma.$transaction(async (tx: PrismaClient) => {
    let customerId: string;
    if (body.customerId) {
      const customer = await tx.customer.findFirst({
        where: { id: body.customerId, inventoryId },
        select: { id: true },
      });
      if (!customer) {
        throw new Error('Customer not found in selected inventory');
      }
      customerId = body.customerId;
    } else {
      const customer = await tx.customer.upsert({
        where: {
          inventoryId_phone: { inventoryId, phone: body.customerPhone },
        },
        update: {},
        create: {
          firstname: body.customerFirstname,
          lastname: body.customerLastname,
          phone: body.customerPhone,
          address: body.customerAddress,
          inventory: { connect: { id: inventoryId } },
        },
      });
      customerId = customer.id;
    }

    const sale = await tx.sale.create({
      data: {
        paidAmount: body.paidAmount,
        payDueDate: body.payDueDate,
        date: body.date,
        discount: body.discount || 0,
        inventory: { connect: { id: inventoryId } },
        user: { connect: { id: body.userId } },
        customer: { connect: { id: customerId } },
      },
    });

    for (const product of body.products) {
      const existingProduct = await tx.product.findFirst({
        where: { id: product.id, inventoryId },
        select: { id: true },
      });
      if (!existingProduct) {
        throw new Error('Product not found in selected inventory');
      }

      const batches = await tx.productBatch.findMany({
        where: { productId: product.id, quantity: { gt: 0 } },
        orderBy: [
          { expirationDate: { sort: 'asc', nulls: 'last' } },
          { productionDate: { sort: 'asc', nulls: 'last' } },
          { createdAt: 'asc' },
        ],
      });

      const totalAvailable = batches.reduce(
        (sum: number, b: ProductBatch) => sum + b.quantity,
        0,
      );
      if (totalAvailable < product.quantity) {
        throw new Error(`Insufficient stock for product`);
      }

      let remaining = product.quantity;
      for (const batch of batches as ProductBatch[]) {
        if (remaining <= 0) break;
        const deduct = Math.min(batch.quantity, remaining);

        await tx.productBatch.update({
          where: { id: batch.id },
          data: { quantity: { decrement: deduct } },
        });

        await tx.saleItem.create({
          data: {
            quantity: deduct,
            unitPrice: product.unitPrice,
            sale: { connect: { id: sale.id } },
            product: { connect: { id: product.id } },
            batch: { connect: { id: batch.id } },
          },
        });

        remaining -= deduct;
      }
    }

    return sale;
  });
};

export const updateSale = (
  prisma: PrismaClient,
  id: string,
  data: Partial<Sale>,
) => {
  return prisma.sale.update({
    where: { id },
    data,
  });
};

export const deleteSale = async (prisma: PrismaClient, id: string) => {
  const items = await prisma.saleItem.findMany({
    where: { saleId: id },
    select: { batchId: true, quantity: true },
  });

  return prisma.$transaction([
    ...items.map((item: { batchId: string; quantity: number }) =>
      prisma.productBatch.update({
        where: { id: item.batchId },
        data: { quantity: { increment: item.quantity } },
      }),
    ),
    prisma.sale.delete({ where: { id } }),
  ]);
};

export const getSalesByCustomerId = async (
  prisma: PrismaClient,
  inventoryId: string,
  customerId: string,
) => {
  const sales = await prisma.sale.findMany({
    where: { customerId, inventoryId },
    include: { items: { include: { product: true } } },
    orderBy: { date: 'desc' },
  });

  return sales.map(
    (sale: Sale & { items: (SaleItem & { product: Product })[] }) => {
      const totalCost =
        sale.items.reduce(
          (sum, item) => sum + item.unitPrice * item.quantity,
          0,
        ) - sale.discount;
      const remainingCost = totalCost - sale.paidAmount;
      return {
        id: sale.id,
        date: sale.date,
        payDueDate: sale.payDueDate,
        totalCost,
        paidAmount: sale.paidAmount,
        remainingCost,
        items: sale.items.map((item) => ({
          name: item.product.name,
          quantity: item.quantity,
        })),
      };
    },
  );
};

export const getAllSaleItems = async (prisma: PrismaClient, saleId: string) => {
  const items = await prisma.saleItem.findMany({
    where: { saleId },
    include: {
      product: true,
      batch: true,
    },
  });

  return items.map(
    (
      item: SaleItem & { product: Product } & {
        batch: ProductBatch;
      },
    ) => ({
      ...item.product,
      ...item.batch,
      ...item,
    }),
  );
};
