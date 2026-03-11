import React, { createContext, useContext, useState, useEffect } from 'react';

interface PWAContextType {
  deferredPrompt: any;
  installApp: () => Promise<void>;
  isInstallable: boolean;
}

const PWAContext = createContext<PWAContextType>({
  deferredPrompt: null,
  installApp: async () => {},
  isInstallable: false,
});

export const usePWA = () => useContext(PWAContext);

export const PWAProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const installApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  return (
    <PWAContext.Provider value={{ deferredPrompt, installApp, isInstallable: !!deferredPrompt }}>
      {children}
    </PWAContext.Provider>
  );
};
