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
import ProviderDialog from '@/components/provider-dialog.tsx';
import { Button } from '@/components/ui/button.tsx';
import { useConfirm } from '@/context/confirm-context.tsx';
import {
  createProvider,
  deleteProvider,
  getAllProvidersPaginated,
  updateProvider,
} from '@/services/providers.ts';
import type { Provider } from '../../generated/prisma/browser.ts';
import type { ProviderWhereInput } from '../../generated/prisma/models/Provider.ts';

function Providers() {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentProvider, setCurrentProvider] = useState<Provider>();

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [filtering, setFiltering] = useState<ColumnFiltersState>([]);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const filter = useMemo(() => {
    const filterMap = new Map(filtering.map((f) => [f.id, f.value]));

    const name = filterMap.get('name');
    const phone = filterMap.get('phone');
    const address = filterMap.get('address');

    return {
      name: name ? { contains: name } : undefined,
      phone: phone ? { contains: phone } : undefined,
      address: address ? { contains: address } : undefined,
    } as ProviderWhereInput;
  }, [filtering]);

  const { data, refetch: refetchProviders } = useQuery({
    queryKey: [
      'providers',
      pagination.pageIndex,
      pagination.pageSize,
      sorting,
      filtering,
    ],
    queryFn: () =>
      getAllProvidersPaginated({
        page: pagination.pageIndex + 1,
        orderProperty:
          sorting.length > 0 ? (sorting[0].id as keyof Provider) : undefined,
        orderDirection:
          sorting.length > 0 ? (sorting[0].desc ? 'desc' : 'asc') : undefined,
        filter,
      }),
    refetchOnWindowFocus: false,
  });

  const editProvider = useCallback((provider: Provider) => {
    setCurrentProvider(provider);
    setDialogOpen(true);
  }, []);

  const handleDeleteProvider = useCallback(
    async (id: string) => {
      const confirmDelete = await confirm({
        message: t('Are you sure to delete this record?'),
        variant: 'destructive',
      });
      if (confirmDelete) {
        deleteProvider(id).then(() => {
          refetchProviders();
        });
      }
    },
    [refetchProviders, confirm, t],
  );

  const columns = useMemo<ColumnDef<Provider>[]>(
    () => [
      { accessorKey: 'name', header: () => t('Name') },
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
              onClick={() => editProvider(info.row.original as Provider)}
            >
              <Edit className="text-primary" />
            </Button>
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => handleDeleteProvider(info.getValue() as string)}
            >
              <Trash2 className="text-red-600" />
            </Button>
          </div>
        ),
      },
    ],
    [t, editProvider, handleDeleteProvider],
  );

  const handleDialogClose = (provider?: Partial<Provider>) => {
    if (provider) {
      if (provider?.id) {
        updateProvider(provider.id, provider as Provider).then(() =>
          refetchProviders(),
        );
      } else {
        createProvider(provider as Provider).then(() => refetchProviders());
      }
    }
    setDialogOpen(false);
    setTimeout(() => {
      setCurrentProvider(undefined);
    }, 250);
  };

  return (
    <div>
      <ProviderDialog
        open={dialogOpen}
        provider={currentProvider}
        onClose={handleDialogClose}
      />
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold pb-2">{t('Providers')}</h2>
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
            {t('Add Provider')}
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

export default Providers;
