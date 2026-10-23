import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/**
 * A clock that ticks on an interval and re-syncs the moment the app returns to
 * the foreground — otherwise a phone that slept through third period would show
 * a stale countdown until the next tick.
 */
export function useNow(intervalMs = 20_000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), intervalMs);

    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') setNow(new Date());
    });

    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [intervalMs]);

  return now;
}
