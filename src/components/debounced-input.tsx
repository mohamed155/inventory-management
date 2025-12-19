import { X } from 'lucide-react';
import { Activity, type InputHTMLAttributes, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';

function DebouncedInput({
  value: initialValue,
  onChange,
  debounce = 500,
  dismissable = true,
  ...props
}: {
  value: string | number;
  onChange: (value: string | number) => void;
  dismissable?: boolean;
  debounce?: number;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'>) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value);
    }, debounce);

    return () => clearTimeout(timeout);
  }, [value, debounce, onChange]);

  const clearValue = () => {
    setValue('');
    onChange('');
  };

  return (
    <div className={`flex bg-white relative rounded-md ${props.className}`}>
      <Input
        {...props}
        className={`${props.className} w-full`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <Activity mode={value && dismissable ? 'visible' : 'hidden'}>
        <Button
          variant="link"
          className="absolute right-0 text-destructive"
          onClick={(e) => {
            e.preventDefault();
            clearValue();
          }}
        >
          <X />
        </Button>
      </Activity>
    </div>
  );
}

export default DebouncedInput;
