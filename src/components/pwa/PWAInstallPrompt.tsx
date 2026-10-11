'use client';

import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const DISMISS_KEY = 'cicilanku-pwa-dismissed-at';
const DISMISS_DAYS = 7;

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function recentlyDismissed() {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    return Date.now() - Number(raw) < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    // Sudah terpasang atau baru saja ditutup → jangan tampilkan
    if (isStandalone() || recentlyDismissed()) return;

    setHidden(false);
    setShowIosHint(/iphone|ipad|ipod/i.test(navigator.userAgent));

    // Event mungkin sudah tertangkap sebelum komponen ini tampil
    if (window.__pwaDeferredPrompt) {
      setDeferredPrompt(window.__pwaDeferredPrompt);
    }

    const onInstallable = () => setDeferredPrompt(window.__pwaDeferredPrompt ?? null);
    const onInstalled = () => {
      setDeferredPrompt(null);
      setHidden(true);
    };

    window.addEventListener('pwa-installable', onInstallable);
    window.addEventListener('pwa-installed', onInstalled);

    return () => {
      window.removeEventListener('pwa-installable', onInstallable);
      window.removeEventListener('pwa-installed', onInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    window.__pwaDeferredPrompt = null;
    setDeferredPrompt(null);
    if (outcome === 'accepted') setHidden(true);
  };

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* abaikan jika localStorage tidak tersedia */
    }
    setHidden(true);
  };

  // Tampil hanya jika bisa di-install (Android/Desktop) atau perlu petunjuk iOS
  if (hidden || (!deferredPrompt && !showIosHint)) return null;

  return (
    <div className="my-4 rounded-2xl bg-linear-to-r from-orange-500 via-rose-500 to-shopee-600 p-4 text-white shadow-lg shadow-orange-500/20">
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3">
          <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-xs flex items-center justify-center shrink-0">
            <Smartphone className="h-6 w-6 text-white" />
          </div>
          <div>
            <h4 className="font-bold text-sm tracking-tight">
              Pasang CicilanKu di HP / Laptop
            </h4>
            <p className="text-xs text-orange-100 mt-0.5 leading-relaxed">
              {deferredPrompt
                ? 'Buka lebih cepat langsung dari layar utama tanpa browser dan dapatkan notifikasi jatuh tempo.'
                : 'Di iPhone: ketuk tombol Bagikan di Safari, lalu pilih "Tambah ke Layar Utama".'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Tutup"
          className="rounded-lg p-1 text-white/80 hover:bg-white/10 transition"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2">
        {deferredPrompt && (
          <Button
            size="sm"
            variant="secondary"
            onClick={handleInstallClick}
            className="bg-white text-slate-900 hover:bg-slate-100 font-bold"
          >
            <Download className="h-4 w-4 mr-1.5 text-shopee-600" />
            Install Sekarang
          </Button>
        )}
        <button
          type="button"
          onClick={handleDismiss}
          className="text-xs text-orange-100 hover:text-white px-2.5 py-1.5 font-medium transition"
        >
          Nanti Saja
        </button>
      </div>
    </div>
  );
};