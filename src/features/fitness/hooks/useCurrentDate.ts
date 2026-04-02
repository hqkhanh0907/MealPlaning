import { useEffect, useState } from 'react';

export function useCurrentDate(): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setNow(new Date());
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    // Also refresh every 60 seconds as backup
    const id = setInterval(() => setNow(new Date()), 60_000);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      clearInterval(id);
    };
  }, []);

  return now;
}
