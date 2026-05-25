import { Settings as SettingsIcon } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ColorSwatch } from '@/components/color-swatch.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input.tsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx';
import { useCurrentLang } from '@/store/lang.store.ts';
import {
  type CurrencyCode,
  type DateFormatPattern,
  useCurrentSettings,
} from '@/store/settings.store.ts';

const CURRENCIES: CurrencyCode[] = ['EGP', 'USD', 'EUR', 'SAR', 'AED', 'GBP'];
const DATE_FORMATS: { value: DateFormatPattern; label: string }[] = [
  { value: 'dd/MM/yyyy', label: 'DD/MM/YYYY' },
  { value: 'MM/dd/yyyy', label: 'MM/DD/YYYY' },
  { value: 'yyyy-MM-dd', label: 'YYYY-MM-DD' },
];

function Settings() {
  const { t } = useTranslation();

  const currentLang = useCurrentLang((s) => s.lang);
  const setCurrentLang = useCurrentLang((s) => s.setLang);

  const primaryColor = useCurrentSettings((s) => s.primaryColor);
  const currency = useCurrentSettings((s) => s.currency);
  const dateFormat = useCurrentSettings((s) => s.dateFormat);
  const expiryWarningDays = useCurrentSettings((s) => s.expiryWarningDays);
  const lowStockThreshold = useCurrentSettings((s) => s.lowStockThreshold);
  const setPrimaryColor = useCurrentSettings((s) => s.setPrimaryColor);
  const setCurrency = useCurrentSettings((s) => s.setCurrency);
  const setDateFormat = useCurrentSettings((s) => s.setDateFormat);
  const setExpiryWarningDays = useCurrentSettings(
    (s) => s.setExpiryWarningDays,
  );
  const setLowStockThreshold = useCurrentSettings(
    (s) => s.setLowStockThreshold,
  );
  const resetSettings = useCurrentSettings((s) => s.resetSettings);

  const [expiryInput, setExpiryInput] = useState(String(expiryWarningDays));
  const [expiryError, setExpiryError] = useState('');
  const [stockInput, setStockInput] = useState(String(lowStockThreshold));
  const [stockError, setStockError] = useState('');

  function handleExpiryChange(value: string) {
    setExpiryInput(value);
    const n = Number.parseInt(value, 10);
    if (Number.isNaN(n) || n < 1) {
      setExpiryError(t('Must be at least 1'));
    } else {
      setExpiryError('');
      setExpiryWarningDays(n);
    }
  }

  function handleStockChange(value: string) {
    setStockInput(value);
    const n = Number.parseInt(value, 10);
    if (Number.isNaN(n) || n < 1) {
      setStockError(t('Must be at least 1'));
    } else {
      setStockError('');
      setLowStockThreshold(n);
    }
  }

  function handleReset() {
    resetSettings();
    setExpiryInput('10');
    setStockInput('10');
    setExpiryError('');
    setStockError('');
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold pb-2">
          <SettingsIcon className="text-lg inline-block" /> {t('Settings')}
        </h2>
        <Button variant="outline" size="sm" onClick={handleReset}>
          {t('Reset to Defaults')}
        </Button>
      </div>

      {/* General Settings */}
      <div className="flex flex-col gap-4 bg-white rounded-lg p-4 border border-solid">
        <h5>{t('General Settings')}</h5>
        <div className="flex flex-wrap gap-4">
          <Field className="w-50">
            <FieldLabel>{t('Language')}</FieldLabel>
            <Select value={currentLang} onValueChange={setCurrentLang}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ar">عربي</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field className="w-50">
            <FieldLabel>{t('Currency')}</FieldLabel>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {t(c)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field className="w-50">
            <FieldLabel>{t('Date Format')}</FieldLabel>
            <Select value={dateFormat} onValueChange={setDateFormat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATE_FORMATS.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </div>

      {/* Appearance */}
      <div className="flex flex-col gap-4 bg-white rounded-lg p-4 border border-solid">
        <h5>{t('Appearance')}</h5>
        <Field>
          <FieldLabel>{t('Primary Color')}</FieldLabel>
          <ColorSwatch value={primaryColor} onChange={setPrimaryColor} />
        </Field>
      </div>

      {/* Dashboard Alerts */}
      <div className="flex flex-col gap-4 bg-white rounded-lg p-4 border border-solid">
        <h5>{t('Dashboard Alerts')}</h5>
        <div className="flex flex-wrap gap-4">
          <Field className="w-50">
            <FieldLabel>{t('Expiry Warning (days)')}</FieldLabel>
            <Input
              type="number"
              min={1}
              value={expiryInput}
              onChange={(e) => handleExpiryChange(e.target.value)}
            />
            {expiryError && (
              <p className="text-xs text-destructive mt-1">{expiryError}</p>
            )}
          </Field>
          <Field className="w-50">
            <FieldLabel>{t('Low Stock Threshold (units)')}</FieldLabel>
            <Input
              type="number"
              min={1}
              value={stockInput}
              onChange={(e) => handleStockChange(e.target.value)}
            />
            {stockError && (
              <p className="text-xs text-destructive mt-1">{stockError}</p>
            )}
          </Field>
        </div>
      </div>
    </div>
  );
}

export default Settings;
