'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CreditCard, ArrowDownCircle, Users, Settings } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { label: 'Ringkasan', href: '/', icon: LayoutDashboard },
    { label: 'Pinjaman', href: '/loans', icon: CreditCard },
    { label: 'Setoran', href: '/payments', icon: ArrowDownCircle },
    { label: 'Teman', href: '/debtors', icon: Users },
    { label: 'Pengaturan', href: '/settings', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 block border-t border-slate-200/80 bg-white/95 backdrop-blur-md md:hidden shadow-lg shadow-slate-900/5">
      <div className="flex h-16 items-center justify-around px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 flex-1 transition-colors ${
                isActive ? 'text-shopee-500 font-semibold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className={`p-1 rounded-xl transition ${isActive ? 'bg-shopee-50' : ''}`}>
                <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              </div>
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
