'use client';

// 1. Tambahkan useEffect pada import
import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Installment } from '@/lib/types';
import { formatRupiah, formatTanggalIndo } from '@/lib/formatters';
import { useCicilanStore } from '@/lib/store';

export interface ShopeePayModalProps {
  isOpen: boolean;
  onClose: () => void;
  installment: Installment | null;
  namaBarang?: string;
  onSuccess?: () => void;
}

export const ShopeePayModal: React.FC<ShopeePayModalProps> = ({
  isOpen,
  onClose,
  installment,
  namaBarang,
  onSuccess,
}) => {
  const { recordShopeePayment } = useCicilanStore();

  // 2. Gunakan fallback (0) agar tidak error saat installment masih null
  const sisaHarusDibayar = installment
    ? Math.max(0, installment.total_tagihan - installment.sudah_dibayar)
    : 0;

  // 3. SEMUA HOOKS HARUS BERADA DI ATAS (sebelum ada if / return)
  const [jumlah, setJumlah] = useState<number>(sisaHarusDibayar);
  const [tanggalBayar, setTanggalBayar] = useState<string>(new Date().toISOString().split('T')[0]);
  const [catatan, setCatatan] = useState<string>('Bayar Shopee PayLater');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // 4. Gunakan useEffect untuk mereset form setiap kali modal dibuka dengan data cicilan baru
  useEffect(() => {
    if (isOpen && installment) {
      setJumlah(Math.max(0, installment.total_tagihan - installment.sudah_dibayar));
      setTanggalBayar(new Date().toISOString().split('T')[0]);
      setCatatan('Bayar Shopee PayLater');
      setError('');
    }
  }, [isOpen, installment]);

  // 5. EARLY RETURN DILETAKKAN SETELAH SEMUA HOOKS
  if (!isOpen || !installment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jumlah || jumlah <= 0) {
      setError('Nominal pembayaran harus lebih besar dari Rp 0');
      return;
    }
    if (jumlah > sisaHarusDibayar) {
      setError(`Maksimal pembayaran untuk cicilan ini adalah ${formatRupiah(sisaHarusDibayar)}`);
      return;
    }

    try {
      setIsLoading(true);
      await recordShopeePayment({
        installmentId: installment.id!,
        jumlah: Math.round(jumlah),
        tanggalBayar,
        catatan,
      });

      setIsLoading(false);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || 'Gagal menyimpan pembayaran');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Catat Pembayaran ke Shopee"
      // Perbaikan penulisan string agar aman dan tidak error
      description={`Cicilan ke-${installment.cicilan_ke} — ${namaBarang || 'Barang'}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-xl bg-orange-50/70 p-3.5 border border-orange-200/60">
          <div className="flex justify-between items-center text-xs text-orange-950 mb-1">
            <span className="text-slate-600 font-medium">Jatuh Tempo:</span>
            <span className="font-bold">{formatTanggalIndo(installment.jatuh_tempo)}</span>
          </div>
          <div className="flex justify-between items-center text-xs text-orange-950 mb-1">
            <span className="text-slate-600 font-medium">Total Tagihan Cicilan:</span>
            <span className="font-bold">{formatRupiah(installment.total_tagihan)}</span>
          </div>
          <div className="flex justify-between items-center text-xs text-orange-950">
            <span className="text-slate-600 font-medium">Sisa Belum Dibayar:</span>
            <span className="font-extrabold text-shopee-600 text-sm">{formatRupiah(sisaHarusDibayar)}</span>
          </div>
        </div>

        <Input
          label="Jumlah Dibayar ke Shopee (Rp)"
          type="number"
          prefix="Rp"
          value={jumlah}
          onChange={(e) => {
            setJumlah(Number(e.target.value));
            setError('');
          }}
          error={error}
          helperText="Bisa dibayar lunas penuh atau dicicil sebagian."
          required
        />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setJumlah(sisaHarusDibayar)}
            className="text-xs text-shopee-600 font-semibold bg-shopee-50 hover:bg-shopee-100 rounded-lg px-2.5 py-1.5 transition"
          >
            Bayar Penuh ({formatRupiah(sisaHarusDibayar)})
          </button>
          {sisaHarusDibayar > 100000 && (
            <button
              type="button"
              onClick={() => setJumlah(Math.round(sisaHarusDibayar / 2))}
              className="text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg px-2.5 py-1.5 transition"
            >
              Setengah ({formatRupiah(Math.round(sisaHarusDibayar / 2))})
            </button>
          )}
        </div>

        <Input
          label="Tanggal Pembayaran"
          type="date"
          value={tanggalBayar}
          onChange={(e) => setTanggalBayar(e.target.value)}
          required
        />

        <Input
          label="Catatan Pembayaran (Opsional)"
          placeholder="Misal: Bayar via BCA Virtual Account"
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
        />

        <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Batal
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Simpan Pembayaran
          </Button>
        </div>
      </form>
    </Modal>
  );
};