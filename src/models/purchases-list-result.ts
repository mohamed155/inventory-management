import type {
  Purchase,
  User,
} from '../../generated/prisma/client.ts';

export type PurchasesListResult = Purchase & {
  purchasedBy: User;
  providerName: string;
  itemsCount: number;
  totalCost: number;
  remainingCost: number;
};
