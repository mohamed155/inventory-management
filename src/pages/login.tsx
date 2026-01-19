import { zodResolver } from '@hookform/resolvers/zod';
import { Activity, useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import z from 'zod';
import { Button } from '@/components/ui/button.tsx';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field.tsx';
import { Input } from '@/components/ui/input.tsx';
import { getUsersCount, signIn } from '@/services/auth.ts';
import { useCurrentUserStore } from '@/store/user.store.ts';

function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setCurrentUser = useCurrentUserStore(
    (state: any) => state.setCurrentUser,
  );

  const formSchema = useMemo(
    () =>
      z.object({
        username: z.string().min(1, t('Username is required')),
        password: z
          .string()
          .min(8, t('Password must be at least 8 characters')),
      }),
    [t],
  );

  useEffect(() => {
    getUsersCount().then((count) => {
      if (count === 0) {
        navigate('/signup');
      }
    });
  }, [navigate]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async () => {
    const loginValue = form.getValues();
    const user = await signIn(loginValue.username, loginValue.password);
    if (user) {
      console.log(user);
      await setCurrentUser({
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        username: user.username,
      });
      window.location.href = '/';
    } else {
      toast('Invalid username or password');
    }
  };

  return (
    <div className="flex justify-center items-center h-full">
      <div className="p-4 w-[400px]">
        <h1 className="text-3xl font-semibold pb-2">{t('Login')}</h1>
        <p className="text-lg pb-10">{t('Please fill this form to login')}</p>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
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
          </FieldGroup>
          <Button className="mt-12 w-full">Submit</Button>
        </form>
      </div>
    </div>
  );
}

export default Login;
