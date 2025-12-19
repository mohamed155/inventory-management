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
import ProductDialog from '@/components/dialogs/product-dialog.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button.tsx';
import { useConfirm } from '@/context/confirm-context.tsx';
import {
  createProductBatch,
  deleteProductBatch,
  getAllProductBatchesPaginated,
  updateProductBatch,
} from '@/services/products.ts';
import type { Product, ProductBatch } from '../../generated/prisma/browser.ts';
import type { ProductWhereInput } from '../../generated/prisma/models/Product.ts';
import type { ProductBatchWhereInput } from '../../generated/prisma/models/ProductBatch.ts';

function Products() {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<
    Product & ProductBatch
  >();

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [filtering, setFiltering] = useState<ColumnFiltersState>([]);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const filter = useMemo(() => {
    const filterMap = new Map(filtering.map((f) => [f.id, f.value]));

    const quantity = filterMap.get('quantity');
    const productionDate = filterMap.get('productionDate');
    const expirationDate = filterMap.get('expirationDate');
    const name = filterMap.get('name');
    const description = filterMap.get('description');

    return {
      quantity: quantity ? { equals: Number(quantity) } : undefined,
      productionDate: productionDate
        ? {
            gte: startOfDay(new Date(productionDate as string)),
            lte: endOfDay(new Date(productionDate as string)),
          }
        : undefined,
      expirationDate: expirationDate
        ? {
            gte: startOfDay(new Date(expirationDate as string)),
            lte: endOfDay(new Date(expirationDate as string)),
          }
        : undefined,
      product:
        name || description
          ? {
              name: name ? { contains: String(name) } : undefined,
              description: description
                ? {
                    contains: String(description),
                  }
                : undefined,
            }
          : undefined,
    } as ProductBatchWhereInput & { product: ProductWhereInput };
  }, [filtering]);

  const { data, refetch: refetchProducts } = useQuery({
    queryKey: [
      'products',
      pagination.pageIndex,
      pagination.pageSize,
      sorting,
      filtering,
    ],
    queryFn: () =>
      getAllProductBatchesPaginated({
        page: pagination.pageIndex + 1,
        orderProperty:
          sorting.length > 0 ? (sorting[0].id as keyof Product) : undefined,
        orderDirection:
          sorting.length > 0 ? (sorting[0].desc ? 'desc' : 'asc') : undefined,
        filter,
      }),
    refetchOnWindowFocus: false,
  });

  const editProduct = useCallback((product: Product & ProductBatch) => {
    setCurrentProduct(product);
    setDialogOpen(true);
  }, []);

  const deleteProduct = useCallback(
    async (id: string) => {
      const confirmDelete = await confirm({
        message: t('Are you sure to delete this record?'),
        variant: 'destructive',
      });
      if (confirmDelete) {
        deleteProductBatch(id).then(() => {
          refetchProducts();
        });
      }
    },
    [refetchProducts, confirm, t],
  );

  const columns = useMemo<ColumnDef<Product & ProductBatch>[]>(
    () => [
      { accessorKey: 'name', header: () => t('Name') },
      { accessorKey: 'description', header: () => t('Description') },
      {
        accessorKey: 'quantity',
        header: () => t('Quantity'),
        cell: (info) => (
          <Badge
            variant={
              (info.getValue() as number) < 10 ? 'destructive' : 'default'
            }
          >
            {info.getValue() as number}{' '}
            {(info.getValue() as number) > 1 ? t('Units') : t('Unit')}
          </Badge>
        ),
        meta: {
          filterVariant: 'number',
        },
      },
      {
        accessorKey: 'productionDate',
        header: () => t('Production Date'),
        cell: (info) => (info.getValue() as Date).toLocaleDateString('en-GB'),
        meta: {
          filterVariant: 'date',
        },
      },
      {
        accessorKey: 'expirationDate',
        header: () => t('Expire Date'),
        cell: (info) => {
          const expireDate = new Date(info.getValue() as Date);
          const today = new Date();
          const daysUntilExpiry = Math.floor(
            (expireDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
          );
          const isExpiringSoon = daysUntilExpiry <= 30 && daysUntilExpiry > 0;
          const isExpired = daysUntilExpiry <= 0;
          return (
            <span
              className={
                isExpired
                  ? 'text-red-600'
                  : isExpiringSoon
                    ? 'text-yellow-600'
                    : ''
              }
            >
              {expireDate.toLocaleDateString('en-GB')}
              {isExpiringSoon && ` (${daysUntilExpiry} ${t('days')})`}
              {isExpired && ` (${t('Expired')})`}
            </span>
          );
        },
        meta: {
          filterVariant: 'date',
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
              className="cursor-pointer"
              onClick={() =>
                editProduct(info.row.original as Product & ProductBatch)
              }
            >
              <Edit className="text-primary" />
            </Button>
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => deleteProduct(info.getValue() as string)}
            >
              <Trash2 className="text-red-600" />
            </Button>
          </div>
        ),
      },
    ],
    [t, editProduct, deleteProduct],
  );

  const handleDialogClose = (
    productBatch?: Partial<Product & ProductBatch>,
  ) => {
    if (productBatch) {
      if (productBatch?.id) {
        updateProductBatch(
          productBatch.id,
          productBatch as Product & ProductBatch,
        ).then(() => refetchProducts());
      } else {
        createProductBatch(productBatch as Product & ProductBatch).then(() =>
          refetchProducts(),
        );
      }
    }
    setDialogOpen(false);
    setTimeout(() => {
      setCurrentProduct(undefined);
    }, 250);
  };

  return (
    <div>
      <ProductDialog
        open={dialogOpen}
        product={currentProduct}
        onClose={handleDialogClose}
      />
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold pb-2">{t('Products')}</h2>
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
            {t('Add Product')}
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

export default Products;
