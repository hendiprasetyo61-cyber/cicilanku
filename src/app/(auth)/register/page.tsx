'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, ArrowRight, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';

export default function RegisterPage() {
  const router = useRouter();
  const [namaLengkap, setNamaLengkap] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaLengkap.trim()) {
      setError('Nama lengkap wajib diisi');
      return;
    }
    if (!email || !password) {
      setError('Semua kolom wajib diisi');
      return;
    }
    if (password.length < 6) {
      setError('Kata sandi minimal 6 karakter');
      return;
    }
    if (password !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: namaLengkap.trim(),
            name: namaLengkap.trim(),
          },
        },
      });

      if (authError) {
        setError(authError.message);
        setIsLoading(false);
        return;
      }

      setIsSuccess(true);
      // Jika auto-confirm aktif atau session sudah dibuat
      setTimeout(() => router.push('/'), 1200);
    } catch (err: any) {
      setError(err?.message || 'Gagal mendaftar akun');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-orange-50/30 to-slate-100">
      <div className="max-w-md w-full space-y-6">
        {/* Brand Banner */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-shopee-600 to-shopee-400 text-white shadow-xl shadow-shopee-500/25">
            <ShoppingBag className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Cicilan<span className="text-shopee-500">Ku</span>
          </h1>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Daftar akun gratis untuk mencatat transaksi Shopee PayLater temanmu secara aman.
          </p>
        </div>

        {/* Card Register */}
        <Card className="p-6 sm:p-8 space-y-5 bg-white/95 backdrop-blur-md shadow-xl border border-slate-200/80">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">Buat Akun Baru</h2>
            <p className="text-xs text-slate-500">Daftarkan email kamu untuk sinkronisasi data cloud Supabase</p>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200 font-medium">
              {error}
            </div>
          )}

          {isSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              Pendaftaran berhasil! Mengalihkan ke dashboard...
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <Input
              label="Nama Lengkap"
              type="text"
              placeholder="Contoh: Hendri Prasetyo"
              value={namaLengkap}
              onChange={(e) => setNamaLengkap(e.target.value)}
              required
            />

            <Input
              label="Email"
              type="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Kata Sandi"
              type={showPassword ? 'text' : 'password'}
              placeholder="Minimal 6 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              suffix={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-600 focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              required
            />

            <Input
              label="Konfirmasi Kata Sandi"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Ulangi kata sandi"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              suffix={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-slate-400 hover:text-slate-600 focus:outline-none"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              required
            />

            <Button type="submit" isLoading={isLoading} className="w-full">
              Daftar Akun <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </form>

          <div className="text-center pt-2">
            <p className="text-xs text-slate-500">
              Sudah memiliki akun?{' '}
              <Link href="/login" className="font-bold text-shopee-600 hover:underline">
                Masuk di Sini
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
