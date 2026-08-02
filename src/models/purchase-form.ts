export type PurchaseFormData = {
  userId: string;
  paidAmount: number;
  discount?: number;
  payDueDate: Date;
  date: Date;
  providerId?: string;
  providerName?: string;
  providerPhone?: string;
  providerAddress?: string;
  products: {
    id?: string;
    name?: string;
    isExpirable?: boolean;
    quantity: number;
    unitPrice: number;
    productionDate?: Date;
    expirationDate?: Date;
  }[];
};

export type PurchaseEditData = {
  id: string;
  providerId: string;
  paidAmount: number;
  discount: number;
  payDueDate: Date;
  date: Date;
  products: {
    id: string;
    isExpirable: boolean;
    quantity: number;
    unitPrice: number;
    productionDate?: Date;
    expirationDate?: Date;
  }[];
};
