import { useEffect, useState } from 'react';

export function useIsRTL() {
  const [isRTL, setIsRTL] = useState(false);
  useEffect(() => {
    const dir = document.documentElement.dir;
    setIsRTL(dir === 'rtl');
    // Or with i18next: const dir = i18n.dir(i18n.language);
  }, []);
  return isRTL;
}
