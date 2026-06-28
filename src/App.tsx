import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import i18n from 'i18next';
import { useEffect } from 'react';
import { toast } from 'sonner';
import WindowFrame from '@/components/window-frame.tsx';
import { Toaster } from '@/components/ui/sonner.tsx';
import { ConfirmProvider } from '@/context/confirm-context.tsx';
import { applyPrimaryColor } from '@/lib/color-theme.ts';
import Router from '@/router.tsx';
import { useCurrentLang } from '@/store/lang.store.ts';
import { useCurrentSettings } from '@/store/settings.store.ts';

// initialize translations
import '@/i18n/i18n.ts';

// Apply persisted color before first render (prevents flash)
applyPrimaryColor(useCurrentSettings.getState().primaryColor);

const onDbError = (error: Error) => {
  toast.error(i18n.t('Database error'), { description: error.message });
};

const queryClient = new QueryClient({
  mutationCache: new MutationCache({ onError: onDbError }),
  queryCache: new QueryCache({ onError: onDbError }),
});

function App() {
  const lang = useCurrentLang((s) => s.lang);
  const primaryColor = useCurrentSettings((s) => s.primaryColor);

  useEffect(() => {
    i18n.changeLanguage(lang);
    document.documentElement.dir = i18n.dir(lang);
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    applyPrimaryColor(primaryColor);
  }, [primaryColor]);

  return (
    <ConfirmProvider>
      <WindowFrame>
        <QueryClientProvider client={queryClient}>
          <Router />
        </QueryClientProvider>
      </WindowFrame>
      <Toaster />
    </ConfirmProvider>
  );
}

export default App;
