export type PurchaseFormData = {
  userId: string;
  paidAmount: number;
  payDueDate: Date;
  date: Date;
  providerId?: string;
  providerName?: string;
  providerPhone?: string;
  providerAddress?: string;
  products: {
    id?: string;
    name?: string;
    quantity: number;
    unitPrice: number;
    productionDate: Date;
    expirationDate: Date;
  }[];
};
