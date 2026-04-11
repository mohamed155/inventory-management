import { Timer } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

type Props = {
  children?: ReactNode | ReactNode[];
};

const Soon = ({ children }: Props) => {
  const { t } = useTranslation();

  return (
    <div className="w-full h-full">
      <div className="w-full h-full glass glass-overlay">{children}</div>
      <div className="absolute left-0 top-0 w-full h-full flex justify-center items-center flex-col">
        <Timer className="text-white" />
        <h5 className="text-white">
          {t('This feature will be available soon!')}
        </h5>
      </div>
    </div>
  );
};

export default Soon;
