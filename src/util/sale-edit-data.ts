import type { SaleEditData } from '@/models/sales-form.ts';

export type SaleEditSource = {
  id: string;
  customerId: string;
  paidAmount: number;
  discount: number;
  payDueDate: Date | string;
  date: Date | string;
};

export type SaleItemRow = {
  id?: string;
  productId: string;
  quantity: number;
  unitPrice: number;
};

const toDate = (value: Date | string) =>
  value instanceof Date ? value : new Date(value);

export const toSaleEditData = (
  sale: SaleEditSource,
  items: SaleItemRow[],
): SaleEditData => {
  const grouped = new Map<string, SaleEditData['products'][number]>();

  for (const item of items) {
    const existing = grouped.get(item.productId);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      grouped.set(item.productId, {
        id: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      });
    }
  }

  return {
    id: sale.id,
    customerId: sale.customerId,
    paidAmount: sale.paidAmount,
    discount: sale.discount,
    payDueDate: toDate(sale.payDueDate),
    date: toDate(sale.date),
    products: [...grouped.values()],
  };
};
