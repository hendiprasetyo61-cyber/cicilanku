'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { PWAInstallPrompt } from '@/components/pwa/PWAInstallPrompt';
import { LayoutDashboard, CreditCard, ArrowDownCircle, Users, Settings } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const desktopNavItems = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'Pinjaman', href: '/loans', icon: CreditCard },
    { label: 'Setoran Teman', href: '/payments', icon: ArrowDownCircle },
    { label: 'Daftar Teman', href: '/debtors', icon: Users },
    { label: 'Pengaturan', href: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/60 pb-20 md:pb-8">
      <Header />

      {/* Desktop Sub-navigation */}
      <nav
        aria-label="Navigasi Utama Desktop"
        className="hidden md:block border-b border-slate-200/80 bg-white/60 backdrop-blur-xs"
      >
        <div className="container mx-auto max-w-5xl px-4 flex gap-6">
          {desktopNavItems.map((item) => {
            const Icon = item.icon;
            // Logika untuk menentukan apakah menu sedang aktif
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center gap-2 py-3 text-xs font-semibold border-b-2 transition-colors ${isActive
                    ? 'border-shopee-500 text-shopee-600'
                    : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
                  }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="container mx-auto max-w-5xl px-4 py-5 flex-1">
        <PWAInstallPrompt />
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
}