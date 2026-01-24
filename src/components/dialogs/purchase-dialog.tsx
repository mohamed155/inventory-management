import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { Plus, X } from 'lucide-react';
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
import { useCurrentUserStore } from '@/store/user.store.ts';

function PurchaseDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose?: (purchase?: PurchaseFormData) => void;
}) {
  const { t } = useTranslation();
  const currentUser = useCurrentUserStore((state: any) => state.currentUser);

  const [providerStatus, setProviderStatus] = useState<'exist' | 'add'>(
    'exist',
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
          z.object({
            status: z.enum(['exist', 'add']),
            id: z.string().optional(),
            name: z.string().optional(),
            productionDate: z.date(),
            expirationDate: z.date(),
            quantity: z.number(),
            unitPrice: z.number(),
          }),
        ),
        paidAmount: z.number(),
        payDueDate: z.date(),
        date: z.date(),
      }),
    [t, providerStatus],
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
          status: 'exist',
          name: '',
          quantity: 0,
          unitPrice: 0,
          productionDate: new Date(),
          expirationDate: new Date(),
        },
      ],
      paidAmount: 0,
      payDueDate: new Date(),
      date: new Date(),
    },
  });

  const {
    fields: productFields,
    append: appendProduct,
    remove: removeProduct,
  } = useFieldArray({
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
      if (form.getValues().products[idx].status === 'exist') {
        form.unregister(`products.${idx}.name`);
      } else {
        form.unregister(`products.${idx}.id`);
      }
    }
    form.reset({
      providerId: providerStatus === 'exist' ? '' : undefined,
      providerName: providerStatus === 'add' ? '' : undefined,
      providerPhone: providerStatus === 'add' ? '' : undefined,
      providerAddress: providerStatus === 'add' ? '' : undefined,
      products: [
        {
          status: 'exist',
          name: '',
          quantity: 0,
          unitPrice: 0,
          productionDate: new Date(),
          expirationDate: new Date(),
        },
      ],
      paidAmount: 0,
      payDueDate: new Date(),
      date: new Date(),
    });
  }, [providerStatus, form]);

  const onSubmit = async () => {
    if (onClose) {
      const result: PurchaseFormData = {
        ...form.getValues(),
        userId: currentUser?.id,
      };
      onClose(result);
    }
  };

  const openChange = (isOpen: boolean) => {
    if (!isOpen && onClose) {
      onClose();
    }
  };

  const addProduct = () => {
    appendProduct({
      status: 'exist',
      name: '',
      quantity: 0,
      unitPrice: 0,
      productionDate: new Date(),
      expirationDate: new Date(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={openChange}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <DialogContent className="grid max-h-[90vh] grid-rows-[auto_1fr_auto]">
          <DialogHeader>
            <DialogTitle>{t('Add Purchase')}</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto pb-2">
            <Tabs
              className="mb-4"
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
                      <Activity
                        mode={fieldState.invalid ? 'visible' : 'hidden'}
                      >
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
              <Activity
                mode={providerStatus === 'exist' ? 'visible' : 'hidden'}
              >
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
                      <Activity
                        mode={fieldState.invalid ? 'visible' : 'hidden'}
                      >
                        <FieldError errors={[fieldState.error]} />
                      </Activity>
                    </Field>
                  )}
                />
              </Activity>
              <div className="flex flex-col gap-2 mt-4">
                <div className="flex justify-between items-center">
                  <h6>{t('Products')}</h6>
                  <Button onClick={addProduct}>
                    <Plus size={30} />
                    {t('Add Product')}
                  </Button>
                </div>
                {productFields.map((product, index) => {
                  const productStatus =
                    form.watch(`products.${index}.status`) || 'exist';
                  return (
                    <div key={product.id} className="p-3 border-2 rounded-md">
                      <div className="flex justify-between items-center mb-2">
                        <h6>
                          {t('Product')} {index + 1}
                        </h6>
                        <div>
                          <Activity
                            mode={
                              productFields.length === 1 ? 'hidden' : 'visible'
                            }
                          >
                            <Button
                              variant="ghost"
                              onClick={() => removeProduct(index)}
                            >
                              <X />
                            </Button>
                          </Activity>
                        </div>
                      </div>
                      <Tabs
                        value={productStatus}
                        onValueChange={(value: string) => {
                          form.setValue(
                            `products.${index}.status`,
                            value as 'exist' | 'add',
                          );
                        }}
                      >
                        <TabsList className="w-full">
                          <TabsTrigger value="exist">
                            {t('Exist product')}
                          </TabsTrigger>
                          <TabsTrigger value="add">
                            {t('New product')}
                          </TabsTrigger>
                        </TabsList>
                        <Activity
                          mode={productStatus === 'add' ? 'visible' : 'hidden'}
                        >
                          <Controller
                            name={`products.${index}.name` as const}
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
                                  mode={
                                    fieldState.invalid ? 'visible' : 'hidden'
                                  }
                                >
                                  <FieldError errors={[fieldState.error]} />
                                </Activity>
                              </Field>
                            )}
                          />
                        </Activity>
                        <Activity
                          mode={
                            productStatus === 'exist' ? 'visible' : 'hidden'
                          }
                        >
                          <Controller
                            name={`products.${index}.id` as const}
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
                                  mode={
                                    fieldState.invalid ? 'visible' : 'hidden'
                                  }
                                >
                                  <FieldError errors={[fieldState.error]} />
                                </Activity>
                              </Field>
                            )}
                          />
                        </Activity>
                        <div className="grid grid-cols-2 gap-4">
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
                                  mode={
                                    fieldState.invalid ? 'visible' : 'hidden'
                                  }
                                >
                                  <FieldError errors={[fieldState.error]} />
                                </Activity>
                              </Field>
                            )}
                          />
                          <Controller
                            name={`products.${index}.unitPrice` as const}
                            control={form.control}
                            render={({ field, fieldState }) => (
                              <Field data-invalid={fieldState.invalid}>
                                <FieldLabel>{t('Unit Cost')}</FieldLabel>
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
                                  mode={
                                    fieldState.invalid ? 'visible' : 'hidden'
                                  }
                                >
                                  <FieldError errors={[fieldState.error]} />
                                </Activity>
                              </Field>
                            )}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
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
                                  mode={
                                    fieldState.invalid ? 'visible' : 'hidden'
                                  }
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
                                  mode={
                                    fieldState.invalid ? 'visible' : 'hidden'
                                  }
                                >
                                  <FieldError errors={[fieldState.error]} />
                                </Activity>
                              </Field>
                            )}
                          />
                        </div>
                      </Tabs>
                    </div>
                  );
                })}
                <div className="grid grid-cols-2 gap-4">
                  <Controller
                    name="paidAmount"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>{t('Paid Amount')}</FieldLabel>
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
                    name="payDueDate"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>{t('Payment Due Date')}</FieldLabel>
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
                </div>
                <Controller
                  name="date"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>{t('Purchase Date')}</FieldLabel>
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
              </div>
            </FieldGroup>
          </div>
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
