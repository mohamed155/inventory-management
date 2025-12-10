import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import moment from 'moment';
import { Activity, useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import z from 'zod';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/animate-ui/components/animate/tabs.tsx';
import Combobox from '@/components/combobox.tsx';
import DatePicker from '@/components/date-picker.tsx';
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
import { getAllProducts } from '@/services/products.ts';
import type {
  Product,
  ProductBatch,
} from '../../../generated/prisma/browser.ts';

function ProductDialog({
  product,
  open,
  onClose,
}: {
  product?: Partial<Product & ProductBatch>;
  open: boolean;
  onClose?: (product?: Partial<Product & ProductBatch>) => void;
}) {
  const { t } = useTranslation();

  const [status, setStatus] = useState<'new' | 'add'>('new');

  const { data } = useQuery({
    queryKey: ['products'],
    queryFn: () => getAllProducts(),
  });

  const formSchema = useMemo(
    () =>
      z
        .object({
          ...(status === 'new' || product
            ? {
                name: z.string().min(1, t('Product name is required')),
                description: z.string(),
              }
            : {
                productId: z.string().min(1, t('Product is required')),
              }),
          quantity: z.number().min(1, t('Quantity can not be zero or less')),
          productionDate: z.date(),
          expirationDate: z.date(),
        })
        .refine(
          (data) =>
            moment(data.expirationDate).isAfter(moment(data.productionDate)),
          {
            message: t('Expiration date can not be before production date'),
            path: ['expirationDate'],
          },
        ),
    [t, status, product],
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productId: !product && status === 'add' ? '' : undefined,
      name: status === 'new' ? '' : undefined,
      description: status === 'new' ? '' : undefined,
      quantity: 0,
      productionDate: new Date(),
      expirationDate: new Date(),
    },
  });

  useEffect(() => {
    if (status === 'new') {
      form.unregister('productId');
    } else {
      form.unregister(['name', 'description']);
    }
    form.reset({
      productId: product
        ? product.productId
        : status === 'add'
          ? ''
          : undefined,
      name: product ? product.name : status === 'new' ? '' : undefined,
      description: product
        ? product.description || undefined
        : status === 'new'
          ? ''
          : undefined,
      quantity: product ? product.quantity : 0,
      productionDate: product ? product.productionDate : new Date(),
      expirationDate: product ? product.expirationDate : new Date(),
    });
  }, [status, form, product]);

  const onSubmit = () => {
    if (onClose) {
      if (product) {
        onClose({ ...form.getValues(), productId: product?.id } as Partial<
          Product & ProductBatch
        >);
      } else {
        onClose(form.getValues() as Partial<Product & ProductBatch>);
      }
    }
  };

  const openChange = (isOpen: boolean) => {
    if (!isOpen && onClose) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={openChange}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Add Product')}</DialogTitle>
          </DialogHeader>
          <Activity mode={!product ? 'visible' : 'hidden'}>
            <Tabs
              value={status}
              onValueChange={(value: string) =>
                setStatus(value as 'new' | 'add')
              }
            >
              <TabsList className="w-full">
                <TabsTrigger value="new">{t('New Product')}</TabsTrigger>
                <TabsTrigger value="add">{t('Add Quantity')}</TabsTrigger>
              </TabsList>
            </Tabs>
          </Activity>
          <FieldGroup>
            <Activity mode={status === 'new' ? 'visible' : 'hidden'}>
              <Controller
                name="name"
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
              <Controller
                name="description"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>{t('Description')}</FieldLabel>
                    <Input
                      {...field}
                      aria-invalid={fieldState.invalid}
                      autoComplete="off"
                    />
                  </Field>
                )}
              />
            </Activity>
            <Activity mode={status === 'add' ? 'visible' : 'hidden'}>
              <Controller
                name="productId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>{t('Choose Product')}</FieldLabel>
                    <Combobox
                      {...field}
                      list={data || []}
                      valueProp="id"
                      labelProp="name"
                    />
                    <Activity mode={fieldState.invalid ? 'visible' : 'hidden'}>
                      <FieldError errors={[fieldState.error]} />
                    </Activity>
                  </Field>
                )}
              />
            </Activity>
            <Controller
              name="quantity"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>{t('Quantity')}</FieldLabel>
                  <Input
                    {...field}
                    onChange={(e) =>
                      field.onChange({
                        ...e,
                        target: { ...e.target, value: Number(e.target.value) },
                      })
                    }
                    aria-invalid={fieldState.invalid}
                    autoComplete="off"
                    type="number"
                  />
                  <Activity mode={fieldState.invalid ? 'visible' : 'hidden'}>
                    <FieldError errors={[fieldState.error]} />
                  </Activity>
                </Field>
              )}
            />
            <Controller
              name="productionDate"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>{t('Production Date')}</FieldLabel>
                  <DatePicker
                    {...field}
                    onChange={(date) =>
                      field.onChange({ target: { value: date } })
                    }
                  ></DatePicker>
                  <Activity mode={fieldState.invalid ? 'visible' : 'hidden'}>
                    <FieldError errors={[fieldState.error]} />
                  </Activity>
                </Field>
              )}
            />
            <Controller
              name="expirationDate"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>{t('Expiration Date')}</FieldLabel>
                  <DatePicker
                    {...field}
                    onChange={(date) =>
                      field.onChange({ target: { value: date } })
                    }
                    aria-invalid={fieldState.invalid}
                  ></DatePicker>
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
            <Button onClick={form.handleSubmit(onSubmit)}>{t('Save')}</Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
export default ProductDialog;
