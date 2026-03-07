import { useQuery } from '@tanstack/react-query';
import type {
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
  SortingState,
} from '@tanstack/react-table';
import { endOfDay, startOfDay } from 'date-fns';
import { Edit, Funnel, FunnelX, Plus, Trash2 } from 'lucide-react';
import { Activity, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import DataTable from '@/components/data-table.tsx';
import InvoiceDialog from '@/components/dialogs/invoice-dialog.tsx';
import SaleDialog from '@/components/dialogs/sale-dialog.tsx';
import UpdatePaymentDialog from '@/components/dialogs/update-payment-dialog.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button.tsx';
import { useConfirm } from '@/context/confirm-context.tsx';
import type { SaleFormData } from '@/models/sales-form.ts';
import type { SalesListResult } from '@/models/sales-list-result.ts';
import {
  createSale,
  deleteSale,
  getAllSalesPaginated,
  updateSale,
} from '@/services/sales.ts';
import type { Sale } from '../../generated/prisma/browser.ts';
import type { SaleWhereInput } from '../../generated/prisma/models/Sale.ts';

function Sales() {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const [saleDialogOpen, setSaleDialogOpen] = useState<boolean>(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState<boolean>(false);
  const [updatePaymentOpen, setUpdatePaymentOpen] = useState<boolean>(false);
  const [selectedSale, setSelectedSale] = useState<Sale>();

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [filtering, setFiltering] = useState<ColumnFiltersState>([]);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const filter = useMemo(() => {
    const filterMap = new Map(filtering.map((f) => [f.id, f.value]));

    const date = filterMap.get('date');
    const customerName = filterMap.get('customerName');
    const itemsCount = filterMap.get('itemsCount');
    const totalCost = filterMap.get('totalCost');
    const paidAmount = filterMap.get('paidAmount');
    const remainingCost = filterMap.get('remainingCost');
    const status = filterMap.get('status');

    return {
      date: date
        ? {
            gte: startOfDay(new Date(date as string)),
            lte: endOfDay(new Date(date as string)),
          }
        : undefined,
      customer: customerName
        ? {
            is: {
              OR: [
                { firstname: { contains: customerName } },
                { lastname: { contains: customerName } },
              ],
            },
          }
        : undefined,
      itemsCount: itemsCount ? { equals: Number(itemsCount) } : undefined,
      totalCost: totalCost ? { equals: Number(totalCost) } : undefined,
      paidAmount: paidAmount ? { equals: Number(paidAmount) } : undefined,
      remainingCost: remainingCost
        ? { equals: Number(remainingCost) }
        : status === t('Partial')
          ? { gt: 0 }
          : status === t('Paid')
            ? { eq: 0 }
            : undefined,
    } as SaleWhereInput;
  }, [filtering, t]);

  const { data, refetch: refetchSales } = useQuery({
    queryKey: [
      'sales',
      pagination.pageIndex,
      pagination.pageSize,
      sorting,
      filtering,
    ],
    queryFn: () =>
      getAllSalesPaginated({
        page: pagination.pageIndex + 1,
        orderProperty:
          sorting.length > 0 ? (sorting[0].id as keyof Sale) : undefined,
        orderDirection:
          sorting.length > 0 ? (sorting[0].desc ? 'desc' : 'asc') : undefined,
        filter,
      }),
    refetchOnWindowFocus: false,
  });

  const performDeleteSale = useCallback(
    async (id: string) => {
      const confirmDelete = await confirm({
        message: t('Are you sure to delete this record?'),
        variant: 'destructive',
      });
      if (confirmDelete) {
        deleteSale(id).then(() => {
          refetchSales();
        });
      }
    },
    [refetchSales, confirm, t],
  );

  const openDetailsDialog = useCallback((sale: Sale) => {
    setSelectedSale(sale);
    setDetailsDialogOpen(true);
  }, []);

  const openUpdatePaymentDialog = useCallback((sale: Sale) => {
    setSelectedSale(sale);
    setUpdatePaymentOpen(true);
  }, []);

  const columns = useMemo<ColumnDef<SalesListResult>[]>(
    () => [
      {
        accessorKey: 'date',
        header: () => t('Date'),
        cell: (info) => (info.getValue() as Date)?.toLocaleDateString('en-GB'),
        meta: {
          filterVariant: 'date',
        },
      },
      {
        accessorKey: 'customerName',
        header: () => t('Customer'),
      },
      {
        accessorKey: 'itemsCount',
        header: () => t('Products'),
        cell: (info) => `${info.getValue()} ${t('Products')}`,
      },
      {
        accessorKey: 'totalCost',
        header: () => t('Total Cost'),
        cell: (info) => `$ ${info.getValue()}`,
      },
      {
        accessorKey: 'paidAmount',
        header: () => t('Paid'),
        cell: (info) => `$ ${info.getValue()}`,
      },
      {
        accessorKey: 'remainingCost',
        header: () => t('Remaining'),
        cell: (info) => `$ ${info.getValue()}`,
      },
      {
        id: 'status',
        header: () => t('Status'),
        cell: (info) => {
          const { totalCost, paidAmount } = info.row.original;
          return (
            <Badge
              variant={totalCost - paidAmount > 0 ? 'secondary' : 'default'}
            >
              {totalCost - paidAmount > 0 ? t('Partial') : t('Paid')}
            </Badge>
          );
        },
        meta: {
          filterVariant: 'select',
          filterOptions: [t('all'), t('paid'), t('partial')],
        },
      },
      {
        accessorKey: 'id',
        header: () => t('Actions'),
        enableSorting: false,
        enableColumnFilter: false,
        cell: (info) => (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => openDetailsDialog(info.row.original as Sale)}
            >
              <span className="text-primary">{t('View')}</span>
            </Button>
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => openUpdatePaymentDialog(info.row.original as Sale)}
            >
              <Edit className="text-primary" />
            </Button>
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => performDeleteSale(info.getValue() as string)}
            >
              <Trash2 className="text-red-600" />
            </Button>
          </div>
        ),
      },
    ],
    [t, performDeleteSale, openDetailsDialog, openUpdatePaymentDialog],
  );

  const handleDialogClose = (sale?: SaleFormData) => {
    if (sale) {
      createSale(sale).then(() => refetchSales());
    }
    setSaleDialogOpen(false);
  };

  const handleUpdatePayment = (data?: {
    remainingCost: number;
    payDueDate: Date;
  }) => {
    if (data && selectedSale) {
      updateSale(selectedSale?.id, {
        paidAmount: data.remainingCost,
        payDueDate: data.payDueDate,
      }).then(() => refetchSales());
    }
    setUpdatePaymentOpen(false);
  };

  return (
    <div>
      <SaleDialog open={saleDialogOpen} onClose={handleDialogClose} />
      <Activity mode={selectedSale ? 'visible' : 'hidden'}>
        <InvoiceDialog
          open={detailsDialogOpen}
          type="sale"
          data={
            { ...selectedSale, type: 'sale' } as SalesListResult & {
              type: 'sale';
            }
          }
          close={() => setDetailsDialogOpen(false)}
        />
        <UpdatePaymentDialog
          open={updatePaymentOpen}
          type="sale"
          data={
            { ...selectedSale, type: 'sale' } as SalesListResult & {
              type: 'sale';
            }
          }
          onClose={handleUpdatePayment}
        />
      </Activity>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold pb-2">{t('Sales')}</h2>
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
            onClick={() => setSaleDialogOpen(true)}
          >
            <Plus size={30} />
            {t('Add Sale')}
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

export default Sales;
