'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { PaylaterLoan } from '@/lib/types';
import { formatRupiah } from '@/lib/formatters';
import { useCicilanStore } from '@/lib/store';
// Kita mengimpor client Supabase untuk melakukan fungsi Update/Edit langsung
import { createClient } from '@/lib/supabase/client';

export interface DebtorPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  loans: PaylaterLoan[];
  defaultLoanId?: string;
  onSuccess?: () => void;
  // 1. Menambahkan properti paymentToEdit agar modal bisa menerima data dari luar
  paymentToEdit?: any;
}

export const DebtorPaymentModal: React.FC<DebtorPaymentModalProps> = ({
  isOpen,
  onClose,
  loans,
  defaultLoanId,
  onSuccess,
  paymentToEdit,
}) => {
  const { recordDebtorPayment } = useCicilanStore();

  const activeLoans = loans.filter((l) => l.status === 'aktif' || l.id === defaultLoanId);
  const selectedLoanIdInitial = defaultLoanId || (activeLoans[0]?.id ?? '');

  const [selectedLoanId, setSelectedLoanId] = useState<string>(selectedLoanIdInitial);
  const [jumlah, setJumlah] = useState<number | ''>('');
  const [tanggalTerima, setTanggalTerima] = useState<string>(new Date().toISOString().split('T')[0]);
  const [metode, setMetode] = useState<'transfer' | 'tunai'>('transfer');
  const [catatan, setCatatan] = useState<string>('');
  const [buktiUrl, setBuktiUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // 2. Mengisi form otomatis jika sedang dalam mode Edit
  useEffect(() => {
    if (paymentToEdit && isOpen) {
      setSelectedLoanId(paymentToEdit.loanId);
      setJumlah(paymentToEdit.jumlah);
      setTanggalTerima(paymentToEdit.tanggalTerima);
      setMetode(paymentToEdit.metode);
      setCatatan(paymentToEdit.catatan || '');
      setBuktiUrl(paymentToEdit.buktiUrl || '');
    } else if (!paymentToEdit && isOpen) {
      // Jika Tambah Baru, pastikan form kosong
      setSelectedLoanId(selectedLoanIdInitial);
      setJumlah('');
      setTanggalTerima(new Date().toISOString().split('T')[0]);
      setMetode('transfer');
      setCatatan('');
      setBuktiUrl('');
      setError('');
    }
  }, [paymentToEdit, isOpen, selectedLoanIdInitial]);

  const currentLoan = loans.find((l) => l.id === (selectedLoanId || selectedLoanIdInitial));

  // 3. Menghitung sisa utang yang akurat saat Edit
  const totalSetorTeman = (currentLoan?.debtor_payments || []).reduce((acc, p) => acc + p.jumlah, 0);

  // Jika sedang edit, jumlah lama tidak boleh ikut mengurangi sisa utang agar perhitungannya logis
  const setorTemanDisesuaikan = paymentToEdit
    ? totalSetorTeman - paymentToEdit.jumlah
    : totalSetorTeman;

  const sisaUtangTeman = currentLoan ? Math.max(0, currentLoan.total_tagihan - setorTemanDisesuaikan) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoanId && !currentLoan?.id) {
      setError('Pilih pinjaman yang dicicil');
      return;
    }
    if (!jumlah || Number(jumlah) <= 0) {
      setError('Nominal setoran harus lebih besar dari Rp 0');
      return;
    }

    try {
      setIsLoading(true);

      if (paymentToEdit) {
        // --- MODE EDIT: Memperbarui data langsung ke Supabase ---
        const supabase = createClient();
        const { error: updateError } = await supabase
          .from('debtor_payments')
          .update({
            loan_id: selectedLoanId || currentLoan!.id,
            jumlah: Math.round(Number(jumlah)),
            tanggal_terima: tanggalTerima,
            metode,
            catatan,
            bukti_url: buktiUrl,
          })
          .eq('id', paymentToEdit.id);

        if (updateError) throw updateError;
      } else {
        // --- MODE TAMBAH BARU: Menyimpan via Store ---
        await recordDebtorPayment({
          loanId: selectedLoanId || currentLoan!.id,
          jumlah: Math.round(Number(jumlah)),
          tanggalTerima,
          metode,
          catatan,
          buktiUrl,
        });
      }

      setIsLoading(false);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || 'Gagal menyimpan setoran');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      // Judul berubah otomatis menyesuaikan Mode
      title={paymentToEdit ? "Edit Setoran Teman" : "Catat Setoran dari Teman"}
      description="Teman mencicil dengan nominal bebas dan tanggal fleksibel."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Pilih Pinjaman */}
        <Select
          label="Pilih Pinjaman Teman"
          value={selectedLoanId || currentLoan?.id || ''}
          onChange={(e) => setSelectedLoanId(e.target.value)}
          required
        >
          {loans.map((l) => (
            <option key={l.id} value={l.id}>
              {l.debtor?.nama_teman || 'Teman'} — {l.nama_barang} ({formatRupiah(l.total_tagihan)})
            </option>
          ))}
        </Select>

        {currentLoan && (
          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/80">
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="text-slate-500 font-medium">Total Tagihan Pinjaman:</span>
              <span className="font-semibold text-slate-800">{formatRupiah(currentLoan.total_tagihan)}</span>
            </div>
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="text-slate-500 font-medium">Sudah Disetor Teman:</span>
              <span className="font-semibold text-emerald-600">{formatRupiah(setorTemanDisesuaikan)}</span>
            </div>
            <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200/60">
              <span className="text-slate-700 font-bold">Sisa Utang Teman:</span>
              <span className="font-extrabold text-shopee-600 text-sm">{formatRupiah(sisaUtangTeman)}</span>
            </div>
          </div>
        )}

        <Input
          label="Nominal Setoran Diterima (Rp)"
          type="number"
          placeholder="Contoh: 350000"
          prefix="Rp"
          value={jumlah}
          onChange={(e) => {
            setJumlah(e.target.value === '' ? '' : Number(e.target.value));
            setError('');
          }}
          error={error}
          helperText="Nominal tidak harus pas per cicilan, bebas sesuai yang dibayar teman."
          required
        />

        {sisaUtangTeman > 0 && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setJumlah(sisaUtangTeman)}
              className="text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg px-2.5 py-1.5 transition font-semibold"
            >
              Lunasi Semua ({formatRupiah(sisaUtangTeman)})
            </button>
            <button
              type="button"
              onClick={() => setJumlah(500000)}
              className="text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg px-2.5 py-1.5 transition"
            >
              Rp 500.000
            </button>
            <button
              type="button"
              onClick={() => setJumlah(1000000)}
              className="text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg px-2.5 py-1.5 transition"
            >
              Rp 1.000.000
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Tanggal Terima"
            type="date"
            value={tanggalTerima}
            onChange={(e) => setTanggalTerima(e.target.value)}
            required
          />

          <Select
            label="Metode Pembayaran"
            value={metode}
            onChange={(e) => setMetode(e.target.value as 'transfer' | 'tunai')}
          >
            <option value="transfer">Transfer Bank / E-Wallet</option>
            <option value="tunai">Tunai / Cash</option>
          </Select>
        </div>

        <Input
          label="Catatan (Opsional)"
          placeholder="Misal: Titip transfer lewat SeaBank pas gajian"
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
        />

        <Input
          label="Link URL Bukti Transfer (Opsional)"
          placeholder="https://drive.google.com/..."
          value={buktiUrl}
          onChange={(e) => setBuktiUrl(e.target.value)}
          helperText="Simpan tautan screenshot resi transfer bank jika ada."
        />

        <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Batal
          </Button>
          <Button type="submit" isLoading={isLoading} className="bg-emerald-600 hover:bg-emerald-700">
            {paymentToEdit ? 'Simpan Perubahan' : 'Simpan Setoran'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};