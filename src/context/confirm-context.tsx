import { createContext, type ReactNode, useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ConfirmDialog from '@/components/dialogs/confirm-dialog.tsx';

type ConfirmOptions = {
  title?: string;
  message?: string;
  variant?: 'default' | 'secondary' | 'destructive';
};

type ConfirmContextType = {
  confirm: (options: ConfirmOptions | string) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextType | null>(null);

// biome-ignore lint/style/noNonNullAssertion: This must not to be undefined
export const useConfirm = () => useContext(ConfirmContext)!;

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({
    message: '',
    title: 'Confirm',
    variant: 'default',
  });
  const [resolver, setResolver] = useState<(v: boolean) => void>(() => {});

  const confirm = (opts: ConfirmOptions | string) => {
    return new Promise<boolean>((resolve) => {
      setOptions(
        typeof opts === 'string'
          ? { message: opts, title: t('Confirmation'), variant: 'default' }
          : opts,
      );
      setResolver(() => resolve);
      setOpen(true);
    });
  };

  const onConfirm = () => {
    resolver(true);
    setOpen(false);
  };

  const onCancel = () => {
    resolver(false);
    setOpen(false);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      <ConfirmDialog
        open={open}
        title={options.title || t('Confirmation')}
        message={options.message || ''}
        onConfirm={onConfirm}
        onCancel={onCancel}
        variant={options.variant || 'default'}
      />
    </ConfirmContext.Provider>
  );
}
