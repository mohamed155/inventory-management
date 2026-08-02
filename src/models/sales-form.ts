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

export type SaleEditData = {
  id: string;
  customerId: string;
  paidAmount: number;
  discount: number;
  payDueDate: Date;
  date: Date;
  products: {
    id: string;
    quantity: number;
    unitPrice: number;
  }[];
};
