import { useEffect, useRef } from 'react';

import { pushBackEntry, removeBackEntries } from '../services/backNavigationService';
import { useNavigationStore } from '../store/navigationStore';

/**
 * Syncs navigationStore.pageStack with the centralized back navigation service.
 * When pages are pushed → adds back handlers.
 * When pages are popped programmatically → removes entries.
 * When user presses back → service calls popPage().
 */
export function usePageStackBackHandler(): void {
  const pageStackLength = useNavigationStore(s => s.pageStack.length);
  const popPage = useNavigationStore(s => s.popPage);
  const prevLengthRef = useRef(0);
  const pushedCountRef = useRef(0);

  useEffect(() => {
    const curr = pageStackLength;
    const prev = prevLengthRef.current;
    prevLengthRef.current = curr;

    if (curr > prev) {
      const delta = curr - prev;
      for (let i = 0; i < delta; i++) {
        pushBackEntry(() => {
          pushedCountRef.current--;
          popPage();
        });
        pushedCountRef.current++;
      }
    } else if (curr < prev && pushedCountRef.current > 0) {
      const delta = Math.min(prev - curr, pushedCountRef.current);
      if (delta > 0) {
        pushedCountRef.current -= delta;
        removeBackEntries(delta);
      }
    }
  }, [pageStackLength, popPage]);
}
