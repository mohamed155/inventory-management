import { Settings as SettingsIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx';
import { useCurrentLang } from '@/store/lang.store.ts';

function Settings() {
  const { t } = useTranslation();
  const currentLang = useCurrentLang((s) => s.lang);
  const setCurrentLang = useCurrentLang((s) => s.setLang);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold pb-2">
          <SettingsIcon className="text-lg inline-block flex" /> {t('Settings')}
        </h2>
      </div>
      <div className="flex flex-col gap-4 bg-white rounded-lg p-4 border border-solid">
        <h5>{t('General Settings')}</h5>
        <Field className="w-[200px]">
          <FieldLabel>{t('Language')}</FieldLabel>
          <Select value={currentLang} onValueChange={setCurrentLang}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={'en'}>English</SelectItem>
              <SelectItem value={'ar'}>عربي</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
    </div>
  );
}

export default Settings;
