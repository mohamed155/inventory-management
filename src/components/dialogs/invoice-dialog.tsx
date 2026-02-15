import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.tsx';
import type { Purchase, Sale } from '../../../generated/prisma/browser.ts';

function InvoiceDialog({
  open,
  type,
}: {
  open: boolean;
  type: 'purchase' | 'sale';
  data: Purchase | Sale;
}) {
  const { t } = useTranslation();

  return (
    <Dialog open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {type === 'purchase' ? t('Purchase Details') : t('Sale Details')}
          </DialogTitle>
        </DialogHeader>
      </DialogContent>
      <div className="grid grid-cols-2">
        <div>
          <h6 className="text-muted">{t('Provider')}</h6>
          <p>{t('Provider 1')}</p>
        </div>
      </div>
    </Dialog>
  );
}

export default InvoiceDialog;
