import type { DataParams } from '@/models/params.ts';
import type { Customer } from '../../generated/prisma/browser.ts';
import type { CustomerWhereInput } from '../../generated/prisma/models/Customer.ts';

export const getAllCustomersPaginated = (
  params: DataParams<Customer, CustomerWhereInput>,
) => {
  const getAllCustomersPaginated = window.electronAPI.getAllCustomersPaginated;
  return getAllCustomersPaginated(params);
};

export const getAllCustomers = () => {
  const getAllCustomers = window.electronAPI.getAllCustomers;
  return getAllCustomers();
};

export const getCustomerById = (id: string) => {
  const getCustomerBtId = window.electronAPI.getCustomerById;
  return getCustomerBtId(id);
};

export const createCustomer = (customer: Customer) => {
  const createCustomer = window.electronAPI.createCustomer;
  return createCustomer(customer);
};

export const updateCustomer = (id: string, customer: Customer) => {
  const updateCustomer = window.electronAPI.updateCustomer;
  return updateCustomer(id, customer);
};

export const deleteCustomer = (id: string) => {
  const deleteCustomer = window.electronAPI.deleteCustomer;
  return deleteCustomer(id);
};
