'use client';

import { useEffect } from 'react';

export function PwaRegistry() {
    useEffect(() => {
        // Mengecek apakah browser mendukung Service Worker
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', function () {
                navigator.serviceWorker.register('/sw.js').then(
                    function (registration) {
                        console.log('PWA Service Worker terdaftar dengan sukses!', registration.scope);
                    },
                    function (err) {
                        console.log('PWA Service Worker gagal didaftarkan: ', err);
                    }
                );
            });
        }
    }, []);

    return null; // Komponen ini berjalan di latar belakang dan tidak menampilkan apa-apa
}