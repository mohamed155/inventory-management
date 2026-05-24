import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { COLOR_OPTIONS } from '@/lib/color-theme.ts';
import { cn } from '@/lib/utils.ts';
import type { ColorToken } from '@/store/settings.store.ts';

interface ColorSwatchProps {
  value: ColorToken;
  onChange: (token: ColorToken) => void;
}

export function ColorSwatch({ value, onChange }: ColorSwatchProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap gap-3">
      {COLOR_OPTIONS.map(({ token, hex }) => (
        <button
          key={token}
          type="button"
          title={t(token.charAt(0).toUpperCase() + token.slice(1))}
          onClick={() => onChange(token)}
          className={cn(
            'w-8 h-8 rounded-full border-2 flex items-center justify-center transition-transform hover:scale-110',
            value === token ? 'border-foreground' : 'border-transparent',
          )}
          style={{ backgroundColor: hex }}
        >
          {value === token && (
            <Check className="w-4 h-4 text-white drop-shadow-sm" />
          )}
        </button>
      ))}
    </div>
  );
}
