import { describe, expect, it } from 'vitest';
import { toSaleEditData } from '@/util/sale-edit-data.ts';

const sale = {
  id: 'sale-1',
  customerId: 'cust-1',
  paidAmount: 400,
  discount: 20,
  payDueDate: new Date('2026-11-30'),
  date: new Date('2026-02-10'),
};

describe('toSaleEditData', () => {
  it('groups FIFO-split rows of the same product into one line', () => {
    const result = toSaleEditData(sale, [
      { id: 'si-1', productId: 'product-1', quantity: 30, unitPrice: 12 },
      { id: 'si-2', productId: 'product-1', quantity: 15, unitPrice: 12 },
      { id: 'si-3', productId: 'product-1', quantity: 5, unitPrice: 12 },
    ]);

    expect(result.products).toHaveLength(1);
    expect(result.products[0].id).toBe('product-1');
    expect(result.products[0].quantity).toBe(50);
    expect(result.products[0].unitPrice).toBe(12);
  });

  it('keeps distinct products as separate lines in first-seen order', () => {
    const result = toSaleEditData(sale, [
      { id: 'si-1', productId: 'product-a', quantity: 2, unitPrice: 5 },
      { id: 'si-2', productId: 'product-b', quantity: 3, unitPrice: 7 },
      { id: 'si-3', productId: 'product-a', quantity: 4, unitPrice: 5 },
    ]);

    expect(result.products).toHaveLength(2);
    expect(result.products[0].id).toBe('product-a');
    expect(result.products[0].quantity).toBe(6);
    expect(result.products[1].id).toBe('product-b');
    expect(result.products[1].quantity).toBe(3);
  });

  it('maps the product id from productId, not the merged item id', () => {
    const result = toSaleEditData(sale, [
      { id: 'sale-item-1', productId: 'product-9', quantity: 1, unitPrice: 3 },
    ]);

    expect(result.products[0].id).toBe('product-9');
  });

  it('carries the sale scalars through', () => {
    const result = toSaleEditData(sale, []);

    expect(result.id).toBe('sale-1');
    expect(result.customerId).toBe('cust-1');
    expect(result.paidAmount).toBe(400);
    expect(result.discount).toBe(20);
    expect(result.payDueDate).toEqual(new Date('2026-11-30'));
    expect(result.date).toEqual(new Date('2026-02-10'));
  });
});
