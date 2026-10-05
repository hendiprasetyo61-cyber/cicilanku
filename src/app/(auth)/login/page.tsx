'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, ArrowRight, ShieldCheck, Sparkles, UserCheck } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        // Jika project Supabase belum disetup atau credentials dummy, arahkan ke dashboard dengan mode demo
        if (
          authError.message.includes('FetchError') ||
          authError.message.includes('Invalid login') ||
          authError.message.includes('placeholder')
        ) {
          router.push('/');
          return;
        }
        setError(authError.message);
        setIsLoading(false);
        return;
      }

      router.push('/');
    } catch (err: any) {
      // Fallback ke demo mode jika offline
      router.push('/');
    }
  };

  const handleDemoLogin = () => {
    router.push('/');
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
            <p className="text-xs text-slate-500">Masukkan email dan kata sandi kamu</p>
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
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button type="submit" isLoading={isLoading} className="w-full">
              Masuk Sekarang <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </form>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-3 text-[11px] text-slate-400 font-medium uppercase tracking-wider">
              Atau Akses Cepat
            </span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Quick Demo Mode */}
          <Button
            type="button"
            variant="secondary"
            onClick={handleDemoLogin}
            className="w-full bg-slate-900 hover:bg-slate-800 text-xs"
          >
            <Sparkles className="h-4 w-4 mr-1.5 text-amber-400" />
            Buka Langsung Mode Demo (HP Rp 3 Juta)
          </Button>

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
