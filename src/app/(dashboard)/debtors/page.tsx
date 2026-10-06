'use client';

import React, { useState } from 'react';
import { Plus, Users, Phone, MessageSquare, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useCicilanStore } from '@/lib/store';
import { DebtorModal } from '@/components/debtors/DebtorModal';
import { calculateLoanBalance } from '@/lib/calculations/balance';
import { formatRupiah } from '@/lib/formatters';
import { Debtor } from '@/lib/types';

export default function DebtorsPage() {
  const { debtors, loans, deleteDebtor, isLoaded, refreshData } = useCicilanStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [debtorToEdit, setDebtorToEdit] = useState<Debtor | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [debtorToDelete, setDebtorToDelete] = useState<Debtor | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isLoaded) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-shopee-500" />
      </div>
    );
  }

  const handleEdit = (debtor: Debtor) => {
    setDebtorToEdit(debtor);
    setIsModalOpen(true);
  };

  const handleCreateNew = () => {
    setDebtorToEdit(null);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (debtor: Debtor) => {
    setDebtorToDelete(debtor);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!debtorToDelete) return;
    try {
      setIsDeleting(true);
      await deleteDebtor(debtorToDelete.id);
      setIsDeleteModalOpen(false);
      setDebtorToDelete(null);
      refreshData();
    } catch (error) {
      console.error('Gagal menghapus data:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const hasLoans = debtorToDelete ? loans.some((l) => l.debtor_id === debtorToDelete.id) : false;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Kelola Teman Peminjam</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar teman yang memakai limit Shopee PayLater kamu beserta ringkasan sisa kewajiban masing-masing.
          </p>
        </div>
        <Button size="sm" onClick={handleCreateNew}>
          <Plus className="h-4 w-4 mr-1" />
          Tambah Teman Baru
        </Button>
      </div>

      {debtors.length === 0 ? (
        <Card className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-slate-300 mb-2" />
          <h3 className="text-sm font-bold text-slate-700">Belum ada data teman</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Tambahkan teman yang ingin kamu bantu agar pencatatan cicilan lebih rapi dan jelas.
          </p>
          <Button size="sm" className="mt-4" onClick={handleCreateNew}>
            <Plus className="h-4 w-4 mr-1" />
            Tambah Teman
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {debtors.map((debtor) => {
            const debtorLoans = loans.filter((l) => l.debtor_id === debtor.id);
            let totalUtang = 0;
            let totalSetor = 0;

            debtorLoans.forEach((l) => {
              const summary = calculateLoanBalance(l, l.installments || [], l.debtor_payments || []);
              totalUtang += summary.totalTagihanLoan;
              totalSetor += summary.totalSetorTeman;
            });

            const sisaKewajiban = Math.max(0, totalUtang - totalSetor);
            const cleanPhone = debtor.no_hp ? debtor.no_hp.replace(/[^0-9]/g, '') : '';
            const waNumber = cleanPhone.startsWith('0') ? `62${cleanPhone.slice(1)}` : cleanPhone;

            // Logika untuk menyusun teks pesan WhatsApp
            const activeLoans = debtorLoans.filter((l) => l.status === 'aktif');
            const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

            let waText = `Halo *${debtor.nama_teman}*, ini rincian tagihan SPayLater kamu ya.\n\n*Total Sisa Utang: ${formatRupiah(sisaKewajiban)}*\n\n`;

            if (activeLoans.length > 0) {
              waText += `Klik link di bawah ini untuk melihat detail jadwal & riwayat pembayaran:\n`;
              activeLoans.forEach((l) => {
                waText += `- ${l.nama_barang}: ${baseUrl}/share/${l.share_token}\n`;
              });
            } else {
              waText += `Semua pinjaman saat ini sudah lunas. Terima kasih!\n`;
            }

            const waHref = `https://wa.me/${waNumber}?text=${encodeURIComponent(waText)}`;

            return (
              <Card key={debtor.id} hoverable className="flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{debtor.nama_teman}</h3>
                      {debtor.no_hp && (
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone className="h-3 w-3 text-slate-400" />
                          {debtor.no_hp}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(debtor)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                        title="Edit data teman"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(debtor)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                        title="Hapus data teman"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {debtor.catatan && (
                    <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      "{debtor.catatan}"
                    </p>
                  )}

                  <div className="mt-3.5 grid grid-cols-2 gap-2 text-xs bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/60">
                    <div>
                      <span className="text-slate-500 block">Pinjaman Terdaftar:</span>
                      <span className="font-bold text-slate-800">{debtorLoans.length} Transaksi</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Sisa Utang:</span>
                      <span className={`font-extrabold ${sisaKewajiban > 0 ? 'text-shopee-600' : 'text-emerald-600'}`}>
                        {formatRupiah(sisaKewajiban)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  {cleanPhone ? (
                    <a
                      href={waHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Kirim Rincian WA
                    </a>
                  ) : (
                    <span className="text-slate-400">Tidak ada nomor HP</span>
                  )}

                  <span className="font-semibold text-slate-500">
                    {activeLoans.length} aktif
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <DebtorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        debtorToEdit={debtorToEdit}
        onSuccess={() => {
          refreshData();
        }}
      />

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => !isDeleting && setIsDeleteModalOpen(false)}
        title={hasLoans ? 'Tidak Dapat Menghapus' : 'Konfirmasi Hapus'}
        description=""
      >
        <div className="space-y-4">
          {hasLoans ? (
            <>
              <div className="flex items-center gap-3 rounded-xl bg-orange-50 p-3.5 border border-orange-200/60 text-orange-800 text-sm">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <p>
                  Data <strong>{debtorToDelete?.nama_teman}</strong> tidak bisa dihapus karena masih memiliki riwayat pinjaman terdaftar di sistem.
                </p>
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={() => setIsDeleteModalOpen(false)}>Saya Mengerti</Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-600">
                Apakah kamu yakin ingin menghapus data <strong>{debtorToDelete?.nama_teman}</strong>? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={isDeleting}
                >
                  Batal
                </Button>
                <Button
                  className="bg-rose-600 hover:bg-rose-700 text-white"
                  onClick={confirmDelete}
                  isLoading={isDeleting}
                >
                  Ya, Hapus
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}