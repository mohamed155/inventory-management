export type SaleFormData = {
  userId: string;
  paidAmount: number;
  payDueDate: Date;
  date: Date;
  discount?: number;
  customerId?: string;
  customerFirstname?: string;
  customerLastname?: string;
  customerPhone?: string;
  customerAddress?: string;
  products: {
    id: string;
    batchId?: string;
    quantity: number;
    unitPrice: number;
  }[];
};
