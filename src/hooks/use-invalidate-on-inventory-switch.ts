import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { useInventoryStore } from '@/store/inventory.store.ts';

export function useInvalidateOnInventorySwitch() {
  const queryClient = useQueryClient();
  const activeInventoryId = useInventoryStore((s) => s.activeInventoryId);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (activeInventoryId) {
      queryClient.invalidateQueries();
    }
  }, [activeInventoryId, queryClient]);
}
