import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import z from 'zod';
import { Button } from '@/components/ui/button.tsx';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.tsx';

function ProductDialog() {
  const { t } = useTranslation();

  const [dialogOpen, setDialogOpen] = useState<boolean>(false);

  const formScema = useMemo(
    () =>
      z.object({
        productName: z.string().min(1, t('Product name is required')),
        quantity: z.number(),
        productionDate: z.date(),
        expirationDate: z.date(),
      }),
    [t],
  );

  return (
    <Dialog open={dialogOpen} onOpenChange={(open) => setDialogOpen(open)}>
      <form>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Add Product')}</DialogTitle>
          </DialogHeader>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="bg">
                {t('Cancel')}
              </Button>
            </DialogClose>
            <Button>{t('Save')}</Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
export default ProductDialog;
