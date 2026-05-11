import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrentSettings } from '@/store/settings.store.ts';

function DashboardCard({
  title,
  value,
  count,
  icon,
  color = 'info',
}: {
  title: string;
  value?: string | number;
  count?: number;
  icon?: ReactNode;
  color?: 'info' | 'success' | 'warning' | 'error';
}) {
  const { t } = useTranslation();
  const currency = useCurrentSettings((s) => s.currency);
  return (
    <div className="flex justify-between bg-white rounded-lg p-4 border border-solid">
      <div>
        <h3 className="font-light text-gray-800 mb-2">{title}</h3>
        <p className="text-lg">
          {value} {t(currency)} {count ? `(${count})` : ''}
        </p>
      </div>
      <div className="flex justify-center items-center">
        <div
          className={`rounded-full flex justify-center items-center bg-gray-200 aspect-square w-11.25 circle-icon-${color}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

export default DashboardCard;
