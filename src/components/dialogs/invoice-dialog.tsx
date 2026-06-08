import { useQuery } from '@tanstack/react-query';
import { Printer } from 'lucide-react';
import { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button.tsx';
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import type { PurchasesListResult } from '@/models/purchases-list-result.ts';
import type { SalesListResult } from '@/models/sales-list-result.ts';
import { getAllPurchaseItems } from '@/services/purchases.ts';
import { getAllSaleItems } from '@/services/sales.ts';
import { useCurrentUserStore } from '@/store/user.store.ts';
import { printContent } from '@/util/print.ts';

type InvoiceData =
  | (PurchasesListResult & { type: 'purchase' })
  | (SalesListResult & { type: 'sale' });

type InvoiceDialogProps = {
  open: boolean;
  type: 'purchase' | 'sale';
  data?: InvoiceData;
  close: () => void;
};

function InvoiceDialog({ open, type, data, close }: InvoiceDialogProps) {
  const { t } = useTranslation();
  const contentRef = useRef<HTMLDivElement>(null);
  const currentUser = useCurrentUserStore((s) => s.currentUser);

  const { data: items } = useQuery({
    queryKey: ['invoice-items', type, data?.id],
    queryFn: () => {
      if (!data) return undefined;
      if (type === 'purchase') {
        return getAllPurchaseItems(data.id);
      } else {
        return getAllSaleItems(data.id);
      }
    },
    enabled: !!data?.id,
  });

  const handlePrint = useCallback(() => {
    if (!contentRef.current) return;
    printContent({
      title: type === 'purchase' ? t('Purchase Details') : t('Sale Details'),
      content: contentRef.current.innerHTML,
    });
  }, [type, t]);

  if (data) {
    const { totalCost, paidAmount, remainingCost } = data;
    return (
      <Dialog open={open} onOpenChange={close}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {type === 'purchase' ? t('Purchase Details') : t('Sale Details')}
            </DialogTitle>
          </DialogHeader>
          <div ref={contentRef}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h6>{type === 'purchase' ? t('Provider') : t('Customer')}</h6>
                <p>
                  {data.type === 'purchase'
                    ? data.providerName
                    : data.customerName}
                </p>
              </div>
              <div>
                <h6>{t('Date')}</h6>
                <p>{data.date?.toDateString()}</p>
              </div>
              <div>
                <h6>{t('Payment Due')}</h6>
                <p>{data.payDueDate?.toDateString()}</p>
              </div>
              <div>
                <h6>{t('Status')}</h6>
                <Badge>
                  {totalCost - paidAmount > 0 ? t('Partial') : t('Paid')}
                </Badge>
              </div>
              <div>
                <h6>{t('Created By')}</h6>
                <p>{currentUser ? `${currentUser.firstname} ${currentUser.lastname}` : ''}</p>
              </div>
            </div>
            <div>
              <h6>{t('Products')}</h6>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('Product')}</TableHead>
                    <TableHead>{t('Quantity')}</TableHead>
                    <TableHead>{t('Unit Price')}</TableHead>
                    <TableHead>{t('Total')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.unitPrice}</TableCell>
                      <TableCell>{item.quantity * item.unitPrice}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-between items-center">
              <h6>{t('Total Amount:')}</h6>
              <p>{totalCost}</p>
            </div>
            <div className="flex justify-between items-center">
              <h6>{t('Paid Amount:')}</h6>
              <p className="text-green-600">{paidAmount}</p>
            </div>
            <div className="flex justify-between items-center">
              <h6>{t('Remaining Amount:')}</h6>
              <p className="text-red-600">{remainingCost}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 me-2" />
              {t('Print')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
}

export default InvoiceDialog;
