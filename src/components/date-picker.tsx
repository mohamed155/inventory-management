import { ChevronDownIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button.tsx';
import { Calendar } from '@/components/ui/calendar.tsx';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover.tsx';

function DatePicker({
  value,
  onChange,
  placeholder,
}: {
  value?: Date | undefined;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
}) {
  const { t } = useTranslation();

  const [open, setOpen] = useState<boolean>(false);
  const [date, setDate] = useState<Date | undefined>(value);

  useEffect(() => {
    setDate(value);
  }, [value]);

  return (
    <Popover open={open} onOpenChange={(open) => setOpen(open)}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          id="date"
          className="w-full flex justify-between"
        >
          {date
            ? date.toLocaleDateString()
            : placeholder
              ? placeholder
              : t('Select Date')}
          <ChevronDownIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto overflow-hidden p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          captionLayout="dropdown"
          onSelect={(date) => {
            setDate(date);
            onChange?.(date);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

export default DatePicker;
