import type { Column } from '@tanstack/react-table';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import DatePicker from '@/components/date-picker.tsx';
import DebouncedInput from '@/components/debounced-input.tsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx';

function TableColumnFilter<T>({ column }: { column: Column<T, unknown> }) {
  const { t } = useTranslation();

  const { filterVariant, selectOptions } = column.columnDef.meta ?? {};
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
    case 'select':
      return (
        <Select>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {selectOptions?.length &&
              selectOptions?.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
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
