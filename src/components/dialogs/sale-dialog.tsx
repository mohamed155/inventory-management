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
import type { SaleFormData } from '@/models/sales-form.ts';
import { getAllCustomers } from '@/services/customers.ts';
import { getAllProductBatches, getAllProducts } from '@/services/products.ts';
import { useCurrentUserStore } from '@/store/user.store.ts';

function SaleDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose?: (sale?: SaleFormData) => void;
}) {
  const { t } = useTranslation();
  const currentUser = useCurrentUserStore((state: any) => state.currentUser);

  const [customerStatus, setCustomerStatus] = useState<'exist' | 'add'>(
    'exist',
  );

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: () =>
      getAllCustomers().then((customers: any[]) =>
        customers.map((c) => ({ ...c, name: `${c.firstname} ${c.lastname}` })),
      ),
  });

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: () => getAllProducts(),
  });

  const { data: productBatches } = useQuery({
    queryKey: ['productBatches'],
    queryFn: () => getAllProductBatches(),
  });

  const formSchema = useMemo(
    () =>
      z.object({
        ...(customerStatus === 'exist'
          ? {
              customerId: z.string().min(1, t('Customer is required')),
            }
          : {
              customerFirstname: z
                .string()
                .min(1, t('Customer First Name is required')),
              customerLastname: z
                .string()
                .min(1, t('Customer Last Name is required')),
              customerPhone: z.string(),
              customerAddress: z.string(),
            }),
        products: z.array(
          z.object({
            id: z.string().min(1, t('Product is required')),
            quantity: z.number().min(1, t('Quantity must be at least 1')),
            unitPrice: z.number().min(0, t('Unit Price must be positive')),
          }),
        ),
        paidAmount: z.number(),
        discount: z.number().optional(),
        payDueDate: z.date(),
        date: z.date(),
      }),
    [t, customerStatus],
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerId: customerStatus === 'exist' ? '' : undefined,
      customerFirstname: customerStatus === 'add' ? '' : undefined,
      customerLastname: customerStatus === 'add' ? '' : undefined,
      customerPhone: customerStatus === 'add' ? '' : undefined,
      customerAddress: customerStatus === 'add' ? '' : undefined,
      products: [
        {
          id: '',
          quantity: 1,
          unitPrice: 0,
        },
      ],
      paidAmount: 0,
      discount: 0,
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
    if (customerStatus === 'add') {
      form.unregister('customerId');
    } else {
      form.unregister([
        'customerFirstname',
        'customerLastname',
        'customerPhone',
        'customerAddress',
      ]);
    }
    form.reset({
      customerId: customerStatus === 'exist' ? '' : undefined,
      customerFirstname: customerStatus === 'add' ? '' : undefined,
      customerLastname: customerStatus === 'add' ? '' : undefined,
      customerPhone: customerStatus === 'add' ? '' : undefined,
      customerAddress: customerStatus === 'add' ? '' : undefined,
      products: [{ id: '', quantity: 1, unitPrice: 0 }],
      paidAmount: 0,
      discount: 0,
      payDueDate: new Date(),
      date: new Date(),
    });
  }, [customerStatus, form]);

  const onSubmit = async () => {
    if (onClose) {
      const result: SaleFormData = {
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
      id: '',
      quantity: 1,
      unitPrice: 0,
    });
  };

  const getProductStock = (productId: string) => {
    const batches =
      productBatches?.filter((b: any) => b.productId === productId) || [];
    return batches.reduce((sum: number, b: any) => sum + (b.quantity || 0), 0);
  };

  return (
    <Dialog open={open} onOpenChange={openChange}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <DialogContent className="grid max-h-[90vh] grid-rows-[auto_1fr_auto]">
          <DialogHeader>
            <DialogTitle>{t('Add Sale')}</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto pb-2">
            <Tabs
              className="mb-4"
              value={customerStatus}
              onValueChange={(value: string) =>
                setCustomerStatus(value as 'exist' | 'add')
              }
            >
              <TabsList className="w-full">
                <TabsTrigger value="exist">{t('Exist customer')}</TabsTrigger>
                <TabsTrigger value="add">{t('New customer')}</TabsTrigger>
              </TabsList>
            </Tabs>
            <FieldGroup>
              <Activity mode={customerStatus === 'add' ? 'visible' : 'hidden'}>
                <Controller
                  name="customerFirstname"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>{t('Customer First Name')}</FieldLabel>
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
                  name="customerLastname"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>{t('Customer Last Name')}</FieldLabel>
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
                  name="customerPhone"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>{t('Customer Phone')}</FieldLabel>
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
                  name="customerAddress"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>{t('Customer Address')}</FieldLabel>
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
                mode={customerStatus === 'exist' ? 'visible' : 'hidden'}
              >
                <Controller
                  name="customerId"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>{t('Choose Customer')}</FieldLabel>
                      <Combobox
                        {...field}
                        list={customers || []}
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
                  const productId = form.watch(`products.${index}.id`);
                  const stock = productId ? getProductStock(productId) : 0;
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
                            {productId && (
                              <p className="text-sm text-muted-foreground">
                                {t('Available Stock')}: {stock}
                              </p>
                            )}
                            <Activity
                              mode={fieldState.invalid ? 'visible' : 'hidden'}
                            >
                              <FieldError errors={[fieldState.error]} />
                            </Activity>
                          </Field>
                        )}
                      />
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
                                max={stock}
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
                          name={`products.${index}.unitPrice` as const}
                          control={form.control}
                          render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                              <FieldLabel>{t('Unit Price')}</FieldLabel>
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
                      </div>
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
                    name="discount"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>{t('Discount')}</FieldLabel>
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
                      </Field>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                  <Controller
                    name="date"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>{t('Sale Date')}</FieldLabel>
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

export default SaleDialog;
