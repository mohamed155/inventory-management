import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { Activity, useEffect, useMemo, useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
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
import type { PurchaseFormData } from '@/models/purchase-form.ts';
import { getAllProducts } from '@/services/products.ts';
import { getAllProviders } from '@/services/providers.ts';

function PurchaseDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose?: (purchase?: PurchaseFormData) => void;
}) {
  const { t } = useTranslation();

  const [providerStatus, setProviderStatus] = useState<'exist' | 'add'>(
    'exist',
  );
  const [productsStatuses, setProductStatuses] = useState<('exist' | 'add')[]>(
    [],
  );

  const { data: providers } = useQuery({
    queryKey: ['providers'],
    queryFn: () => getAllProviders(),
  });

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: () => getAllProducts(),
  });

  const formSchema = useMemo(
    () =>
      z.object({
        ...(providerStatus === 'exist'
          ? {
              providerId: z.string().min(1, t('Provider is required')),
            }
          : {
              providerName: z.string().min(1, t('Provider Name is required')),
              providerPhone: z.string(),
              providerAddress: z.string(),
            }),
        products: z.array(
          productsStatuses.length > 0
            ? z.union(
                productsStatuses.map((status) =>
                  z.object({
                    ...(status === 'exist'
                      ? { productId: z.string() }
                      : { productName: z.string() }),
                    productionDate: z.date(),
                    expirationDate: z.date(),
                    quantity: z.number(),
                    costPerUnit: z.number(),
                  }),
                ),
              )
            : z.any(),
        ),
        paidAmount: z.number(),
        paymentDueDate: z.date(),
        purchaseDate: z.date(),
      }),
    [t, providerStatus, productsStatuses],
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      providerId: providerStatus === 'exist' ? '' : undefined,
      providerName: providerStatus === 'add' ? '' : undefined,
      providerPhone: providerStatus === 'add' ? '' : undefined,
      providerAddress: providerStatus === 'add' ? '' : undefined,
      products: [
        {
          productName: '',
          quantity: 0,
          costPerUnit: 0,
          productionDate: new Date(),
          expirationDate: new Date(),
        },
      ],
      paidAmount: 0,
      paymentDueDate: new Date(),
      purchaseDate: new Date(),
    },
  });

  const { fields: productFields } = useFieldArray({
    control: form.control,
    name: 'products',
  });

  useEffect(() => {
    if (providerStatus === 'add') {
      form.unregister('providerId');
    } else {
      form.unregister(['providerName', 'providerPhone', 'providerAddress']);
    }
    for (let idx = 0; idx < form.getValues().products.length; idx++) {
      if (productsStatuses[idx] === 'exist') {
        form.unregister(`products.${idx}.productName`);
      } else {
        form.unregister(`products.${idx}.productId`);
      }
    }
    form.reset({
      providerId: providerStatus === 'exist' ? '' : undefined,
      providerName: providerStatus === 'add' ? '' : undefined,
      providerPhone: providerStatus === 'add' ? '' : undefined,
      providerAddress: providerStatus === 'add' ? '' : undefined,
      products: [
        {
          productName: '',
          quantity: 0,
          costPerUnit: 0,
          productionDate: new Date(),
          expirationDate: new Date(),
        },
      ],
      paidAmount: 0,
      paymentDueDate: new Date(),
      purchaseDate: new Date(),
    });
  }, [providerStatus, form, productsStatuses]);

  const onSubmit = async () => {
    if (onClose) {
      onClose(form.getValues() as PurchaseFormData);
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
            <DialogTitle>{t('Add Purchase')}</DialogTitle>
          </DialogHeader>
          <Tabs
            value={providerStatus}
            onValueChange={(value: string) =>
              setProviderStatus(value as 'exist' | 'add')
            }
          >
            <TabsList className="w-full">
              <TabsTrigger value="exist">{t('Exist provider')}</TabsTrigger>
              <TabsTrigger value="add">{t('New provider')}</TabsTrigger>
            </TabsList>
          </Tabs>
          <FieldGroup>
            <Activity mode={providerStatus === 'add' ? 'visible' : 'hidden'}>
              <Controller
                name="providerName"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>{t('Provider Name')}</FieldLabel>
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
                name="providerPhone"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>{t('Provider Phone')}</FieldLabel>
                    <Input
                      {...field}
                      type="tel"
                      aria-invalid={fieldState.invalid}
                      autoComplete="off"
                    />
                  </Field>
                )}
              />
              <Controller
                name="providerAddress"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>{t('Provider Address')}</FieldLabel>
                    <Input
                      {...field}
                      aria-invalid={fieldState.invalid}
                      autoComplete="off"
                    />
                  </Field>
                )}
              />
            </Activity>
            <Activity mode={providerStatus === 'exist' ? 'visible' : 'hidden'}>
              <Controller
                name="providerId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>{t('Choose Provider')}</FieldLabel>
                    <Combobox
                      {...field}
                      list={providers || []}
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
            {productFields.map((product, index) => (
              <Tabs
                key={product.id}
                value={productsStatuses[index] || 'exist'}
                onValueChange={(value: string) => {
                  const newStatuses = [...productsStatuses];
                  newStatuses[index] = value as 'exist' | 'add';
                  setProductStatuses(newStatuses);
                }}
              >
                <TabsList className="w-full">
                  <TabsTrigger value="exist">{t('Exist product')}</TabsTrigger>
                  <TabsTrigger value="add">{t('New product')}</TabsTrigger>
                </TabsList>
                <Activity
                  mode={
                    productsStatuses[index] === 'add' ? 'visible' : 'hidden'
                  }
                >
                  <Controller
                    name={`products.${index}.productName` as const}
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>{t('Product Name')}</FieldLabel>
                        <Input
                          {...field}
                          aria-invalid={fieldState.invalid}
                          autoComplete="off"
                        />
                        <Activity
                          mode={fieldState.invalid ? 'visible' : 'hidden'}
                        >
                          <FieldError errors={[fieldState.error]} />
                        </Activity>
                      </Field>
                    )}
                  />
                </Activity>
                <Activity
                  mode={
                    productsStatuses[index] === 'exist' ? 'visible' : 'hidden'
                  }
                >
                  <Controller
                    name={`products.${index}.productId` as const}
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>{t('Choose Product')}</FieldLabel>
                        <Combobox
                          {...field}
                          list={products || []}
                          valueProp="id"
                          labelProp="name"
                        />
                        <Activity
                          mode={fieldState.invalid ? 'visible' : 'hidden'}
                        >
                          <FieldError errors={[fieldState.error]} />
                        </Activity>
                      </Field>
                    )}
                  />
                </Activity>
                <Controller
                  name={`products.${index}.quantity` as const}
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>{t('Quantity')}</FieldLabel>
                      <Input
                        {...field}
                        onChange={(e) =>
                          field.onChange({
                            ...e,
                            target: {
                              ...e.target,
                              value: Number(e.target.value),
                            },
                          })
                        }
                        aria-invalid={fieldState.invalid}
                        autoComplete="off"
                        type="number"
                      />
                      <Activity
                        mode={fieldState.invalid ? 'visible' : 'hidden'}
                      >
                        <FieldError errors={[fieldState.error]} />
                      </Activity>
                    </Field>
                  )}
                />
                <Controller
                  name={`products.${index}.productionDate` as const}
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
                      <Activity
                        mode={fieldState.invalid ? 'visible' : 'hidden'}
                      >
                        <FieldError errors={[fieldState.error]} />
                      </Activity>
                    </Field>
                  )}
                />
                <Controller
                  name={`products.${index}.expirationDate` as const}
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
                      <Activity
                        mode={fieldState.invalid ? 'visible' : 'hidden'}
                      >
                        <FieldError errors={[fieldState.error]} />
                      </Activity>
                    </Field>
                  )}
                />
              </Tabs>
            ))}
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
export default PurchaseDialog;
