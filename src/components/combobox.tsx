import { ChevronsUpDownIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button.tsx';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command.tsx';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover.tsx';

function Combobox<T>({
  list,
  labelProp,
  valueProp,
  placeholder,
  value,
  onChange,
}: {
  list: T[];
  labelProp?: keyof T;
  valueProp?: keyof T;
  placeholder?: string;
  value?: T | T[keyof T];
  onChange?: (value: T | T[keyof T]) => void;
}) {
  const { t } = useTranslation();

  const [open, setOpen] = useState<boolean>(false);
  const [selected, setSelected] = useState<T | T[keyof T] | undefined>(value);

  useEffect(() => {
    setSelected(value);
  }, [value]);

  const currentLabel = () => {
    if (selected) {
      if (labelProp && valueProp) {
        return list.find((item) => item[valueProp] === value)?.[labelProp];
      } else {
        return selected;
      }
    } else {
      return placeholder ?? t('Select an option');
    }
  };

  return (
    <Popover open={open} onOpenChange={(open) => setOpen(open)}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {currentLabel() as string}
          <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command className="w-[460px]">
          <CommandInput placeholder={t('Search')} />
          <CommandList>
            <CommandEmpty>{t('No results found')}</CommandEmpty>
            <CommandGroup>
              {list.map((item) => (
                <CommandItem
                  key={
                    valueProp ? (item[valueProp] as string) : (item as string)
                  }
                  className="flex justify-between p-0"
                  value={
                    valueProp ? (item[valueProp] as string) : (item as string)
                  }
                  onSelect={() => {
                    setOpen(false);
                    setSelected(valueProp ? item[valueProp] : item);
                    onChange?.(valueProp ? item[valueProp] : item);
                  }}
                >
                  <div
                    className={` h-full w-full p-2 rounded
                      ${
                        (
                          valueProp
                            ? item[valueProp] === selected
                            : item === selected
                        )
                          ? 'bg-primary/90 text-white'
                          : ''
                      }`}
                  >
                    {labelProp ? (item[labelProp] as string) : (item as string)}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default Combobox;
