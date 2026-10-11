'use client';

import { useEffect } from 'react';

export function PwaRegistry() {
    useEffect(() => {
        // 1. Tangkap event install di level global, lalu simpan
        const onBeforeInstall = (e: Event) => {
            e.preventDefault();
            window.__pwaDeferredPrompt = e as BeforeInstallPromptEvent;
            window.dispatchEvent(new Event('pwa-installable'));
        };

        const onInstalled = () => {
            window.__pwaDeferredPrompt = null;
            window.dispatchEvent(new Event('pwa-installed'));
        };

        window.addEventListener('beforeinstallprompt', onBeforeInstall);
        window.addEventListener('appinstalled', onInstalled);

        // 2. Daftarkan service worker
        const register = () => {
            navigator.serviceWorker
                .register('/sw.js', { scope: '/' })
                .then((reg) => console.log('SW terdaftar:', reg.scope))
                .catch((err) => console.error('SW gagal didaftarkan:', err));
        };

        if ('serviceWorker' in navigator) {
            if (document.readyState === 'complete') {
                register();
            } else {
                window.addEventListener('load', register, { once: true });
            }
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', onBeforeInstall);
            window.removeEventListener('appinstalled', onInstalled);
            window.removeEventListener('load', register);
        };
    }, []);

    return null;
}