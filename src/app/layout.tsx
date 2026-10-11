import type { Metadata, Viewport } from 'next';
import './globals.css';

import { PwaRegistry } from '@/components/PwaRegistry';
import { PWAInstallPrompt } from '@/components/pwa/PWAInstallPrompt';

export const metadata: Metadata = {
  title: 'CicilanKu — Catat Cicilan Shopee PayLater untuk Teman',
  description:
    'Aplikasi pencatat cicilan Shopee PayLater yang dipakai teman dengan nominal setoran fleksibel, kalkulasi talangan kas, dan reminder otomatis.',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CicilanKu',
  },
  applicationName: 'CicilanKu',
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: '#ee4d2d',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-orange-100 selection:text-shopee-600">
        {/* Daftarkan service worker + tangkap event install */}
        <PwaRegistry />

        {/* Banner ajakan install */}
        <div className="container mx-auto max-w-5xl px-4">
          <PWAInstallPrompt />
        </div>

        {children}
      </body>
    </html>
  );
}