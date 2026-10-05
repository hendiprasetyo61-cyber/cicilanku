'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Eye, Calculator, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { useCicilanStore } from '@/lib/store';
import { generateInstallmentSchedule } from '@/lib/calculations/installment';
import { formatRupiah } from '@/lib/formatters';
import { DebtorModal } from '@/components/debtors/DebtorModal';
import { SchedulePreviewModal } from '@/components/loans/SchedulePreviewModal';
import { GeneratedSchedule, InterestMethod, AdminAllocation } from '@/lib/types';

export default function NewLoanPage() {
  const router = useRouter();
  const { debtors, createLoan, isLoaded } = useCicilanStore();

  const [debtorId, setDebtorId] = useState<string>(debtors[0]?.id || '');
  const [namaBarang, setNamaBarang] = useState<string>('');
  const [orderIdShopee, setOrderIdShopee] = useState<string>('');
  const [hargaPokok, setHargaPokok] = useState<number | ''>(3000000);
  const [tenorBulan, setTenorBulan] = useState<number>(6);
  const [bungaPersenPerBulan, setBungaPersenPerBulan] = useState<number>(0);
  const [metodeBunga, setMetodeBunga] = useState<InterestMethod>('flat');
  const [biayaAdmin, setBiayaAdmin] = useState<number>(0);
  const [alokasiAdmin, setAlokasiAdmin] = useState<AdminAllocation>('pertama');
  const [tanggalMulai, setTanggalMulai] = useState<string>(new Date().toISOString().split('T')[0]);
  const [tanggalJatuhTempo, setTanggalJatuhTempo] = useState<number>(15);

  const [isDebtorModalOpen, setIsDebtorModalOpen] = useState(false);
  const [previewSchedule, setPreviewSchedule] = useState<GeneratedSchedule | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const calculateLiveSummary = (): GeneratedSchedule | null => {
    if (!hargaPokok || Number(hargaPokok) <= 0 || !tenorBulan || tenorBulan <= 0) {
      return null;
    }
    try {
      return generateInstallmentSchedule({
        hargaPokok: Number(hargaPokok),
        bungaPersenPerBulan: Number(bungaPersenPerBulan),
        metodeBunga,
        biayaAdmin: Number(biayaAdmin),
        alokasiAdmin,
        tenorBulan: Number(tenorBulan),
        tanggalMulai,
        tanggalJatuhTempo: Number(tanggalJatuhTempo),
      });
    } catch {
      return null;
    }
  };

  const liveSchedule = calculateLiveSummary();

  const handleOpenPreview = () => {
    const schedule = calculateLiveSummary();
    if (schedule) {
      setPreviewSchedule(schedule);
      setIsPreviewOpen(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!debtorId && debtors.length > 0) {
      newErrors.debtorId = 'Pilih teman yang meminjam limit';
    }
    if (!namaBarang.trim()) {
      newErrors.namaBarang = 'Nama barang wajib diisi';
    }
    if (!hargaPokok || Number(hargaPokok) < 10000) {
      newErrors.hargaPokok = 'Harga pokok minimal Rp 10.000';
    }
    if (!tenorBulan || tenorBulan <= 0) {
      newErrors.tenorBulan = 'Tenor minimal 1 bulan';
    }
    if (!tanggalJatuhTempo || tanggalJatuhTempo < 1 || tanggalJatuhTempo > 31) {
      newErrors.tanggalJatuhTempo = 'Tanggal jatuh tempo harus antara 1 sampai 31';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsLoading(true);
      const created = createLoan({
        debtorId: debtorId || debtors[0].id,
        namaBarang: namaBarang.trim(),
        orderIdShopee: orderIdShopee.trim() || undefined,
        hargaPokok: Number(hargaPokok),
        bungaPersenPerBulan: Number(bungaPersenPerBulan),
        metodeBunga,
        biayaAdmin: Number(biayaAdmin),
        alokasiAdmin,
        tenorBulan: Number(tenorBulan),
        tanggalMulai,
        tanggalJatuhTempo: Number(tanggalJatuhTempo),
      });

      setIsLoading(false);
      router.push(`/loans/${created.id}`);
    } catch (err: any) {
      setIsLoading(false);
      setErrors({ form: err?.message || 'Gagal menyimpan pinjaman' });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Back button & Title */}
      <div className="flex items-center gap-3">
        <Link
          href="/loans"
          className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 transition"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Tambah Pinjaman SPayLater</h1>
          <p className="text-xs text-slate-500">Catat transaksi Shopee PayLater baru yang barangnya dipakai teman.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {errors.form && (
          <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200 font-medium">
            {errors.form}
          </div>
        )}

        {/* 1. Data Teman */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">1. Data Teman Peminjam</h3>
            <button
              type="button"
              onClick={() => setIsDebtorModalOpen(true)}
              className="text-xs text-shopee-600 hover:text-shopee-700 font-bold flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              Teman Baru
            </button>
          </div>

          {debtors.length === 0 ? (
            <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/50 p-4 text-center">
              <p className="text-xs text-amber-800 font-medium">Belum ada data teman tersimpan.</p>
              <Button
                type="button"
                size="sm"
                className="mt-2"
                onClick={() => setIsDebtorModalOpen(true)}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Tambah Teman Sekarang
              </Button>
            </div>
          ) : (
            <Select
              label="Pilih Teman"
              value={debtorId || debtors[0]?.id || ''}
              onChange={(e) => {
                setDebtorId(e.target.value);
                setErrors((prev) => ({ ...prev, debtorId: '' }));
              }}
              error={errors.debtorId}
              required
            >
              {debtors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nama_teman} {d.no_hp ? `(${d.no_hp})` : ''}
                </option>
              ))}
            </Select>
          )}
        </Card>

        {/* 2. Informasi Barang & Order Shopee */}
        <Card className="space-y-4">
          <h3 className="text-sm font-bold text-slate-800">2. Rincian Barang & Pesanan</h3>

          <Input
            label="Nama Barang yang Dibeli"
            placeholder="Contoh: Samsung Galaxy A15 5G, Meja Kerja, dll"
            value={namaBarang}
            onChange={(e) => {
              setNamaBarang(e.target.value);
              setErrors((prev) => ({ ...prev, namaBarang: '' }));
            }}
            error={errors.namaBarang}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Order ID / No. Pesanan Shopee (Opsional)"
              placeholder="Contoh: 241005SPAYL99281"
              value={orderIdShopee}
              onChange={(e) => setOrderIdShopee(e.target.value)}
              helperText="Untuk mencocokkan riwayat di aplikasi Shopee."
            />

            <Input
              label="Harga Pokok Barang (Rp)"
              type="number"
              prefix="Rp"
              value={hargaPokok}
              onChange={(e) => {
                setHargaPokok(e.target.value === '' ? '' : Number(e.target.value));
                setErrors((prev) => ({ ...prev, hargaPokok: '' }));
              }}
              error={errors.hargaPokok}
              required
            />
          </div>
        </Card>

        {/* 3. Parameter Bunga & Tenor */}
        <Card className="space-y-4">
          <h3 className="text-sm font-bold text-slate-800">3. Tenor, Bunga, & Biaya Admin SPayLater</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Tenor Pinjaman"
              value={tenorBulan}
              onChange={(e) => setTenorBulan(Number(e.target.value))}
            >
              <option value={1}>1 Bulan</option>
              <option value={3}>3 Bulan</option>
              <option value={6}>6 Bulan (Umum)</option>
              <option value={12}>12 Bulan (1 Tahun)</option>
              <option value={18}>18 Bulan</option>
              <option value={24}>24 Bulan</option>
            </Select>

            <Input
              label="Bunga per Bulan (%)"
              type="number"
              step="0.01"
              suffix="%"
              placeholder="0 untuk Bunga 0%"
              value={bungaPersenPerBulan}
              onChange={(e) => setBungaPersenPerBulan(Number(e.target.value))}
              helperText="Shopee PayLater sering menawarkan promo Bunga 0% atau ~2.95%."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Metode Perhitungan Bunga"
              value={metodeBunga}
              onChange={(e) => setMetodeBunga(e.target.value as InterestMethod)}
            >
              <option value="flat">Bunga Flat (Bunga tetap dari harga awal)</option>
              <option value="efektif">Bunga Efektif / Anuitas (Cicilan rata standar)</option>
            </Select>

            <Input
              label="Biaya Penanganan / Admin (Rp)"
              type="number"
              prefix="Rp"
              value={biayaAdmin}
              onChange={(e) => setBiayaAdmin(Number(e.target.value))}
              helperText="Biaya administrasi SPayLater (biasanya 1% atau gratis)."
            />
          </div>

          {biayaAdmin > 0 && (
            <Select
              label="Alokasi Biaya Admin"
              value={alokasiAdmin}
              onChange={(e) => setAlokasiAdmin(e.target.value as AdminAllocation)}
            >
              <option value="pertama">Tambahkan Seluruhnya di Cicilan ke-1</option>
              <option value="rata">Bagi Rata ke Semua Bulan Tenor</option>
            </Select>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <Input
              label="Tanggal Mulai Transaksi"
              type="date"
              value={tanggalMulai}
              onChange={(e) => setTanggalMulai(e.target.value)}
              required
            />

            <Input
              label="Tanggal Jatuh Tempo Bulanan (1-31)"
              type="number"
              min={1}
              max={31}
              value={tanggalJatuhTempo}
              onChange={(e) => {
                setTanggalJatuhTempo(Number(e.target.value));
                setErrors((prev) => ({ ...prev, tanggalJatuhTempo: '' }));
              }}
              error={errors.tanggalJatuhTempo}
              helperText="Shopee PayLater biasanya tgl 5, 15, atau 25 tiap bulan."
              required
            />
          </div>
        </Card>

        {/* Live Simulation Card */}
        {liveSchedule && (
          <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-5 text-white shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                <Calculator className="h-4 w-4" />
                Simulasi Tagihan Terkalkulasi
              </span>
              <button
                type="button"
                onClick={handleOpenPreview}
                className="text-xs font-bold text-white bg-white/10 hover:bg-white/20 rounded-lg px-2.5 py-1 transition flex items-center gap-1"
              >
                <Eye className="h-3.5 w-3.5" />
                Lihat Semua Jadwal
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs mb-3">
              <div>
                <span className="text-slate-400 block">Total Pokok:</span>
                <span className="font-bold text-sm text-slate-100">{formatRupiah(liveSchedule.totalPokok)}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Total Bunga ({bungaPersenPerBulan}%):</span>
                <span className="font-bold text-sm text-amber-400">{formatRupiah(liveSchedule.totalBunga)}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Cicilan / Bulan:</span>
                <span className="font-extrabold text-sm text-shopee-400">
                  {formatRupiah(liveSchedule.installments[0]?.total_tagihan)}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-700/60 flex justify-between items-center text-xs">
              <span className="text-slate-300">Total Keseluruhan yang Harus Dilunasi Teman:</span>
              <span className="text-base font-extrabold text-emerald-400">{formatRupiah(liveSchedule.totalTagihan)}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3">
          <Link href="/loans">
            <Button type="button" variant="outline">
              Batal
            </Button>
          </Link>
          <Button
            type="button"
            variant="secondary"
            onClick={handleOpenPreview}
            disabled={!liveSchedule}
          >
            <Eye className="h-4 w-4 mr-1.5" />
            Pratinjau Jadwal
          </Button>
          <Button type="submit" isLoading={isLoading} disabled={debtors.length === 0}>
            <CheckCircle2 className="h-4 w-4 mr-1.5" />
            Simpan & Buat Jadwal Cicilan
          </Button>
        </div>
      </form>

      {/* Modals */}
      <DebtorModal
        isOpen={isDebtorModalOpen}
        onClose={() => setIsDebtorModalOpen(false)}
        onSuccess={(savedDebtor) => {
          setDebtorId(savedDebtor.id);
        }}
      />

      <SchedulePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        schedule={previewSchedule}
        namaBarang={namaBarang}
      />
    </div>
  );
}
