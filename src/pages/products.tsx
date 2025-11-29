import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import DataTable from '@/components/data-table.tsx';
import { Button } from '@/components/ui/button.tsx';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.tsx';
import { getAllProducts } from '@/services/products.ts';
import type { Product } from '../../generated/prisma/browser.ts';

function Products() {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ['products', page],
    queryFn: () => getAllProducts({ page: page + 1 }),
  });

  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      { accessorKey: 'name', Header: 'Name' },
      { accessorKey: 'description', Header: 'Description' },
      { accessorKey: 'quantity', Header: 'Quantity' },
      { accessorKey: 'createdAt', Header: 'Created At' },
      { accessorKey: 'updatedAt', Header: 'Updated At' },
    ],
    [],
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold pb-2">{t('Products')}</h2>
        <Button
          className="bg-primary text-white"
          onClick={() => setDialogOpen(true)}
        >
          <Plus size={30} />
          {t('Add Product')}
        </Button>
      </div>
      <DataTable data={data} columns={columns} pageChanged={setPage} />
    </div>
  );
}

export default Products;
