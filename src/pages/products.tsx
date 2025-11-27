import type { ColumnDef } from '@tanstack/react-table';
import { use, useMemo } from 'react';
import { getAllProducts } from '@/services/products.ts';
import type { Product } from '../../generated/prisma/browser.ts';

function Products() {
  const products = use(getAllProducts());

  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      { accessorKey: 'name', Header: 'Name' },
      { accessorKey: 'description', Header: 'Description' },
      { accessorKey: 'quantity', Header: 'Quantity' },
      { accessorKey: 'createdAt', Header: 'Created At' },
      { accessorKey: 'updatedAt', Header: 'Upadted At' },
    ],
    [],
  );

  return <div>Products</div>;
}

export default Products;
