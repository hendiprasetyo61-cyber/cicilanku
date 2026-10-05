'use client';

import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Cek apakah sudah running standalone PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstallable(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  if (!isInstallable || isDismissed) return null;

  return (
    <div className="my-4 rounded-2xl bg-gradient-to-r from-orange-500 via-rose-500 to-shopee-600 p-4 text-white shadow-lg shadow-orange-500/20">
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3">
          <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-xs flex items-center justify-center shrink-0">
            <Smartphone className="h-6 w-6 text-white" />
          </div>
          <div>
            <h4 className="font-bold text-sm tracking-tight">Pasang CicilanKu di HP / Laptop</h4>
            <p className="text-xs text-orange-100 mt-0.5 leading-relaxed">
              Buka lebih cepat langsung dari layar utama tanpa browser dan dapatkan notifikasi jatuh tempo.
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsDismissed(true)}
          className="rounded-lg p-1 text-white/80 hover:bg-white/10 transition"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={handleInstallClick}
          className="bg-white text-slate-900 hover:bg-slate-100 font-bold"
        >
          <Download className="h-4 w-4 mr-1.5 text-shopee-600" />
          Install Sekarang
        </Button>
        <button
          onClick={() => setIsDismissed(true)}
          className="text-xs text-orange-100 hover:text-white px-2.5 py-1.5 font-medium transition"
        >
          Nanti Saja
        </button>
      </div>
    </div>
  );
};
