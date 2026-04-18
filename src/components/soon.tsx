import { Timer } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

type Props = {
  children?: ReactNode | ReactNode[];
};

const Soon = ({ children }: Props) => {
  const { t } = useTranslation();

  return (
    <div className="w-full h-full relative">
      <div className="w-full h-full rounded-xl">{children}</div>
      <div className="absolute glass rounded-xl left-0 top-0 w-full h-full flex justify-center items-center flex-col">
        <Timer className="text-white text-shadow-md mb-4" size={'80px'} />
        <h5 className="text-white text-shadow-md">
          {t('This feature will be available soon!')}
        </h5>
      </div>
    </div>
  );
};

export default Soon;
