import { describe, expect, it } from 'vitest';
import { toPurchaseEditData } from '@/util/purchase-edit-data.ts';

const purchase = {
  id: 'pur-1',
  providerId: 'prov-1',
  paidAmount: 250,
  discount: 10,
  payDueDate: new Date('2026-12-31'),
  date: new Date('2026-01-15'),
};

describe('toPurchaseEditData', () => {
  it('maps the product id from productId, not the merged item id', () => {
    const result = toPurchaseEditData(purchase, [
      {
        id: 'purchase-item-1',
        productId: 'product-1',
        quantity: 8,
        unitPrice: 25,
        isExpirable: true,
        productionDate: new Date('2025-01-01'),
        expirationDate: new Date('2026-12-31'),
      },
    ]);

    expect(result.products[0].id).toBe('product-1');
  });

  it('carries the purchase scalars through', () => {
    const result = toPurchaseEditData(purchase, []);

    expect(result.id).toBe('pur-1');
    expect(result.providerId).toBe('prov-1');
    expect(result.paidAmount).toBe(250);
    expect(result.discount).toBe(10);
    expect(result.payDueDate).toEqual(new Date('2026-12-31'));
    expect(result.date).toEqual(new Date('2026-01-15'));
  });

  it('keeps one entry per item row without merging', () => {
    const result = toPurchaseEditData(purchase, [
      {
        id: 'pi-1',
        productId: 'product-1',
        quantity: 5,
        unitPrice: 10,
        isExpirable: true,
        productionDate: new Date('2025-01-01'),
        expirationDate: new Date('2026-06-30'),
      },
      {
        id: 'pi-2',
        productId: 'product-1',
        quantity: 7,
        unitPrice: 10,
        isExpirable: true,
        productionDate: new Date('2025-05-01'),
        expirationDate: new Date('2026-12-31'),
      },
    ]);

    expect(result.products).toHaveLength(2);
    expect(result.products[0].quantity).toBe(5);
    expect(result.products[1].quantity).toBe(7);
  });

  it('converts null batch dates to undefined', () => {
    const result = toPurchaseEditData(purchase, [
      {
        id: 'pi-1',
        productId: 'product-1',
        quantity: 3,
        unitPrice: 4,
        isExpirable: false,
        productionDate: null,
        expirationDate: null,
      },
    ]);

    expect(result.products[0].productionDate).toBeUndefined();
    expect(result.products[0].expirationDate).toBeUndefined();
    expect(result.products[0].isExpirable).toBe(false);
  });
});
