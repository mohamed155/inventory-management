import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import i18n from 'i18next';
import WindowFrame from '@/components/window-frame.tsx';
import { ConfirmProvider } from '@/context/confirm-context.tsx';
import Router from '@/router.tsx';

// initialize translations
import '@/i18n/i18n.ts';

const queryClient = new QueryClient();

function App() {
  document.documentElement.dir = i18n.dir(i18n.language);

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
