'use client'

import { useToast } from '@/components/ui/use-toast';
import { useCallback, useEffect, useRef, useState } from 'react';

interface PWAProviderProps {
  children: React.ReactNode;
}


interface BeforeInstallPromptEventPWA extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAProvider({ children }: PWAProviderProps) {
  const { toast } = useToast();
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  const skipWaitingAndReload = useCallback(() => {
    const reg = registrationRef.current;
    if (reg?.waiting) {
      reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }
  }, []);

  const registerServiceWorker = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });

        registrationRef.current = reg;


        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                toast({
                  title: "Atualização disponível",
                  description: "Uma nova versão do ManagerCar está disponível.",
                  action: (
                    <button
                      type="button"
                      onClick={skipWaitingAndReload}
                      className="bg-primary text-primary-foreground px-3 py-1 rounded text-sm"
                    >
                      Atualizar
                    </button>
                  ),
                });
              }
            });
          }
        });


        if (reg.active && !navigator.serviceWorker.controller) {

          window.location.reload();
        }

        console.log('[PWA] Service Worker registrado:', reg.scope);
      } catch (error) {
        console.error('[PWA] Erro ao registrar Service Worker:', error);
      }
    } else {
      console.log('[PWA] Service Worker não suportado');
    }
  }, [toast, skipWaitingAndReload]);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      void (async () => {
        if (!('serviceWorker' in navigator)) {
          return;
        }
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map((r) => r.unregister()));
          if ('caches' in window) {
            const names = await caches.keys();
            await Promise.all(names.map((name) => caches.delete(name)));
          }
        } catch {

        }
      })();
      return;
    }
    void registerServiceWorker();
  }, [registerServiceWorker]);


  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SW_UPDATE_READY') {
          toast({
            title: 'Atualização pronta',
            description: 'Recarregue a página para usar a nova versão.',
          });
        }
      });
    }
  }, [toast]);


  useEffect(() => {
    const handleOnline = () => {
      toast({
        title: "Conexão restaurada",
        description: "Você está online novamente!",
      });
    };

    const handleOffline = () => {
      toast({
        title: "Você está offline",
        description: "Alguns recursos podem estar limitados.",
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  return <>{children}</>;
}


export function usePWA() {
  const [isOnline, setIsOnline] = useState(true);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEventPWA | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {

    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);


    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEventPWA);
    };


    const checkIfInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    });

    checkIfInstalled();

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const installApp = async (): Promise<void> => {
    if (!installPrompt) {
      return;
    }
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  const getCacheStats = async (): Promise<Record<string, number> | null> => {
    const controller = navigator.serviceWorker.controller;
    if ('serviceWorker' in navigator && controller) {
      return new Promise((resolve) => {
        const messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data);
        };

        controller.postMessage(
          { type: 'CACHE_STATS' },
          [messageChannel.port2]
        );
      });
    }
    return null;
  };

  const clearCache = async (): Promise<boolean> => {
    const controller = navigator.serviceWorker.controller;
    if ('serviceWorker' in navigator && controller) {
      return new Promise((resolve) => {
        const messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data.success);
        };

        controller.postMessage(
          { type: 'CLEAR_CACHE' },
          [messageChannel.port2]
        );
      });
    }
    return false;
  };

  return {
    isOnline,
    installPrompt,
    isInstalled,
    installApp,
    getCacheStats,
    clearCache,
  };
} 