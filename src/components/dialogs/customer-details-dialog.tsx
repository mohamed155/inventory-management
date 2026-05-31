import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
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
import { formatDate } from '@/lib/format-date.ts';
import { getSalesByCustomerId } from '@/services/sales.ts';
import { useCurrentSettings } from '@/store/settings.store.ts';
import type { Customer } from '../../../generated/prisma/browser.ts';

type SaleHistoryItem = {
  id: string;
  date: Date;
  payDueDate: Date;
  totalCost: number;
  paidAmount: number;
  remainingCost: number;
  items: { name: string; quantity: number }[];
};

type CustomerDetailsDialogProps = {
  open: boolean;
  customer?: Customer;
  close: () => void;
};

function CustomerDetailsDialog({
  open,
  customer,
  close,
}: CustomerDetailsDialogProps) {
  const { t } = useTranslation();
  const currency = useCurrentSettings((s) => s.currency);
  const dateFormat = useCurrentSettings((s) => s.dateFormat);

  const { data: sales } = useQuery<SaleHistoryItem[]>({
    queryKey: ['customer-sales', customer?.id],
    queryFn: () => getSalesByCustomerId(customer?.id ?? ''),
    enabled: !!customer?.id,
  });

  if (!customer) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) close();
      }}
    >
      <DialogContent className="w-fit sm:max-w-fit max-w-[calc(100%-2rem)] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('Customer Details')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 bg-muted/40 rounded-lg p-4">
            <div>
              <p className="text-sm text-muted-foreground">{t('First Name')}</p>
              <p className="font-medium">{customer.firstname}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('Last Name')}</p>
              <p className="font-medium">{customer.lastname}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('Phone')}</p>
              <p className="font-medium">{customer.phone}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('Address')}</p>
              <p className="font-medium">{customer.address ?? '—'}</p>
            </div>
          </div>

          <div>
            <h6 className="font-medium mb-3">{t('Sales History')}</h6>
            {!sales || sales.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t('No sales history')}
              </p>
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
                    {sales.map((sale) => {
                      const isPaid = sale.remainingCost <= 0;
                      return (
                        <TableRow key={sale.id}>
                          <TableCell>
                            {formatDate(sale.date, dateFormat)}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-0.5">
                              {sale.items.map((item) => (
                                <div
                                  key={`${item.name}-${item.quantity}`}
                                  className="text-sm"
                                >
                                  {item.name} (×{item.quantity})
                                </div>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            {sale.totalCost} {t(currency)}
                          </TableCell>
                          <TableCell className="text-green-600">
                            {sale.paidAmount} {t(currency)}
                          </TableCell>
                          <TableCell className="text-red-600">
                            {sale.remainingCost} {t(currency)}
                          </TableCell>
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

export default CustomerDetailsDialog;
