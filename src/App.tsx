import WindowFrame from '@/components/window-frame.tsx';
import Router from '@/router.tsx';

// initialize translations
import '@/i18n/i18n.ts';

function App() {
  // document.documentElement.dir = 'rtl';

  return (
    <WindowFrame>
      <Router />
    </WindowFrame>
  );
}

export default App;
