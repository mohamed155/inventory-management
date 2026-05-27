import { zodResolver } from '@hookform/resolvers/zod';
import { Activity, useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx';
import { createUser, updateUser } from '@/services/auth.ts';
import type { UserRole } from '@/models/user.ts';
import type { User } from '../../../../generated/prisma/browser.ts';

type UserFormDialogProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user?: User;
};

function UserFormDialog({ open, onClose, onSuccess, user }: UserFormDialogProps) {
  const { t } = useTranslation();
  const isEdit = !!user;

  const formSchema = useMemo(
    () =>
      z.object({
        firstname: z.string().min(1, t('First name is required')),
        lastname: z.string().min(1, t('Last name is required')),
        username: z.string().min(1, t('Username is required')),
        password: isEdit
          ? z.string().min(8, t('Password must be at least 8 characters')).or(z.literal(''))
          : z.string().min(8, t('Password must be at least 8 characters')),
        role: z.enum(['admin', 'assistant']),
      }),
    [t, isEdit],
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstname: '',
      lastname: '',
      username: '',
      password: '',
      role: 'assistant',
    },
  });

  useEffect(() => {
    form.reset({
      firstname: user?.firstname ?? '',
      lastname: user?.lastname ?? '',
      username: user?.username ?? '',
      password: '',
      role: (user?.role as UserRole) ?? 'assistant',
    });
  }, [form, user]);

  const onSubmit = async () => {
    const values = form.getValues();
    try {
      if (isEdit && user) {
        const updateData: Record<string, string> = {
          firstname: values.firstname,
          lastname: values.lastname,
          username: values.username,
          role: values.role,
        };
        if (values.password) {
          updateData.password = values.password;
        }
        await updateUser(user.id, updateData);
        toast(t('User updated successfully'));
      } else {
        await createUser({
          firstname: values.firstname,
          lastname: values.lastname,
          username: values.username,
          password: values.password,
          role: values.role,
        });
        toast(t('User created successfully'));
      }
      onSuccess();
      onClose();
    } catch (error) {
      if (error instanceof Error && error.message.includes('username')) {
        form.setError('username', {
          type: 'manual',
          message: t('Username is already taken, please use another username'),
        });
      } else if (error instanceof Error) {
        toast(error.message);
      }
    }
  };

  const openChange = (isOpen: boolean) => {
    if (!isOpen) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={openChange}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEdit ? t('Edit User') : t('Create User')}
            </DialogTitle>
          </DialogHeader>
          <FieldGroup>
            <div className="flex items-center gap-4">
              <Controller
                name="firstname"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>{t('First name')}</FieldLabel>
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
                    <FieldLabel>{t('Last name')}</FieldLabel>
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
            </div>
            <Controller
              name="username"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>{t('Username')}</FieldLabel>
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
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>
                    {isEdit ? t('New Password (leave blank to keep current)') : t('Password')}
                  </FieldLabel>
                  <Input
                    {...field}
                    type="password"
                    aria-invalid={fieldState.invalid}
                    autoComplete="new-password"
                  />
                  <Activity mode={fieldState.invalid ? 'visible' : 'hidden'}>
                    <FieldError errors={[fieldState.error]} />
                  </Activity>
                </Field>
              )}
            />
            <Controller
              name="role"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel>{t('Role')}</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">{t('Admin')}</SelectItem>
                      <SelectItem value="assistant">{t('Assistant')}</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
          </FieldGroup>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                {t('Cancel')}
              </Button>
            </DialogClose>
            <Button onClick={() => form.handleSubmit(onSubmit)()}>
              {t('Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}

export default UserFormDialog;
