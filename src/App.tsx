import WindowFrame from '@/components/window-frame.tsx';
import Router from '@/router.tsx';

// initialize translations
import '@/i18n/i18n.ts';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function App() {
  document.documentElement.dir = 'rtl';

  return (
    <WindowFrame>
      <QueryClientProvider client={queryClient}>
        <Router />
      </QueryClientProvider>
    </WindowFrame>
  );
}

export default App;
