'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Clock,
  Smartphone,
  Download,
  Check,
  AlertCircle,
  Send,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useCicilanStore } from '@/lib/store';

export default function SettingsPage() {
  const { settings, updateSettings, isLoaded } = useCicilanStore();

  const [pushStatus, setPushStatus] = useState<'default' | 'granted' | 'denied' | 'unsupported'>('default');
  const [testNotificationSent, setTestNotificationSent] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // State baru untuk menampilkan pesan modern pengganti alert()
  const [pushMessage, setPushMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!('Notification' in window)) {
        setPushStatus('unsupported');
      } else {
        setPushStatus(Notification.permission as any);
      }
    }
  }, []);

  if (!isLoaded) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-shopee-500" />
      </div>
    );
  }

  const handleRequestPushPermission = async () => {
    setPushMessage(null); // Reset pesan
    if (!('Notification' in window)) {
      setPushMessage({ type: 'error', text: 'Browser kamu tidak mendukung Web Push Notification.' });
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPushStatus(permission as any);

      if (permission === 'granted') {
        if ('serviceWorker' in navigator) {
          await navigator.serviceWorker.register('/sw.js');
          new Notification('CicilanKu Aktif!', {
            body: 'Kamu akan menerima notifikasi pengingat jatuh tempo Shopee PayLater tepat waktu.',
            icon: '/icon-192.png',
          });
          setPushMessage({ type: 'success', text: 'Notifikasi berhasil diaktifkan!' });
        }
      } else if (permission === 'denied') {
        setPushMessage({ type: 'error', text: 'Izin ditolak. Silakan aktifkan via pengaturan browser kamu.' });
      }
    } catch (e: any) {
      setPushMessage({ type: 'error', text: `Gagal mengaktifkan push: ${e?.message}` });
    }

    // Hilangkan pesan setelah 4 detik
    setTimeout(() => setPushMessage(null), 4000);
  };

  const handleSendTestPush = () => {
    if (Notification.permission === 'granted') {
      new Notification('Pengingat Tagihan SPayLater (H-3)', {
        body: 'Cicilan Samsung Galaxy A15 sebesar Rp 500.000 jatuh tempo 3 hari lagi (15 Okt). Budi belum transfer bulan ini.',
        icon: '/icon-192.png',
      });
      setTestNotificationSent(true);
      setTimeout(() => setTestNotificationSent(false), 3000);
    } else {
      handleRequestPushPermission();
    }
  };

  // Ubah menjadi async/await agar validasi simpannya akurat
  const handleToggle = async (key: keyof typeof settings) => {
    const updated = { [key]: !settings[key] };
    try {
      await updateSettings(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error('Gagal menyimpan pengaturan:', error);
    }
  };

  const handleExportBackup = () => {
    const backupData = {
      export_date: new Date().toISOString(),
      user_id: settings.user_id,
      settings: settings,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_cicilanku_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Pengaturan & Notifikasi</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Atur jadwal pengingat cicilan, aktivasi Web Push Notification, dan kelola cadangan data.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 font-semibold flex items-center gap-1.5 transition">
          <Check className="h-4 w-4 text-emerald-600" />
          Pengaturan berhasil disimpan.
        </div>
      )}

      {/* 1. Pengingat Jatuh Tempo (H-3, H-1, H-0) */}
      <Card className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Bell className="h-4 w-4 text-shopee-600" />
          <h2 className="text-sm font-bold text-slate-800">Jadwal Pengingat Tagihan Shopee PayLater</h2>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          Sistem akan mengirimkan notifikasi otomatis untuk setiap cicilan yang belum lunas sesuai jadwal yang dipilih.
        </p>

        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50/70 cursor-pointer transition">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Pengingat H-3 Sebelum Jatuh Tempo</span>
              <span className="text-[11px] text-slate-500">Beri tahu 3 hari lebih awal agar sempat menagih ke teman.</span>
            </div>
            <input
              type="checkbox"
              checked={settings.remind_h3}
              onChange={() => handleToggle('remind_h3')}
              className="h-4 w-4 accent-shopee-600 rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50/70 cursor-pointer transition">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Pengingat H-1 Besok Jatuh Tempo</span>
              <span className="text-[11px] text-slate-500">Peringatan sehari sebelumnya untuk memastikan ketersediaan dana.</span>
            </div>
            <input
              type="checkbox"
              checked={settings.remind_h1}
              onChange={() => handleToggle('remind_h1')}
              className="h-4 w-4 accent-shopee-600 rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50/70 cursor-pointer transition">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Pengingat Hari H Jatuh Tempo</span>
              <span className="text-[11px] text-slate-500">Peringatan prioritas tinggi di hari batas akhir pembayaran Shopee.</span>
            </div>
            <input
              type="checkbox"
              checked={settings.remind_h0}
              onChange={() => handleToggle('remind_h0')}
              className="h-4 w-4 accent-shopee-600 rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50/70 cursor-pointer transition">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Peringatan Teman Belum Menyetor (30 Hari)</span>
              <span className="text-[11px] text-slate-500">
                Pengingat mingguan jika teman belum pernah menyetor uang dalam 30 hari terakhir.
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.remind_inactivity}
              onChange={() => handleToggle('remind_inactivity')}
              className="h-4 w-4 accent-shopee-600 rounded cursor-pointer"
            />
          </label>
        </div>

        {/* Waktu Notifikasi */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-700">Waktu Pengiriman Notifikasi</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <input
              type="number"
              min={0}
              max={23}
              value={settings.reminder_hour}
              onChange={(e) => {
                updateSettings({ reminder_hour: Number(e.target.value) });
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 2000);
              }}
              className="w-14 p-1.5 rounded-lg border border-slate-200 text-center font-bold"
            />
            <span>:</span>
            <input
              type="number"
              min={0}
              max={59}
              value={settings.reminder_minute}
              onChange={(e) => {
                updateSettings({ reminder_minute: Number(e.target.value) });
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 2000);
              }}
              className="w-14 p-1.5 rounded-lg border border-slate-200 text-center font-bold"
            />
            <span className="text-slate-500 font-medium">WIB</span>
          </div>
        </div>
      </Card>

      {/* 2. Web Push Notification Setting */}
      <Card className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Smartphone className="h-4 w-4 text-shopee-600" />
          <h2 className="text-sm font-bold text-slate-800">Web Push Notification (PWA)</h2>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800">Status Izin Notifikasi:</span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${pushStatus === 'granted'
                    ? 'bg-emerald-100 text-emerald-700'
                    : pushStatus === 'denied'
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
              >
                {pushStatus === 'granted'
                  ? 'Aktif (Diizinkan)'
                  : pushStatus === 'denied'
                    ? 'Diblokir oleh Browser'
                    : 'Belum Diaktifkan'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {pushStatus === 'granted'
                ? 'Aplikasi dapat memunculkan popup notifikasi di Android dan Laptop/PC.'
                : 'Klik tombol untuk mengizinkan aplikasi mengirimkan peringatan jatuh tempo.'}
            </p>
          </div>

          <div className="flex gap-2">
            {pushStatus !== 'granted' ? (
              <Button size="sm" onClick={handleRequestPushPermission}>
                Izinkan Notifikasi
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={handleSendTestPush}>
                <Send className="h-3.5 w-3.5 mr-1" />
                {testNotificationSent ? 'Terkirim!' : 'Tes Notifikasi'}
              </Button>
            )}
          </div>
        </div>

        {/* Notifikasi Inline Pengganti Alert */}
        {pushMessage && (
          <div
            className={`p-3 text-xs rounded-xl font-medium flex items-start gap-2 transition-all ${pushMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
          >
            {pushMessage.type === 'success' ? (
              <Check className="h-4 w-4 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            )}
            <p className="leading-relaxed">{pushMessage.text}</p>
          </div>
        )}
      </Card>

      {/* 3. Manajemen Data & Backup */}
      <Card className="space-y-3">
        <h2 className="text-sm font-bold text-slate-800">Cadangan Data Pengaturan</h2>
        <div className="flex flex-wrap gap-2.5 pt-1">
          <Button size="sm" variant="outline" onClick={handleExportBackup}>
            <Download className="h-4 w-4 mr-1 text-slate-600" />
            Cadangkan Data (JSON)
          </Button>
        </div>
      </Card>
    </div>
  );
}