import i18n from 'i18next';
import { useEffect, useState } from 'react';

export function useIsRTL() {
  const [isRTL, setIsRTL] = useState(false);
  useEffect(() => {
    const dir = i18n.dir(i18n.language);
    setIsRTL(dir === 'rtl');
  }, []);
  return isRTL;
}
