import {useEffect, useState} from 'react';

export function useCountdown(initialSeconds: number) {
  const [remaining, setRemaining] = useState(initialSeconds);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    setRemaining(initialSeconds);
    setRunning(false);
  }, [initialSeconds]);

  useEffect(() => {
    if (!running) return undefined;
    const timer = window.setInterval(() => {
      setRemaining((current) => {
        if (current <= 1) {
          setRunning(false);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  return {
    remaining,
    running,
    toggle: () => setRunning((current) => !current),
    reset: () => {
      setRemaining(initialSeconds);
      setRunning(false);
    },
  };
}
