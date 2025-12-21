import { zodResolver } from '@hookform/resolvers/zod';
import { Activity, useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
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
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field.tsx';
import { Input } from '@/components/ui/input.tsx';
import { useConfirm } from '@/context/confirm-context.tsx';
import type { Customer } from '../../../generated/prisma/browser.ts';

function CustomerDialog({
  customer,
  open,
  onClose,
}: {
  customer?: Partial<Customer>;
  open: boolean;
  onClose?: (customer?: Partial<Customer>) => void;
}) {
  const { t } = useTranslation();
  const { confirm } = useConfirm();

  const formSchema = useMemo(
    () =>
      z.object({
        id: z.string().optional(),
        firstname: z.string().min(1, t('First name is required')),
        lastname: z.string().min(1, t('Last name is required')),
        phone: z.string(),
        address: z.string(),
      }),
    [t],
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: undefined,
      firstname: '',
      lastname: '',
      phone: '',
      address: '',
    },
  });

  useEffect(() => {
    form.reset({
      id: customer ? customer.id : undefined,
      firstname: customer ? customer.firstname : '',
      lastname: customer ? customer.lastname : '',
      phone: customer ? customer.phone : '',
      address: customer ? (customer.address ?? '') : '',
    });
  }, [form, customer]);

  const onSubmit = async () => {
    if (onClose) {
      if (customer) {
        const editConfirm = await confirm(
          t('Are you sure to edit this record?'),
        );
        if (editConfirm) {
          onClose({
            ...form.getValues(),
            id: customer.id,
          } as Partial<Customer>);
        }
      } else {
        onClose(form.getValues() as Partial<Customer>);
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
            <DialogTitle>
              {customer ? t('Edit Customer') : t('Add Customer')}
            </DialogTitle>
          </DialogHeader>
          <FieldGroup>
            <div className="flex items-center gap-4">
              <Controller
                name="firstname"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>{t('First Name')}</FieldLabel>
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
                name="lastname"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>{t('Last Name')}</FieldLabel>
                    <Input
                      {...field}
                      aria-invalid={fieldState.invalid}
                      autoComplete="off"
                    />
                  </Field>
                )}
              />
            </div>
            <Controller
              name="phone"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>{t('Phone')}</FieldLabel>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    autoComplete="off"
                  />
                </Field>
              )}
            />
            <Controller
              name="address"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>{t('Address')}</FieldLabel>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    autoComplete="off"
                  />
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
            <Button
              onClick={() => {
                console.log(form.formState.errors);
                form.handleSubmit(onSubmit)();
              }}
            >
              {t('Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
export default CustomerDialog;
