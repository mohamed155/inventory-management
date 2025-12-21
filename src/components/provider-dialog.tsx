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
import type { Provider } from '../../generated/prisma/browser.ts';

function ProviderDialog({
  provider,
  open,
  onClose,
}: {
  provider?: Partial<Provider>;
  open: boolean;
  onClose?: (provider?: Partial<Provider>) => void;
}) {
  const { t } = useTranslation();
  const { confirm } = useConfirm();

  const formSchema = useMemo(
    () =>
      z.object({
        id: z.string().optional(),
        name: z.string().min(1, t('Name is required')),
        phone: z.string(),
        address: z.string(),
      }),
    [t],
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: undefined,
      name: '',
      phone: '',
      address: '',
    },
  });

  useEffect(() => {
    form.reset({
      id: provider ? provider.id : undefined,
      name: provider ? provider.name : '',
      phone: provider ? provider.phone : '',
      address: provider ? (provider.address ?? '') : '',
    });
  }, [form, provider]);

  const onSubmit = async () => {
    if (onClose) {
      if (provider) {
        const editConfirm = await confirm(
          t('Are you sure to edit this record?'),
        );
        if (editConfirm) {
          onClose({
            ...form.getValues(),
            id: provider.id,
          } as Partial<Provider>);
        }
      } else {
        onClose(form.getValues() as Partial<Provider>);
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
              {provider ? t('Edit Provider') : t('Add Provider')}
            </DialogTitle>
          </DialogHeader>
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>{t('Name')}</FieldLabel>
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

export default ProviderDialog;
