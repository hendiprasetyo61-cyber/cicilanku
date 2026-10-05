'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Debtor } from '@/lib/types';
import { saveDebtor, updateDebtor } from '@/lib/store';

export interface DebtorModalProps {
  isOpen: boolean;
  onClose: () => void;
  debtorToEdit?: Debtor | null;
  onSuccess?: (savedDebtor: Debtor) => void;
}

export const DebtorModal: React.FC<DebtorModalProps> = ({
  isOpen,
  onClose,
  debtorToEdit,
  onSuccess,
}) => {
  const [namaTeman, setNamaTeman] = useState('');
  const [noHp, setNoHp] = useState('');
  const [catatan, setCatatan] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (debtorToEdit) {
      setNamaTeman(debtorToEdit.nama_teman);
      setNoHp(debtorToEdit.no_hp || '');
      setCatatan(debtorToEdit.catatan || '');
    } else {
      setNamaTeman('');
      setNoHp('');
      setCatatan('');
    }
    setError('');
  }, [debtorToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaTeman.trim()) {
      setError('Nama teman wajib diisi');
      return;
    }

    try {
      setIsLoading(true);
      if (debtorToEdit) {
        updateDebtor(debtorToEdit.id, {
          nama_teman: namaTeman.trim(),
          no_hp: noHp.trim() || null,
          catatan: catatan.trim() || null,
        });
        setIsLoading(false);
        onClose();
        if (onSuccess) onSuccess({ ...debtorToEdit, nama_teman: namaTeman });
      } else {
        const created = saveDebtor({
          user_id: 'user-demo-01',
          nama_teman: namaTeman.trim(),
          no_hp: noHp.trim() || null,
          catatan: catatan.trim() || null,
        });
        setIsLoading(false);
        onClose();
        if (onSuccess) onSuccess(created);
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || 'Gagal menyimpan data teman');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={debtorToEdit ? 'Edit Data Teman' : 'Tambah Teman Baru'}
      description="Kelola teman yang meminjam atau memakai limit PayLater kamu."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nama Lengkap / Panggilan Teman"
          placeholder="Contoh: Budi Santoso"
          value={namaTeman}
          onChange={(e) => {
            setNamaTeman(e.target.value);
            setError('');
          }}
          error={error}
          required
        />

        <Input
          label="Nomor WhatsApp / HP (Opsional)"
          placeholder="081234567890"
          value={noHp}
          onChange={(e) => setNoHp(e.target.value)}
          helperText="Dibutuhkan jika ingin mengirim link rincian tagihan via WhatsApp."
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">Catatan Teman (Opsional)</label>
          <textarea
            rows={3}
            placeholder="Misal: Teman kantor lantai 3, suka bayar pas tanggal 25 gajian."
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-shopee-500 focus:outline-none focus:ring-2 focus:ring-shopee-500/20"
          />
        </div>

        <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Batal
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {debtorToEdit ? 'Simpan Perubahan' : 'Tambahkan Teman'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
