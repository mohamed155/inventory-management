import { useQuery } from '@tanstack/react-query';
import type {
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
  SortingState,
} from '@tanstack/react-table';
import { Edit, Funnel, FunnelX, Plus, Trash2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import DataTable from '@/components/data-table.tsx';
import CustomerDialog from '@/components/dialogs/customer-dialog.tsx';
import { Button } from '@/components/ui/button.tsx';
import { useConfirm } from '@/context/confirm-context.tsx';
import {
  createCustomer,
  deleteCustomer,
  getAllCustomersPaginated,
  updateCustomer,
} from '@/services/customers.ts';
import type { Customer } from '../../generated/prisma/browser.ts';
import type { CustomerWhereInput } from '../../generated/prisma/models/Customer.ts';

function Customers() {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<Customer>();

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [filtering, setFiltering] = useState<ColumnFiltersState>([]);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const filter = useMemo(() => {
    const filterMap = new Map(filtering.map((f) => [f.id, f.value]));

    const firstname = filterMap.get('firstname');
    const lastname = filterMap.get('lastname');
    const phone = filterMap.get('phone');
    const address = filterMap.get('address');

    return {
      firstname: firstname ? { contains: firstname } : undefined,
      lastname: lastname ? { contains: lastname } : undefined,
      phone: phone ? { contains: phone } : undefined,
      address: address ? { contains: address } : undefined,
    } as CustomerWhereInput;
  }, [filtering]);

  const { data, refetch: refetchCustomers } = useQuery({
    queryKey: [
      'customers',
      pagination.pageIndex,
      pagination.pageSize,
      sorting,
      filtering,
    ],
    queryFn: () =>
      getAllCustomersPaginated({
        page: pagination.pageIndex + 1,
        orderProperty:
          sorting.length > 0 ? (sorting[0].id as keyof Customer) : undefined,
        orderDirection:
          sorting.length > 0 ? (sorting[0].desc ? 'desc' : 'asc') : undefined,
        filter,
      }),
    refetchOnWindowFocus: false,
  });

  const editCustomer = useCallback((customer: Customer) => {
    setCurrentCustomer(customer);
    setDialogOpen(true);
  }, []);

  const handleDeleteCustomer = useCallback(
    async (id: string) => {
      const confirmDelete = await confirm({
        message: t('Are you sure to delete this record?'),
        variant: 'destructive',
      });
      if (confirmDelete) {
        deleteCustomer(id).then(() => {
          refetchCustomers();
        });
      }
    },
    [refetchCustomers, confirm, t],
  );

  const columns = useMemo<ColumnDef<Customer>[]>(
    () => [
      { accessorKey: 'firstname', header: () => t('First Name') },
      { accessorKey: 'lastname', header: () => t('Last Name') },
      { accessorKey: 'phone', header: () => t('Phone') },
      { accessorKey: 'address', header: () => t('Address') },
      {
        accessorKey: 'id',
        header: () => t('Actions'),
        enableSorting: false,
        enableColumnFilter: false,
        cell: (info) => (
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => editCustomer(info.row.original as Customer)}
            >
              <Edit className="text-primary" />
            </Button>
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => handleDeleteCustomer(info.getValue() as string)}
            >
              <Trash2 className="text-red-600" />
            </Button>
          </div>
        ),
      },
    ],
    [t, editCustomer, handleDeleteCustomer],
  );

  const handleDialogClose = (customer?: Partial<Customer>) => {
    if (customer) {
      if (customer?.id) {
        updateCustomer(customer.id, customer as Customer).then(() =>
          refetchCustomers(),
        );
      } else {
        createCustomer(customer as Customer).then(() => refetchCustomers());
      }
    }
    setDialogOpen(false);
    setTimeout(() => {
      setCurrentCustomer(undefined);
    }, 250);
  };

  return (
    <div>
      <CustomerDialog
        open={dialogOpen}
        customer={currentCustomer}
        onClose={handleDialogClose}
      />
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold pb-2">{t('Customers')}</h2>
        <div className="flex items-center gap-2">
          <Button
            variant={showFilters ? 'outline' : 'default'}
            className="border-primary border-2"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? <FunnelX /> : <Funnel />}
          </Button>
          <Button
            className="bg-primary text-white"
            onClick={() => setDialogOpen(true)}
          >
            <Plus size={30} />
            {t('Add Customer')}
          </Button>
        </div>
      </div>
      <DataTable
        data={data?.data}
        total={data?.total || 0}
        columns={columns}
        showFilters={showFilters}
        pagination={pagination}
        onPaginationChange={setPagination}
        sorting={sorting}
        onSortingChange={setSorting}
        columnFilters={filtering}
        onColumnFiltersChange={setFiltering}
      />
    </div>
  );
}

export default Customers;
