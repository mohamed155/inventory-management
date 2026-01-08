export type PurchaseFormData = {
  userId: string;
  paidAmount: number;
  paymentDueDate: Date;
  purchaseDate: Date;
  providerId?: string;
  providerName?: string;
  providerPhone?: string;
  providerAddress?: string;
  products: {
    id?: string;
    name?: string;
    quantity: number;
    costPerUnit: number;
    productionDate: Date;
    expirationDate: Date;
  }[];
};
