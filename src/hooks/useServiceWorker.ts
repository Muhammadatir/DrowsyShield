import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export const useServiceWorker = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg);

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateAvailable(true);
                toast({
                  title: 'Update Available',
                  description: 'A new version is available. Refresh to update.',
                  duration: 10000,
                });
              }
            });
          }
        });
      });
    }
  }, [toast]);

  const updateServiceWorker = () => {
    if (registration) {
      registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  return {
    updateAvailable,
    updateServiceWorker,
  };
};
