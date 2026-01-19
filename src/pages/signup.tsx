import { zodResolver } from '@hookform/resolvers/zod';
import { Activity, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import z from 'zod';
import { Button } from '@/components/ui/button.tsx';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field.tsx';
import { Input } from '@/components/ui/input.tsx';
import { createUser } from '@/services/auth.ts';
import { useCurrentUserStore } from '@/store/user.store.ts';

function Signup() {
  const { t } = useTranslation();
  const setCurrentUser = useCurrentUserStore(
    (state: any) => state.setCurrentUser,
  );

  const formSchema = useMemo(
    () =>
      z
        .object({
          firstname: z.string().min(1, t('First name is required')),
          lastname: z.string().min(1, t('Last name is required')),
          username: z.string().min(1, t('Username is required')),
          password: z
            .string()
            .min(8, t('Password must be at least 8 characters')),
          confirmPassword: z
            .string()
            .min(8, t('Password must be at least 8 characters')),
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: t('Confirm password does not match password'),
          path: ['confirmPassword'],
        }),
    [t],
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstname: '',
      lastname: '',
      username: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async () => {
    const user = form.getValues();
    const createdUser = await createUser({
      firstname: user.firstname,
      lastname: user.lastname,
      username: user.username,
      password: user.password,
    });
    await setCurrentUser({
      id: createdUser.id,
      firstname: createdUser.firstname,
      lastname: createdUser.lastname,
      username: createdUser.username,
    });
    window.location.href = '/';
  };

  return (
    <div className="flex justify-center items-center h-full">
      <div className="p-4 w-[400px]">
        <h1 className="text-3xl font-semibold pb-2">{t('Welcome')}</h1>
        <p className="text-lg pb-10">
          {t('Please fill this form as the first user')}
        </p>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <div className="grid grid-cols-2 gap-4">
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
                  <FieldLabel>{t('Password')}</FieldLabel>
                  <Input
                    {...field}
                    type="password"
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
              name="confirmPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>{t('Confirm password')}</FieldLabel>
                  <Input
                    {...field}
                    type="password"
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
          <Button className="mt-12 w-full">{t('Submit')}</Button>
        </form>
      </div>
    </div>
  );
}

export default Signup;
