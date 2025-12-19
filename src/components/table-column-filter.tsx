import type { Column } from '@tanstack/react-table';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import DatePicker from '@/components/date-picker.tsx';
import DebouncedInput from '@/components/debounced-input.tsx';

function TableColumnFilter<T>({ column }: { column: Column<T, unknown> }) {
  const { t } = useTranslation();

  const { filterVariant } = column.columnDef.meta ?? {};
  const { setFilterValue } = column;

  const handleValueChange = useCallback(
    (value: any) => {
      setFilterValue(value);
    },
    [setFilterValue],
  );

  switch (filterVariant) {
    case 'date':
      return (
        <DatePicker
          dismissable={true}
          placeholder={t('Filter...')}
          className="bg-white text-black"
          onChange={handleValueChange}
          value={column.getFilterValue() as Date}
        />
      );
    default:
      return (
        <DebouncedInput
          className="bg-white text-black"
          value={(column.getFilterValue() ?? '') as string | number}
          onChange={handleValueChange}
          placeholder={t('Filter...')}
        />
      );
  }
}

export default TableColumnFilter;
