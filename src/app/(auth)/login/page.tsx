'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Email dan kata sandi wajib diisi');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        setError(authError.message === 'Invalid login credentials' ? 'Email atau kata sandi salah' : authError.message);
        setIsLoading(false);
        return;
      }

      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Terjadi kesalahan saat masuk');
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
            Catat cicilan Shopee PayLater untuk teman dengan kalkulasi talangan kas yang transparan.
          </p>
        </div>

        {/* Card Login */}
        <Card className="p-6 sm:p-8 space-y-5 bg-white/95 backdrop-blur-md shadow-xl border border-slate-200/80">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">Masuk ke Akun</h2>
            <p className="text-xs text-slate-500">Masukkan email dan kata sandi akun kamu</p>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Email Akun"
              type="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Kata Sandi"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
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

            <Button type="submit" isLoading={isLoading} className="w-full">
              Masuk Sekarang <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </form>

          <div className="text-center pt-2">
            <p className="text-xs text-slate-500">
              Belum punya akun?{' '}
              <Link href="/register" className="font-bold text-shopee-600 hover:underline">
                Daftar Akun Baru
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
