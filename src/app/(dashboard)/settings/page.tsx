'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  Clock,
  Smartphone,
  Download,
  Check,
  AlertCircle,
  Send,
  UploadCloud,
  DatabaseBackup
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useCicilanStore } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';

type PushStatus = NotificationPermission | 'unsupported';
type ReminderToggleKey = 'remind_h3' | 'remind_h1' | 'remind_h0';

// Fungsi untuk mengecek dukungan browser terhadap notifikasi PWA
function isNotificationSupported() {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator
  );
}

// PERBAIKAN UTAMA: Android Chrome TIDAK mengizinkan `new Notification()`.
// Notifikasi PWA wajib dipanggil melalui Service Worker.
async function showLocalNotification(title: string, options: NotificationOptions) {
  const existing = await navigator.serviceWorker.getRegistration();
  if (!existing) {
    await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  }
  const registration = await navigator.serviceWorker.ready;
  await registration.showNotification(title, options);
}

export default function SettingsPage() {
  const { settings, updateSettings, isLoaded, debtors, loans } = useCicilanStore();

  const [pushStatus, setPushStatus] = useState<PushStatus>('default');
  const [testNotificationSent, setTestNotificationSent] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [pushMessage, setPushMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [isRestoring, setIsRestoring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isNotificationSupported()) {
      setPushStatus('unsupported');
    } else {
      setPushStatus(Notification.permission);
    }
  }, []);

  if (!isLoaded) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-shopee-500" />
      </div>
    );
  }

  const flashSaved = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleRequestPushPermission = async () => {
    setPushMessage(null);

    if (!isNotificationSupported()) {
      setPushMessage({
        type: 'error',
        text: 'Browser ini tidak mendukung notifikasi. Gunakan Chrome, atau di iPhone pasang dulu aplikasinya ke Layar Utama.',
      });
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPushStatus(permission);

      if (permission === 'granted') {
        // Menggunakan showLocalNotification alih-alih new Notification()
        await showLocalNotification('CicilanKu Aktif!', {
          body: 'Kamu akan menerima notifikasi pengingat jatuh tempo Shopee PayLater tepat waktu.',
          icon: '/icon-192.png',
          badge: '/icon-192.png',
        });
        setPushMessage({ type: 'success', text: 'Notifikasi berhasil diaktifkan!' });
      } else if (permission === 'denied') {
        setPushMessage({
          type: 'error',
          text: 'Izin ditolak. Aktifkan lewat pengaturan situs di browser kamu.',
        });
      } else {
        setPushMessage({ type: 'error', text: 'Izin belum diberikan. Coba tekan tombolnya lagi.' });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Terjadi kesalahan tidak dikenal';
      console.error('Gagal mengaktifkan notifikasi:', e);
      setPushMessage({ type: 'error', text: `Gagal mengaktifkan notifikasi: ${msg}` });
    }

    setTimeout(() => setPushMessage(null), 5000);
  };

  const handleSendTestPush = async () => {
    setPushMessage(null);

    if (!isNotificationSupported() || Notification.permission !== 'granted') {
      await handleRequestPushPermission();
      return;
    }

    try {
      // Menggunakan showLocalNotification agar tidak error di Android Chrome
      await showLocalNotification('Pengingat Tagihan SPayLater (H-3)', {
        body: 'Cicilan Samsung Galaxy A15 sebesar Rp 500.000 jatuh tempo 3 hari lagi. Budi belum transfer.',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'tes-notifikasi',
      });
      setTestNotificationSent(true);
      setTimeout(() => setTestNotificationSent(false), 3000);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Terjadi kesalahan tidak dikenal';
      console.error('Gagal mengirim notifikasi tes:', e);
      setPushMessage({ type: 'error', text: `Gagal mengirim notifikasi tes: ${msg}` });
      setTimeout(() => setPushMessage(null), 5000);
    }
  };

  const handleToggle = async (key: ReminderToggleKey) => {
    try {
      await updateSettings({ [key]: !settings[key] } as Partial<typeof settings>);
      flashSaved();
    } catch (error) {
      console.error('Gagal menyimpan pengaturan:', error);
    }
  };

  const handleTimeChange = async (
    field: 'reminder_hour' | 'reminder_minute',
    raw: string,
    max: number
  ) => {
    const value = Math.min(max, Math.max(0, Math.floor(Number(raw) || 0)));
    try {
      await updateSettings({ [field]: value } as Partial<typeof settings>);
      flashSaved();
    } catch (error) {
      console.error('Gagal menyimpan waktu pengingat:', error);
    }
  };

  // Download Seluruh Database
  const handleExportFullBackup = () => {
    const backupData = {
      app: 'CicilanKu',
      export_date: new Date().toISOString(),
      user_id: settings.user_id,
      data: {
        settings: settings,
        debtors: debtors,
        loans: loans,
      }
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cicilanku_full_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setPushMessage({ type: 'success', text: 'Seluruh database berhasil diunduh.' });
    setTimeout(() => setPushMessage(null), 3000);
  };

  // Memulihkan Database (Restore)
  const handleRestoreDatabase = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!window.confirm('PERINGATAN: Memulihkan data akan menggabungkan data lama ini ke database Anda saat ini. Apakah Anda yakin ingin melanjutkan?')) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsRestoring(true);
    setPushMessage(null);

    try {
      const text = await file.text();
      const parsedData = JSON.parse(text);

      if (parsedData.app !== 'CicilanKu' || !parsedData.data) {
        throw new Error('File cadangan tidak valid atau rusak.');
      }

      const supabase = createClient();
      const backupDebtors = parsedData.data.debtors || [];
      const backupLoans = parsedData.data.loans || [];

      // 1. Pulihkan data Teman (Debtors) menggunakan upsert agar tidak ganda
      if (backupDebtors.length > 0) {
        const { error: errDebtor } = await supabase.from('debtors').upsert(
          backupDebtors.map((d: any) => ({
            id: d.id,
            user_id: settings.user_id,
            nama_teman: d.nama_teman,
            no_hp: d.no_hp,
            catatan: d.catatan
          }))
        );
        if (errDebtor) throw errDebtor;
      }

      // 2. Pulihkan data Pinjaman Induk
      if (backupLoans.length > 0) {
        const loansToInsert = backupLoans.map((l: any) => ({
          id: l.id,
          user_id: settings.user_id,
          debtor_id: l.debtor_id,
          nama_barang: l.nama_barang,
          harga_pokok: l.harga_pokok,
          bunga_persen: l.bunga_persen,
          metode_bunga: l.metode_bunga,
          biaya_admin: l.biaya_admin,
          alokasi_admin: l.alokasi_admin,
          tenor_bulan: l.tenor_bulan,
          tanggal_mulai: l.tanggal_mulai,
          tanggal_jatuh_tempo: l.tanggal_jatuh_tempo,
          status: l.status,
          share_token: l.share_token
        }));

        const { error: errLoan } = await supabase.from('loans').upsert(loansToInsert);
        if (errLoan) throw errLoan;

        // 3. Pulihkan Rincian Cicilan (Installments)
        for (const loan of backupLoans) {
          if (loan.installments && loan.installments.length > 0) {
            await supabase.from('loan_installments').upsert(
              loan.installments.map((inst: any) => ({
                id: inst.id,
                loan_id: loan.id,
                bulan_ke: inst.bulan_ke,
                tanggal_jatuh_tempo: inst.tanggal_jatuh_tempo,
                pokok: inst.pokok,
                bunga: inst.bunga,
                admin: inst.admin,
                total_tagihan: inst.total_tagihan,
                status: inst.status
              }))
            );
          }

          // 4. Pulihkan Riwayat Setoran Teman
          if (loan.debtor_payments && loan.debtor_payments.length > 0) {
            await supabase.from('debtor_payments').upsert(
              loan.debtor_payments.map((pay: any) => ({
                id: pay.id,
                loan_id: loan.id,
                jumlah: pay.jumlah,
                tanggal_bayar: pay.tanggal_bayar,
                metode: pay.metode,
                catatan: pay.catatan
              }))
            );
          }
        }
      }

      setPushMessage({ type: 'success', text: 'Database berhasil dipulihkan! Harap refresh (muat ulang) halaman ini.' });

    } catch (error: any) {
      console.error('Error saat restore:', error);
      setPushMessage({ type: 'error', text: `Gagal memulihkan data: ${error?.message || 'Format tidak dikenali'}` });
    } finally {
      setIsRestoring(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const statusLabel =
    pushStatus === 'granted'
      ? 'Aktif (Diizinkan)'
      : pushStatus === 'denied'
        ? 'Diblokir oleh Browser'
        : pushStatus === 'unsupported'
          ? 'Tidak Didukung'
          : 'Belum Diaktifkan';

  return (
    <div className="max-w-2xl mx-auto space-y-5">
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
              <span className="text-[11px] text-slate-500">Beri tahu 3 hari lebih awal agar sempat menagih.</span>
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
              <span className="text-[11px] text-slate-500">Peringatan sehari sebelumnya untuk ketersediaan dana.</span>
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
              <span className="text-[11px] text-slate-500">Peringatan prioritas tinggi di hari batas akhir pembayaran.</span>
            </div>
            <input
              type="checkbox"
              checked={settings.remind_h0}
              onChange={() => handleToggle('remind_h0')}
              className="h-4 w-4 accent-shopee-600 rounded cursor-pointer"
            />
          </label>
        </div>

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
              onChange={(e) => handleTimeChange('reminder_hour', e.target.value, 23)}
              className="w-14 p-1.5 rounded-lg border border-slate-200 text-center font-bold"
            />
            <span>:</span>
            <input
              type="number"
              min={0}
              max={59}
              value={settings.reminder_minute}
              onChange={(e) => handleTimeChange('reminder_minute', e.target.value, 59)}
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
                  : pushStatus === 'denied' || pushStatus === 'unsupported'
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-amber-100 text-amber-700'
                  }`}
              >
                {statusLabel}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {pushStatus === 'granted'
                ? 'Aplikasi dapat memunculkan popup notifikasi di Android dan Laptop/PC.'
                : pushStatus === 'unsupported'
                  ? 'Browser ini belum mendukung notifikasi. Gunakan Chrome, atau di iPhone pasang aplikasinya ke Layar Utama.'
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

      {/* 3. Manajemen Database Lengkap */}
      <Card className="space-y-4 border-shopee-200/50 bg-shopee-50/20">
        <div className="flex items-center gap-2 pb-2 border-b border-shopee-100">
          <DatabaseBackup className="h-4 w-4 text-shopee-600" />
          <h2 className="text-sm font-bold text-slate-800">Manajemen Database & Pencadangan</h2>
        </div>

        <p className="text-xs text-slate-500">
          Anda dapat mengunduh seluruh data (teman, riwayat pinjaman, cicilan, dan setoran) sebagai cadangan aman, atau memulihkan data dari file yang pernah diunduh.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportFullBackup}
            className="flex-1 bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Seluruh Database
          </Button>

          <div className="flex-1">
            <input
              type="file"
              accept=".json"
              className="hidden"
              ref={fileInputRef}
              onChange={handleRestoreDatabase}
            />
            <Button
              size="sm"
              className="w-full bg-slate-800 hover:bg-slate-900 text-white"
              onClick={() => fileInputRef.current?.click()}
              isLoading={isRestoring}
            >
              <UploadCloud className="h-4 w-4 mr-2" />
              Restore (Pulihkan) Data
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}