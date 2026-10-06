'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  Plus,
  Bell,
  Settings,
  Users,
  ArrowDownCircle,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';

export const Header: React.FC = () => {
  const router = useRouter();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userFullName, setUserFullName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Mengambil data user saat komponen dimuat
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const metadata = user.user_metadata || {};
          const name = metadata.full_name || metadata.name || user.email?.split('@')[0] || 'Pengguna';
          setUserFullName(name);
          setUserEmail(user.email || null);
        }
      } catch (err) {
        console.error('Error fetching user:', err);
      }
    };

    fetchUser();

    // Menutup dropdown jika user mengklik area di luar dropdown
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    // Menambahkan konfirmasi sebelum logout
    if (!window.confirm('Apakah kamu yakin ingin keluar dari akun?')) {
      return;
    }

    setIsProfileOpen(false);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Signout error:', e);
    }
    router.push('/login');
    router.refresh();
  };

  const displayName = userFullName || (userEmail ? userEmail.split('@')[0] : 'Akun Saya');
  const initial = displayName.charAt(0).toUpperCase() || 'C';

  return (
    // Class overflow-hidden DIHAPUS di sini agar dropdown bisa muncul dengan normal
    <header className="sticky top-0 z-30 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 max-w-5xl items-center justify-between px-4">

        {/* Brand Logo - Dikembalikan utuh seperti desain asli Anda */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-tr from-shopee-600 to-shopee-400 text-white shadow-md shadow-shopee-500/25 group-hover:scale-105 transition-transform duration-200">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-extrabold tracking-tight text-slate-900">
                Cicilan<span className="text-shopee-500">Ku</span>
              </span>
              <span className="rounded-md bg-shopee-50 px-1.5 py-0.5 text-[10px] font-bold text-shopee-600 border border-shopee-200/60">
                SPayLater
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">Bantu Teman, Bebas Pusing</p>
          </div>
        </Link>

        {/* Action Buttons & Profile Dropdown */}
        <div className="flex items-center gap-2.5">
          {/* Tombol Pinjaman Baru hanya disembunyikan di HP menggunakan "hidden sm:block" */}
          <Link href="/loans/new" className="hidden sm:block">
            <Button size="sm" className="shadow-sm">
              <Plus className="h-4 w-4 mr-1" />
              Pinjaman Baru
            </Button>
          </Link>

          <Link
            href="/settings"
            title="Pengaturan & Notifikasi"
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
          >
            <Bell className="h-5 w-5" />
          </Link>

          {/* Interactive Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsProfileOpen((prev) => !prev)}
              aria-label="Menu Pengguna"
              className="flex items-center gap-1.5 rounded-full p-1 border border-slate-200 hover:border-shopee-300 hover:shadow-xs transition duration-150 focus:outline-none focus:ring-2 focus:ring-shopee-500/20"
            >
              <div className="h-8 w-8 rounded-full bg-linear-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                {initial}
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 mr-1 hidden sm:block" />
            </button>

            {/* Dropdown Menu Modal */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-2xl bg-white p-2 shadow-xl border border-slate-200/80 animate-in fade-in zoom-in-95 duration-150 z-50">
                {/* User Info Header */}
                <div className="p-3 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 truncate capitalize">{displayName}</span>
                  </div>
                  {userEmail && (
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{userEmail}</p>
                  )}
                </div>

                {/* Navigation Links */}
                <div className="py-1.5 text-xs font-medium text-slate-700">
                  <Link
                    href="/settings"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-50 transition"
                  >
                    <Settings className="h-4 w-4 text-slate-400" />
                    <span>Pengaturan & Reminder</span>
                  </Link>

                  <Link
                    href="/debtors"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-50 transition"
                  >
                    <Users className="h-4 w-4 text-slate-400" />
                    <span>Kelola Teman</span>
                  </Link>

                  <Link
                    href="/payments"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-50 transition"
                  >
                    <ArrowDownCircle className="h-4 w-4 text-slate-400" />
                    <span>Riwayat Setoran Teman</span>
                  </Link>
                </div>

                {/* Footer / Logout */}
                <div className="pt-1.5 border-t border-slate-100">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-rose-50 text-rose-600 font-semibold text-xs transition text-left"
                  >
                    <LogOut className="h-4 w-4 text-rose-500" />
                    <span>Keluar Akun</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};