import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { MoveDown, MoveUp } from 'lucide-react';
import {
  Activity,
  type Dispatch,
  memo,
  type SetStateAction,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import TableColumnFilter from '@/components/table-column-filter.tsx';
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

function DataTableInner<T>({
  data,
  total,
  columns,
  showFilters,
  pagination,
  onPaginationChange,
  sorting,
  onSortingChange,
  columnFilters,
  onColumnFiltersChange,
}: {
  data: T[] | undefined;
  total: number;
  columns: ColumnDef<T>[];
  showFilters?: boolean;
  pagination: PaginationState;
  onPaginationChange: Dispatch<SetStateAction<PaginationState>>;
  sorting?: SortingState;
  onSortingChange?: Dispatch<SetStateAction<SortingState>>;
  columnFilters?: ColumnFiltersState;
  onColumnFiltersChange?: Dispatch<SetStateAction<ColumnFiltersState>>;
}) {
  const { t } = useTranslation();

  const table = useReactTable<T>({
    columns,
    data: data || [],
    rowCount: total,
    debugTable: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: onPaginationChange,
    onSortingChange: onSortingChange,
    onColumnFiltersChange: onColumnFiltersChange,
    state: { pagination, sorting, columnFilters },
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
  });

  const visiblePages = useMemo(() => {
    if (data) {
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
    }
  }, [pagination.pageIndex, table, data]);

  const showStartEllipsis = useMemo(() => {
    return table.getPageCount() > 7 && !visiblePages?.includes(0);
  }, [table, visiblePages]);

  const showEndEllipsis = useMemo(() => {
    const lastPage = table.getPageCount() - 1;
    return table.getPageCount() > 7 && !visiblePages?.includes(lastPage);
  }, [table, visiblePages]);

  return (
    <>
      <Table className="rounded-md overflow-hidden">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow
              key={headerGroup.id}
              className="bg-primary hover:bg-primary"
            >
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  colSpan={header.colSpan}
                  className="text-white h-[30px]"
                >
                  <div
                    className={`flex ${
                      header.column.getCanSort()
                        ? 'cursor-pointer select-none'
                        : ''
                    }`}
                    {...{
                      onClick: header.column.getToggleSortingHandler(),
                    }}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                    {{
                      asc: <MoveUp size={16} />,
                      desc: <MoveDown size={16} />,
                    }[header.column.getIsSorted() as string] ?? null}
                  </div>
                  <Activity
                    mode={
                      showFilters && header.column.getCanFilter()
                        ? 'visible'
                        : 'hidden'
                    }
                  >
                    <div className="my-1">
                      <TableColumnFilter column={header.column} />
                    </div>
                  </Activity>
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
            <PaginationPrevious
              aria-disabled={
                table.getPageCount() === 0 || pagination.pageIndex === 0
              }
              content={t('Previous')}
              className="pagination-button"
              onClick={() => table.previousPage()}
            />
          </PaginationItem>
          <Activity mode={showStartEllipsis ? 'visible' : 'hidden'}>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          </Activity>
          {visiblePages?.map((i) => (
            <PaginationLink
              key={i}
              isActive={pagination.pageIndex === i}
              onClick={() => table.setPageIndex(i)}
              className="pagination-button"
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
            <PaginationNext
              aria-disabled={
                table.getPageCount() === 0 ||
                pagination.pageIndex === table.getPageCount() - 1
              }
              content={t('Next')}
              className="pagination-button"
              onClick={() => table.nextPage()}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </>
  );
}

const DataTable = memo(DataTableInner) as typeof DataTableInner;

export default DataTable;
