import { unwrap } from '@/lib/ipc.ts';
import type { DataParams } from '@/models/params.ts';
import type { Customer } from '../../generated/prisma/browser.ts';
import type { CustomerWhereInput } from '../../generated/prisma/models/Customer.ts';

export const getAllCustomersPaginated = (
  params: DataParams<Customer, CustomerWhereInput>,
) => window.electronAPI.getAllCustomersPaginated(params).then(unwrap);

export const getAllCustomers = () =>
  window.electronAPI.getAllCustomers().then(unwrap);

export const getCustomerById = (id: string) =>
  window.electronAPI.getCustomerById(id).then(unwrap);

export const createCustomer = (customer: Customer) =>
  window.electronAPI.createCustomer(customer).then(unwrap);

export const updateCustomer = (id: string, customer: Customer) =>
  window.electronAPI.updateCustomer(id, customer).then(unwrap);

export const deleteCustomer = (id: string) =>
  window.electronAPI.deleteCustomer(id).then(unwrap);
