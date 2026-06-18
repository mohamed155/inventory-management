import type * as React from 'react';
import { useEffect, useState } from 'react';

import { Input } from './input';

function evaluateArithmetic(expr: string): number | null {
  const sanitized = expr.trim();
  if (!sanitized) return null;
  if (!/^[\d\s+\-*/().]+$/.test(sanitized)) return null;
  try {
    const result = new Function(`return (${sanitized})`)() as unknown;
    if (typeof result === 'number' && Number.isFinite(result)) return result;
    return null;
  } catch {
    return null;
  }
}

interface ArithmeticInputProps
  extends Omit<React.ComponentProps<'input'>, 'value' | 'onChange' | 'type'> {
  value: number;
  onChange: (value: number) => void;
}

function ArithmeticInput({
  value,
  onChange,
  onBlur,
  ...props
}: ArithmeticInputProps) {
  const [display, setDisplay] = useState(() =>
    value === 0 ? '' : String(value),
  );

  useEffect(() => {
    setDisplay(value === 0 ? '' : String(value));
  }, [value]);

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const result = evaluateArithmetic(display);
    if (result !== null) {
      onChange(result);
      setDisplay(result === 0 ? '' : String(result));
    } else {
      setDisplay(value === 0 ? '' : String(value));
    }
    onBlur?.(e);
  };

  return (
    <Input
      {...props}
      type="text"
      inputMode="decimal"
      value={display}
      onChange={(e) => setDisplay(e.target.value)}
      onBlur={handleBlur}
    />
  );
}

export { ArithmeticInput };
