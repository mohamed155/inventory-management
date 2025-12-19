import { ChevronDownIcon, X } from 'lucide-react';
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
  className,
  dismissable,
  ...props
}: {
  value?: Date | undefined;
  onChange?: (date: Date | undefined) => void;
  className?: string;
  placeholder?: string;
  dismissable?: boolean;
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
          className={`w-full flex justify-between ${className ?? ''}`}
          {...props}
        >
          {date
            ? date.toLocaleDateString('en-GB')
            : placeholder
              ? placeholder
              : t('Select Date')}
          {date && dismissable ? (
            <div
              className="text-destructive p-0!"
              {...{
                onClick: (e) => {
                  e.preventDefault();
                  setDate(undefined);
                  onChange?.(undefined);
                },
              }}
            >
              <X />
            </div>
          ) : (
            <ChevronDownIcon />
          )}
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
