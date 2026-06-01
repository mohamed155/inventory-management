import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { formatDate } from '@/lib/format-date.ts';
import { useCurrentSettings } from '@/store/settings.store.ts';
import { Badge } from '@/components/ui/badge.tsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.tsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table.tsx';
import { getPurchasesByProviderId } from '@/services/purchases.ts';
import type { Provider } from '../../../generated/prisma/browser.ts';

type PurchaseHistoryItem = {
  id: string;
  date: Date;
  payDueDate: Date;
  totalCost: number;
  paidAmount: number;
  remainingCost: number;
  items: { name: string; quantity: number }[];
};

type ProviderDetailsDialogProps = {
  open: boolean;
  provider?: Provider;
  close: () => void;
};

function ProviderDetailsDialog({
  open,
  provider,
  close,
}: ProviderDetailsDialogProps) {
  const { t } = useTranslation();
  const currency = useCurrentSettings((s) => s.currency);
  const dateFormat = useCurrentSettings((s) => s.dateFormat);

  const { data: purchases } = useQuery<PurchaseHistoryItem[]>({
    queryKey: ['provider-purchases', provider?.id],
    queryFn: () => getPurchasesByProviderId(provider?.id ?? ''),
    enabled: !!provider?.id,
  });

  if (!provider) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) close(); }}>
      <DialogContent className="w-fit sm:max-w-fit max-w-[calc(100%-2rem)] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('Provider Details')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 bg-muted/40 rounded-lg p-4">
            <div className="col-span-2 sm:col-span-1">
              <p className="text-sm text-muted-foreground">{t('Name')}</p>
              <p className="font-medium">{provider.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('Phone')}</p>
              <p className="font-medium">{provider.phone}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-muted-foreground">{t('Address')}</p>
              <p className="font-medium">{provider.address ?? '—'}</p>
            </div>
          </div>

          <div>
            <h6 className="font-medium mb-3">{t('Purchase History')}</h6>
            {!purchases || purchases.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('No purchase history')}</p>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('Date')}</TableHead>
                      <TableHead>{t('Products')}</TableHead>
                      <TableHead>{t('Total Cost')}</TableHead>
                      <TableHead>{t('Paid Amount')}</TableHead>
                      <TableHead>{t('Remaining')}</TableHead>
                      <TableHead>{t('Status')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchases.map((purchase) => {
                      const isPaid = purchase.remainingCost <= 0;
                      return (
                        <TableRow key={purchase.id}>
                          <TableCell>{formatDate(purchase.date, dateFormat)}</TableCell>
                          <TableCell>
                            <div className="space-y-0.5">
                              {purchase.items.map((item) => (
                                <div key={`${item.name}-${item.quantity}`} className="text-sm">
                                  {item.name} (×{item.quantity})
                                </div>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>{purchase.totalCost} {t(currency)}</TableCell>
                          <TableCell className="text-green-600">{purchase.paidAmount} {t(currency)}</TableCell>
                          <TableCell className="text-red-600">{purchase.remainingCost} {t(currency)}</TableCell>
                          <TableCell>
                            <Badge variant={isPaid ? 'default' : 'secondary'}>
                              {isPaid ? t('Paid') : t('Partial')}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ProviderDetailsDialog;
