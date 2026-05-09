import { Settings as SettingsIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function Settings() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold pb-2">
          <SettingsIcon className="text-lg inline-block flex" /> {t('Settings')}
        </h2>
      </div>
    </div>
  );
}

export default Settings;
