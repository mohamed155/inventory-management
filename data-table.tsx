import { useEffectEvent, useRef } from 'react';

const prevPageIndexRef = useRef<number | null>(null);

const pageChangeEvent = useEffectEvent((page: number) => {
  if (pageChanged) {
    pageChanged(page);
  }
});

useEffect(() => {
  // Only call pageChanged if the page actually changed (not on initial mount)
  if (
    prevPageIndexRef.current !== null &&
    prevPageIndexRef.current !== pagination.pageIndex
  ) {
    pageChangeEvent(pagination.pageIndex + 1);
  }
  prevPageIndexRef.current = pagination.pageIndex;
}, [pagination.pageIndex, pageChangeEvent]);
