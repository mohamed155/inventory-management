import type { Column } from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';
import DatePicker from '@/components/date-picker.tsx';
import DebouncedInput from '@/components/debounced-input.tsx';

function TableColumnFilter<T>({ column }: { column: Column<T, unknown> }) {
  const { t } = useTranslation();

  const { filterVariant } = column.columnDef.meta ?? {};

  switch (filterVariant) {
    case 'date':
      return (
        <DatePicker
          dismissable={true}
          placeholder={t('Filter...')}
          className="bg-white text-black"
          onChange={(value) => {
            console.log('DatePicker value:', value);
            column.setFilterValue(value);
          }}
        />
      );
    default:
      return (
        <DebouncedInput
          className="bg-white text-black"
          value={column.getFilterValue() as string | number}
          onChange={(value) => column.setFilterValue(value)}
          placeholder={t('Filter...')}
        />
      );
  }
}

export default TableColumnFilter;
