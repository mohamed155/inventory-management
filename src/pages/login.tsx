import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import z from 'zod';
import { FieldGroup } from '@/components/ui/field.tsx';
import { getUserByUsername } from '@/services/auth.ts';
import { useCurrentUserStore } from '@/store/user.store.ts';

function Login() {
  const { t } = useTranslation();
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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async () => {
    const loginValue = form.getValues();
    const user = await getUserByUsername(loginValue.username);
    if (user && user.password === loginValue.password) {
      await setCurrentUser({
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
        <h1 className="text-3xl font-semibold pb-2">{t('Welcome')}</h1>
        <p className="text-lg pb-10">
          {t('Please fill this form as the first user')}
        </p>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <div className="grid grid-cols-2 gap-4"></div>
          </FieldGroup>
        </form>
      </div>
    </div>
  );
}

export default Login;
