import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  useReactTable,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { Activity, useMemo, useState } from 'react';
import { uuid } from 'zod';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination.tsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table.tsx';

function DataTable<T>({
  data,
  columns,
}: {
  data: T[];
  columns: ColumnDef<T>[];
}) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const table = useReactTable<T>({
    columns,
    data,
    debugTable: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    state: { pagination },
  });

  const visiblePages = useMemo(() => {
    const totalPages = table.getPageCount();
    const currentPage = pagination.pageIndex;
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages + 2) {
      return Array.from({ length: totalPages }, (_, i) => i);
    }

    if (currentPage < 3) {
      return [0, 1, 2, 3, 4];
    }

    if (currentPage > totalPages - 4) {
      return [
        totalPages - 5,
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
      ];
    }

    return [
      currentPage - 2,
      currentPage - 1,
      currentPage,
      currentPage + 1,
      currentPage + 2,
    ];
  }, [pagination.pageIndex, table.getPageCount]);

  const showStartEllipsis = useMemo(() => {
    return table.getPageCount() > 7 && !visiblePages.includes(0);
  }, [table.getPageCount, visiblePages]);

  const showEndEllipsis = useMemo(() => {
    const lastPage = table.getPageCount() - 1;
    return table.getPageCount() > 7 && !visiblePages.includes(lastPage);
  }, [table.getPageCount, visiblePages]);

  const goToPreviousPage = () => {
    setPagination((prev) => ({ ...prev, pageIndex: prev.pageIndex - 1 }));
  };

  const goToNextPage = () => {
    setPagination((prev) => ({ ...prev, pageIndex: prev.pageIndex + 1 }));
  };

  const goToPage = (pageIndex: number) => {
    setPagination((prev) => ({ ...prev, pageIndex }));
  };

  return (
    <>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} colSpan={header.colSpan}>
                  <div
                    {...{
                      className: header.column.getCanSort()
                        ? 'cursor-pointer select-none'
                        : '',
                      onClick: header.column.getToggleSortingHandler(),
                    }}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                    {{ asc: <ArrowUp />, desc: <ArrowDown /> }[
                      header.column.getIsSorted() as string
                    ] ?? null}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious onClick={goToPreviousPage} />
          </PaginationItem>
          <Activity mode={showStartEllipsis ? 'visible' : 'hidden'}>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          </Activity>
          {visiblePages.map((i) => (
            <PaginationLink
              key={uuid().toString()}
              isActive={pagination.pageIndex === i}
              onClick={() => goToPage(i)}
            >
              {i + 1}
            </PaginationLink>
          ))}
          <Activity mode={showEndEllipsis ? 'visible' : 'hidden'}>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          </Activity>
          <PaginationItem>
            <PaginationNext onClick={goToNextPage} />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </>
  );
}

export default DataTable;
