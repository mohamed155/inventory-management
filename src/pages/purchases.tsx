import { useQuery } from '@tanstack/react-query';
import type {
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
  SortingState,
} from '@tanstack/react-table';
import { endOfDay, startOfDay } from 'date-fns';
import { Edit, Funnel, FunnelX, Plus, Trash2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import DataTable from '@/components/data-table.tsx';
import InvoiceDialog from '@/components/dialogs/invoice-dialog.tsx';
import PurchaseDialog from '@/components/dialogs/purchase-dialog.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button.tsx';
import { useConfirm } from '@/context/confirm-context.tsx';
import type { PurchaseFormData } from '@/models/purchase-form.ts';
import type { PurchasesListResult } from '@/models/purchases-list-result.ts';
import {
  createPurchase,
  deletePurchase,
  getAllPurchasesPaginated,
} from '@/services/purchases.ts';
import type { Purchase } from '../../generated/prisma/browser.ts';
import type { PurchaseWhereInput } from '../../generated/prisma/models/Purchase.ts';

function Purchases() {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState<boolean>(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState<boolean>(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase>();

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
    const providerName = filterMap.get('providerName');
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
      providerName: providerName ? { contains: providerName } : undefined,
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
    } as PurchaseWhereInput;
  }, [filtering, t]);

  const { data, refetch: refetchPurchases } = useQuery({
    queryKey: [
      'purchases',
      pagination.pageIndex,
      pagination.pageSize,
      sorting,
      filtering,
    ],
    queryFn: () =>
      getAllPurchasesPaginated({
        page: pagination.pageIndex + 1,
        orderProperty:
          sorting.length > 0 ? (sorting[0].id as keyof Purchase) : undefined,
        orderDirection:
          sorting.length > 0 ? (sorting[0].desc ? 'desc' : 'asc') : undefined,
        filter,
      }),
    refetchOnWindowFocus: false,
  });

  const performDeletePurchase = useCallback(
    async (id: string) => {
      const confirmDelete = await confirm({
        message: t('Are you sure to delete this record?'),
        variant: 'destructive',
      });
      if (confirmDelete) {
        deletePurchase(id).then(() => {
          refetchPurchases();
        });
      }
    },
    [refetchPurchases, confirm, t],
  );

  const openDetailsDialog = useCallback((purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setDetailsDialogOpen(true);
  }, []);

  const columns = useMemo<ColumnDef<PurchasesListResult>[]>(
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
        accessorKey: 'providerName',
        header: () => t('Provider'),
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
              onClick={() => openDetailsDialog(info.row.original as Purchase)}
            >
              <span className="text-primary">{t('View')}</span>
            </Button>
            <Button variant="outline" className="cursor-pointer">
              <Edit className="text-primary" />
            </Button>
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => performDeletePurchase(info.getValue() as string)}
            >
              <Trash2 className="text-red-600" />
            </Button>
          </div>
        ),
      },
    ],
    [t, performDeletePurchase, openDetailsDialog],
  );

  const handleDialogClose = (purchase?: PurchaseFormData) => {
    if (purchase) {
      createPurchase(purchase).then(() => refetchPurchases());
    }
    setPurchaseDialogOpen(false);
  };

  return (
    <div>
      <PurchaseDialog open={purchaseDialogOpen} onClose={handleDialogClose} />
      <InvoiceDialog
        open={detailsDialogOpen}
        type="purchase"
        data={selectedPurchase as PurchasesListResult & {type: 'purchase'}}
				close={() => setDetailsDialogOpen(false)}
      />
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold pb-2">{t('Purchases')}</h2>
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
            onClick={() => setPurchaseDialogOpen(true)}
          >
            <Plus size={30} />
            {t('Add Purchase')}
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

export default Purchases;
