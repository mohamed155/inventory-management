import type {
  Provider,
  Purchase,
  User,
} from '../../generated/prisma/client.ts';

export type PurchasesListResult = Purchase & {
  purchasedBy: User;
  providerName: Provider;
  itemsCount: number;
  totalCost: number;
  remainingCost: number;
};
