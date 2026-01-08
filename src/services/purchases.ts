import type { DataParams } from '@/models/params.ts';
import type { Purchase } from '../../generated/prisma/browser.ts';
import type { PurchaseWhereInput } from '../../generated/prisma/models/Purchase.ts';

export const getAllPurchasesPaginated = (
  params: DataParams<
    Purchase,
    PurchaseWhereInput & {
      itemsCount?: number;
      totalCost?: number;
      remainingCost?: number;
    }
  >,
) => {
  const getAllPurchasesPaginated = window.electronAPI.getAllPurchasesPaginated;
  return getAllPurchasesPaginated(params);
};
