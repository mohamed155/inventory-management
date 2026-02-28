import type {
	Sale,
	User
} from '../../generated/prisma/client.ts';

export type SalesListResult = Sale & {
	soldBy: User;
	customerName: string;
	itemsCount: number;
	totalCost: number;
	remainingCost: number;
};
