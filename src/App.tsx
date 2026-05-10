import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import i18n from 'i18next';
import { useEffect } from 'react';
import WindowFrame from '@/components/window-frame.tsx';
import { ConfirmProvider } from '@/context/confirm-context.tsx';
import Router from '@/router.tsx';
import { useCurrentLang } from '@/store/lang.store.ts';

// initialize translations
import '@/i18n/i18n.ts';

const queryClient = new QueryClient();

function App() {
  const lang = useCurrentLang((s) => s.lang);

  useEffect(() => {
    i18n.changeLanguage(lang);
    document.documentElement.dir = i18n.dir(lang);
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <ConfirmProvider>
      <WindowFrame>
        <QueryClientProvider client={queryClient}>
          <Router />
        </QueryClientProvider>
      </WindowFrame>
    </ConfirmProvider>
  );
}

export default App;
