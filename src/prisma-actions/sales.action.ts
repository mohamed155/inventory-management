// @ts-expect-error
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
        remainingCost: totalCost - sale.paidAmount - sale.discount,
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

export const getAllSales = async (prisma: PrismaClient) => {
  const sales = await prisma.sale.findMany({
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

export const createSale = async (prisma: PrismaClient, body: SaleFormData) => {
  console.log(body);
  return prisma.$transaction(async (tx: PrismaClient) => {
    let customerId: string;
    if (body.customerId) {
      customerId = body.customerId;
    } else {
      const newCustomer = await tx.customer.create({
        data: {
          firstname: body.customerFirstname,
          lastname: body.customerLastname,
          phone: body.customerPhone,
          address: body.customerAddress,
        },
      });
      customerId = newCustomer.id;
    }

    const sale = await tx.sale.create({
      data: {
        paidAmount: body.paidAmount,
        payDueDate: body.payDueDate,
        date: body.date,
        discount: body.discount || 0,
        user: { connect: { id: body.userId } },
        customer: { connect: { id: customerId } },
      },
    });

    for (const product of body.products) {
      let productBatch = await tx.productBatch.findFirst({
        where: {
          productId: product.id,
        },
        orderBy: {
          expirationDate: 'asc',
        },
      });

      if (!productBatch || productBatch.quantity < product.quantity) {
        throw new Error(`Insufficient stock for product`);
      }

      if (productBatch.quantity === product.quantity) {
        productBatch = await tx.productBatch.update({
          where: { id: productBatch.id },
          data: {
            quantity: 0,
          },
        });
      } else {
        productBatch = await tx.productBatch.update({
          where: { id: productBatch.id },
          data: {
            quantity: {
              decrement: product.quantity,
            },
          },
        });
      }

      await tx.saleItem.create({
        data: {
          quantity: product.quantity,
          unitPrice: product.unitPrice,
          sale: { connect: { id: sale.id } },
          product: { connect: { id: product.id } },
          batch: { connect: { id: productBatch.id } },
        },
      });
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

export const deleteSale = (prisma: PrismaClient, id: string) => {
  return prisma.sale.delete({
    where: { id },
  });
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
        productBatch: ProductBatch;
      },
    ) => ({
      ...item.product,
      ...item.productBatch,
      ...item,
    }),
  );
};
