import { zodResolver } from '@hookform/resolvers/zod';
import { Activity, useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import z from 'zod';
import {
  TabsList,
  TabsTrigger,
} from '@/components/animate-ui/components/animate/tabs.tsx';
import { Button } from '@/components/ui/button.tsx';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.tsx';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field.tsx';
import { Input } from '@/components/ui/input.tsx';
import type { Product, ProductBatch } from '../../generated/prisma/browser.ts';

function ProductDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose?: (product: Partial<Product & ProductBatch>) => void;
}) {
  const { t } = useTranslation();

  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [status, setStatus] = useState<'new' | 'add'>('new');

  useEffect(() => {
    setDialogOpen(open);
  }, [open]);

  const formSchema = useMemo(
    () =>
      z.object({
        ...(status
          ? {
              productName: z.string().min(1, t('Product name is required')),
              description: z.string(),
            }
          : {
              productId: z.string().min(1, t('Product is required')),
            }),
        quantity: z.number(),
        productionDate: z.date(),
        expirationDate: z.date(),
      }),
    [t, status],
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productId: '',
      productName: '',
      description: '',
      quantity: 0,
      productionDate: new Date(),
      expirationDate: new Date(),
    },
  });

  const onSubmit = () => {
    if (onClose) {
      onClose(form.getValues() as Partial<Product & ProductBatch>);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={(open) => setDialogOpen(open)}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Add Product')}</DialogTitle>
          </DialogHeader>
          <TabsList>
            <TabsTrigger value="new">{t('New')}</TabsTrigger>
            <TabsTrigger value="add">{t('Add')}</TabsTrigger>
          </TabsList>
          <FieldGroup>
            <Controller
              name="productName"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>{t('Product name')}</FieldLabel>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    autoComplete="off"
                  />
                  <Activity mode={fieldState.invalid ? 'visible' : 'hidden'}>
                    <FieldError errors={[fieldState.error]} />
                  </Activity>
                </Field>
              )}
            />
          </FieldGroup>
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
