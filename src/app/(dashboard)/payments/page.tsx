'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, ArrowDownRight, Trash2, Search, ExternalLink, Calendar, Filter, Edit2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useCicilanStore } from '@/lib/store';
import { DebtorPaymentModal } from '@/components/payments/DebtorPaymentModal';
import { formatRupiah, formatTanggalIndo } from '@/lib/formatters';

export default function PaymentsPage() {
  const { loans, deleteDebtorPayment, isLoaded, refreshData } = useCicilanStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMetode, setFilterMetode] = useState<'semua' | 'transfer' | 'tunai'>('semua');

  // State untuk Modal Edit
  const [paymentToEdit, setPaymentToEdit] = useState<any>(null);

  // State untuk Modal Konfirmasi Hapus
  const [paymentToDelete, setPaymentToDelete] = useState<{
    id: string;
    loanId: string;
    jumlah: number;
    namaTeman: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isLoaded) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-shopee-500" />
      </div>
    );
  }

  // Kumpulkan semua pembayaran teman dari semua pinjaman
  const allPayments: Array<{
    id: string;
    loanId: string;
    namaBarang: string;
    namaTeman: string;
    tanggalTerima: string;
    jumlah: number;
    metode: 'transfer' | 'tunai';
    catatan?: string | null;
    buktiUrl?: string | null;
  }> = [];

  loans.forEach((loan) => {
    (loan.debtor_payments || []).forEach((dp) => {
      allPayments.push({
        id: dp.id,
        loanId: loan.id,
        namaBarang: loan.nama_barang,
        namaTeman: loan.debtor?.nama_teman || 'Teman',
        tanggalTerima: dp.tanggal_terima,
        jumlah: dp.jumlah,
        metode: dp.metode,
        catatan: dp.catatan,
        buktiUrl: dp.bukti_url,
      });
    });
  });

  // Urutkan dari tanggal terbaru
  allPayments.sort((a, b) => new Date(b.tanggalTerima).getTime() - new Date(a.tanggalTerima).getTime());

  // Filter pencarian dan metode
  const filteredPayments = allPayments.filter((p) => {
    const matchesMetode = filterMetode === 'semua' || p.metode === filterMetode;
    const matchesSearch =
      p.namaTeman.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.namaBarang.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.catatan || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesMetode && matchesSearch;
  });

  const totalFilteredJumlah = filteredPayments.reduce((acc, p) => acc + p.jumlah, 0);

  // Fungsi untuk membuka modal Edit
  const handleEditClick = (payment: any) => {
    setPaymentToEdit(payment);
    setIsModalOpen(true);
  };

  // Fungsi untuk membuka modal Tambah Baru
  const handleCreateNewClick = () => {
    setPaymentToEdit(null);
    setIsModalOpen(true);
  };

  // Fungsi Eksekusi Hapus Setoran
  const confirmDelete = async () => {
    if (!paymentToDelete) return;
    try {
      setIsDeleting(true);
      await deleteDebtorPayment(paymentToDelete.loanId, paymentToDelete.id);
      setPaymentToDelete(null);
      refreshData();
    } catch (error) {
      console.error('Gagal menghapus setoran:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Riwayat Setoran Masuk Teman</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Semua pembayaran uang yang telah disetor teman dengan nominal dan jadwal fleksibel.
          </p>
        </div>
        {/* Tombol Catat Setoran Baru */}
        <Button size="sm" onClick={handleCreateNewClick} className="bg-emerald-600 hover:bg-emerald-700">
          <ArrowDownRight className="h-4 w-4 mr-1" />
          Catat Setoran Baru
        </Button>
      </div>

      {/* Summary Total Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-l-4 border-l-emerald-500 p-4">
          <span className="text-xs font-semibold text-slate-500 block uppercase">Total Setoran Terkumpul</span>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">
            {formatRupiah(totalFilteredJumlah)}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Dari {filteredPayments.length} transaksi pembayaran teman</span>
        </Card>

        <Card className="border-l-4 border-l-indigo-500 p-4 flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 block uppercase">Setoran Fleksibel</span>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            Teman tidak harus membayar sesuai jadwal tagihan Shopee. Kapan pun teman mentransfer atau memberi tunai, cukup catat di sini.
          </p>
        </Card>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama teman, barang, atau catatan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-xs text-slate-900 focus:border-shopee-500 focus:outline-none focus:ring-2 focus:ring-shopee-500/20"
          />
        </div>

        <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200/80 shrink-0">
          {(['semua', 'transfer', 'tunai'] as const).map((metode) => (
            <button
              key={metode}
              onClick={() => setFilterMetode(metode)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${filterMetode === metode
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              {metode}
            </button>
          ))}
        </div>
      </div>

      {/* Payment List */}
      {filteredPayments.length === 0 ? (
        <Card className="text-center py-12">
          <ArrowDownRight className="mx-auto h-12 w-12 text-slate-300 mb-2" />
          <h3 className="text-sm font-bold text-slate-700">Belum ada riwayat setoran</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `Tidak ditemukan setoran dengan filter "${searchQuery}".`
              : 'Klik tombol di atas untuk mencatat setoran pertama dari temanmu.'}
          </p>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filteredPayments.map((p) => (
              <div
                key={p.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-extrabold text-slate-900">{formatRupiah(p.jumlah)}</span>
                    <Badge status={p.metode} />
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    <span className="font-semibold text-slate-800">
                      {p.namaTeman}
                    </span>
                    <span>•</span>
                    <Link
                      href={`/loans/${p.loanId}`}
                      className="text-shopee-600 hover:underline font-medium"
                    >
                      {p.namaBarang}
                    </Link>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-500">
                      <Calendar className="h-3 w-3" />
                      {formatTanggalIndo(p.tanggalTerima)}
                    </span>
                  </div>

                  {p.catatan && (
                    <p className="text-xs text-slate-600 mt-1.5 italic bg-slate-50 px-2 py-1 rounded inline-block">
                      "{p.catatan}"
                    </p>
                  )}
                </div>

                {/* PERBAIKAN: Mengubah justify-between menjadi justify-end pada layar HP agar tombol merapat ke kanan */}
                <div className="flex items-center gap-2 justify-end sm:shrink-0 pt-2 border-t border-slate-100 sm:pt-0 sm:border-0">
                  {p.buktiUrl && (
                    <a
                      href={p.buktiUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-indigo-600 font-semibold hover:bg-indigo-50 flex items-center gap-1 mr-auto sm:mr-0"
                    >
                      Bukti <ExternalLink className="h-3 w-3" />
                    </a>
                  )}

                  {/* Tombol Edit Baru */}
                  <button
                    onClick={() => handleEditClick(p)}
                    className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition"
                    title="Edit setoran ini"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => setPaymentToDelete({
                      id: p.id,
                      loanId: p.loanId,
                      jumlah: p.jumlah,
                      namaTeman: p.namaTeman
                    })}
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                    title="Hapus setoran ini"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Modal Catat & Edit Setoran */}
      <DebtorPaymentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setPaymentToEdit(null);
        }}
        loans={loans}
        paymentToEdit={paymentToEdit} // Mengirim data yang ingin di-edit ke dalam Modal
        onSuccess={() => refreshData()}
      />

      {/* Modal Konfirmasi Hapus */}
      <Modal
        isOpen={!!paymentToDelete}
        onClose={() => !isDeleting && setPaymentToDelete(null)}
        title="Hapus Riwayat Setoran"
        description=""
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Apakah kamu yakin ingin menghapus data setoran sebesar <strong>{paymentToDelete ? formatRupiah(paymentToDelete.jumlah) : ''}</strong> dari <strong>{paymentToDelete?.namaTeman}</strong>?
            <br /><br />
            Saldo "Total Setoran Terkumpul" akan otomatis dihitung ulang.
          </p>
          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={() => setPaymentToDelete(null)}
              disabled={isDeleting}
            >
              Batal
            </Button>
            <Button
              className="bg-rose-600 hover:bg-rose-700 text-white"
              onClick={confirmDelete}
              isLoading={isDeleting}
            >
              Ya, Hapus Setoran
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}