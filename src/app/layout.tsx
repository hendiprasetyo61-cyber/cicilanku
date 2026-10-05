import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CicilanKu — Catat Cicilan Shopee PayLater untuk Teman',
  description: 'Aplikasi pencatat cicilan Shopee PayLater yang dipakai teman dengan nominal setoran fleksibel, kalkulasi talangan kas, dan reminder otomatis.',
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
};

export const viewport: Viewport = {
  themeColor: '#ee4d2d',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <meta name="application-name" content="CicilanKu" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="CicilanKu" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-orange-100 selection:text-shopee-600">
        {children}
      </body>
    </html>
  );
}
