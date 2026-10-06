'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Share2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ArrowDownRight,
  CreditCard,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Modal } from '@/components/ui/Modal';
import { useCicilanStore } from '@/lib/store';
import { calculateLoanBalance } from '@/lib/calculations/balance';
import { formatRupiah, formatTanggalIndo } from '@/lib/formatters';
import { ShopeePayModal } from '@/components/loans/ShopeePayModal';
import { DebtorPaymentModal } from '@/components/payments/DebtorPaymentModal';
import { Installment } from '@/lib/types';

export default function LoanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const loanId = params.id as string;

  const { loans, deleteLoan, deleteDebtorPayment, isLoaded, refreshData } = useCicilanStore();

  const [activeTab, setActiveTab] = useState<'jadwal' | 'setoran'>('jadwal');
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
  const [isDebtorPaymentOpen, setIsDebtorPaymentOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const [isDeleteLoanModalOpen, setIsDeleteLoanModalOpen] = useState(false);
  const [isDeletingLoan, setIsDeletingLoan] = useState(false);

  const [paymentToDelete, setPaymentToDelete] = useState<{ id: string; jumlah: number } | null>(null);
  const [isDeletingPayment, setIsDeletingPayment] = useState(false);

  if (!isLoaded) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-shopee-500" />
      </div>
    );
  }

  const loan = loans.find((l) => l.id === loanId);

  if (!loan) {
    return (
      <Card className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-amber-500 mb-2" />
        <h3 className="text-base font-bold text-slate-800">Pinjaman tidak ditemukan</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">Mungkin transaksi ini telah dihapus.</p>
        <Link href="/loans">
          <Button size="sm">Kembali ke Daftar Pinjaman</Button>
        </Link>
      </Card>
    );
  }

  const summary = calculateLoanBalance(loan, loan.installments || [], loan.debtor_payments || []);
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/share/${loan.share_token}` : `/share/${loan.share_token}`;

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const confirmDeleteLoan = async () => {
    try {
      setIsDeletingLoan(true);
      await deleteLoan(loan.id);
      setIsDeleteLoanModalOpen(false);
      router.push('/loans');
    } catch (error) {
      console.error('Gagal menghapus pinjaman:', error);
    } finally {
      setIsDeletingLoan(false);
    }
  };

  const confirmDeletePayment = async () => {
    if (!paymentToDelete) return;
    try {
      setIsDeletingPayment(true);
      await deleteDebtorPayment(loan.id, paymentToDelete.id);
      setPaymentToDelete(null);
      refreshData();
    } catch (error) {
      console.error('Gagal menghapus setoran:', error);
    } finally {
      setIsDeletingPayment(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Actions - Diperbaiki menggunakan flex-wrap */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link
            href="/loans"
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 transition shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">{loan.nama_barang}</h1>
              <Badge status={loan.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Peminjam: <strong className="text-slate-800">{loan.debtor?.nama_teman || 'Teman'}</strong>
              {loan.order_id_shopee && ` • Order ID: ${loan.order_id_shopee}`}
            </p>
          </div>
        </div>

        {/* Buttons - flex-wrap agar tidak berjejal di HP */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopyShareLink}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-shopee-600 transition shadow-2xs"
          >
            {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            {copiedLink ? 'Tersalin!' : 'Bagikan Link'}
          </button>
          <Button
            size="sm"
            onClick={() => setIsDebtorPaymentOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 shadow-sm whitespace-nowrap"
          >
            <ArrowDownRight className="h-4 w-4 mr-1" />
            Setoran Teman
          </Button>
          <button
            onClick={() => setIsDeleteLoanModalOpen(true)}
            className="rounded-xl border border-rose-200 bg-rose-50 p-2 text-rose-600 hover:bg-rose-100 transition shrink-0"
            title="Hapus Pinjaman Ini"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Share Link Banner - Diperbaiki untuk Mobile dengan overflow-hidden dan truncate */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-indigo-50/70 p-3.5 border border-indigo-100 text-xs overflow-hidden">
        <div className="flex items-start sm:items-center gap-2 text-indigo-900 min-w-0 w-full">
          <Share2 className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5 sm:mt-0" />
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 min-w-0 w-full">
            <span className="shrink-0">Halaman ringkasan teman:</span>
            {/* Class truncate memastikan URL panjang terpotong menjadi "..." */}
            <strong className="underline underline-offset-2 font-mono truncate">{shareUrl}</strong>
          </div>
        </div>
        <div className="flex items-center justify-end shrink-0 self-end sm:self-auto">
          <Link
            href={`/share/${loan.share_token}`}
            target="_blank"
            className="font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 bg-indigo-100/50 hover:bg-indigo-200 px-3 py-1.5 rounded-lg transition"
          >
            Buka <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* 3 Metric Cards Finansial Pinjaman */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total & Sisa Utang Teman */}
        <Card hoverable className="border-l-4 border-l-shopee-500">
          <span className="text-xs font-semibold text-slate-500 block uppercase">Sisa Utang Teman</span>
          <div className="text-2xl font-extrabold text-shopee-600 mt-1">
            {formatRupiah(summary.sisaUtangTeman)}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Total tagihan: <strong>{formatRupiah(summary.totalTagihanLoan)}</strong>
          </div>
          <div className="mt-2.5">
            <Progress
              value={summary.persentaseSetorTeman}
              color="emerald"
              size="sm"
              sublabel={`Disetor: ${formatRupiah(summary.totalSetorTeman)} (${summary.persentaseSetorTeman}%)`}
            />
          </div>
        </Card>

        {/* Pembayaran ke Shopee */}
        <Card hoverable className="border-l-4 border-l-amber-500">
          <span className="text-xs font-semibold text-slate-500 block uppercase">Dibayar ke Shopee</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {formatRupiah(summary.totalDibayarKeShopee)}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Sisa tagihan Shopee: <strong>{formatRupiah(summary.sisaTagihanShopee)}</strong>
          </div>
          <div className="mt-2.5">
            <Progress
              value={summary.persentaseBayarShopee}
              color="shopee"
              size="sm"
              sublabel={`${summary.jumlahCicilanLunas} dari ${summary.totalCicilan} cicilan lunas`}
            />
          </div>
        </Card>

        {/* Posisi Kas / Status Talangan Pemilik */}
        <Card
          hoverable
          className={`border-l-4 ${summary.isNombok ? 'border-l-rose-500 bg-rose-50/20' : 'border-l-emerald-500 bg-emerald-50/20'
            }`}
        >
          <span className="text-xs font-semibold text-slate-500 block uppercase">Status Talangan Kamu</span>
          <div className={`text-2xl font-extrabold mt-1 ${summary.isNombok ? 'text-rose-600' : 'text-emerald-600'}`}>
            {summary.isNombok ? `- ${formatRupiah(summary.nominalNombok)}` : formatRupiah(summary.posisiKas)}
          </div>
          <div className="mt-2 text-xs">
            {summary.isNombok ? (
              <span className="font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full inline-block">
                Kamu Masih Nombok Uang Sendiri
              </span>
            ) : (
              <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full inline-block">
                Aman, Tidak Ada Talangan
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Posisi kas = Total Setoran Teman - Total Dibayar ke Shopee.
          </p>
        </Card>
      </div>

      {/* Tabs Menu: Jadwal Tagihan Shopee vs Riwayat Setoran Teman - Ditambahkan overflow-x-auto untuk responsifitas */}
      <div className="flex border-b border-slate-200 overflow-x-auto whitespace-nowrap scrollbar-hide">
        <button
          onClick={() => setActiveTab('jadwal')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors ${activeTab === 'jadwal'
            ? 'border-shopee-500 text-shopee-600'
            : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
        >
          Jadwal Cicilan Shopee ({loan.installments?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('setoran')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors ${activeTab === 'setoran'
            ? 'border-shopee-500 text-shopee-600'
            : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
        >
          Riwayat Setoran Teman ({loan.debtor_payments?.length || 0})
        </button>
      </div>

      {/* TAB 1: Jadwal Cicilan Shopee */}
      {activeTab === 'jadwal' && (
        <Card className="p-0 overflow-hidden">
          <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Jadwal Pembayaran Shopee PayLater</h3>
              <p className="text-xs text-slate-500">
                Setiap pembayaran ke Shopee akan otomatis memperbarui status cicilan dan saldo talangan kas.
              </p>
            </div>
            <span className="text-xs text-slate-600 font-semibold bg-white px-2.5 py-1 rounded-lg border border-slate-200 self-start md:self-auto shrink-0">
              Tenor {loan.tenor_bulan} Bulan • Bunga {loan.bunga_persen_per_bulan}% ({loan.metode_bunga})
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-100/70 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Bulan</th>
                  <th className="py-3 px-4">Jatuh Tempo</th>
                  <th className="py-3 px-4 text-right">Pokok</th>
                  <th className="py-3 px-4 text-right">Bunga</th>
                  <th className="py-3 px-4 text-right font-bold text-slate-900">Total Tagihan</th>
                  <th className="py-3 px-4 text-right">Sudah Dibayar</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(loan.installments || []).map((inst) => {
                  return (
                    <tr key={inst.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-bold text-slate-800">Ke-{inst.cicilan_ke}</td>
                      <td className="py-3 px-4 text-slate-600 font-medium">{formatTanggalIndo(inst.jatuh_tempo, true)}</td>
                      <td className="py-3 px-4 text-right text-slate-600">{formatRupiah(inst.pokok)}</td>
                      <td className="py-3 px-4 text-right text-amber-600 font-medium">{formatRupiah(inst.bunga)}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">{formatRupiah(inst.total_tagihan)}</td>
                      <td className="py-3 px-4 text-right text-emerald-600 font-semibold">
                        {formatRupiah(inst.sudah_dibayar)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge status={inst.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        {inst.status !== 'lunas' ? (
                          <Button
                            size="sm"
                            onClick={() => setSelectedInstallment(inst)}
                            className="shadow-2xs text-[11px] py-1 px-2.5"
                          >
                            Catat Bayar Shopee
                          </Button>
                        ) : (
                          <span className="text-[11px] font-bold text-emerald-600 flex items-center justify-end gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Lunas
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 2: Riwayat Setoran Teman */}
      {activeTab === 'setoran' && (
        <Card className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Riwayat Setoran Masuk dari Teman</h3>
              <p className="text-xs text-slate-500">
                Teman mencicil dengan nominal tidak tetap dan bebas tanggal.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setIsDebtorPaymentOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 whitespace-nowrap self-start sm:self-auto"
            >
              <ArrowDownRight className="h-4 w-4 mr-1" />
              Tambah Setoran Teman
            </Button>
          </div>

          {(loan.debtor_payments || []).length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="mx-auto h-8 w-8 text-slate-300 mb-2" />
              <p className="text-xs font-semibold text-slate-600">Belum ada setoran dari teman.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Catat setiap kali teman mentransfer atau memberi uang tunai.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {(loan.debtor_payments || []).map((payment) => (
                <div key={payment.id} className="py-3 flex items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-extrabold text-slate-900">{formatRupiah(payment.jumlah)}</span>
                      <Badge status={payment.metode} />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-500 mt-1">
                      <span>Diterima: {formatTanggalIndo(payment.tanggal_terima)}</span>
                      {payment.catatan && <span className="text-slate-700 font-medium">"{payment.catatan}"</span>}
                      {payment.bukti_url && (
                        <a
                          href={payment.bukti_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-shopee-600 underline font-semibold flex items-center gap-0.5 mt-0.5 sm:mt-0"
                        >
                          Bukti Transfer <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setPaymentToDelete({ id: payment.id, jumlah: payment.jumlah })}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition shrink-0"
                    title="Hapus setoran ini"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-600">Total Setoran Diterima:</span>
            <span className="font-extrabold text-emerald-600 text-sm">{formatRupiah(summary.totalSetorTeman)}</span>
          </div>
        </Card>
      )}

      {/* Modals Input Pembayaran */}
      <ShopeePayModal
        isOpen={!!selectedInstallment}
        onClose={() => setSelectedInstallment(null)}
        installment={selectedInstallment}
        namaBarang={loan.nama_barang}
        onSuccess={() => refreshData()}
      />

      <DebtorPaymentModal
        isOpen={isDebtorPaymentOpen}
        onClose={() => setIsDebtorPaymentOpen(false)}
        loans={loans}
        defaultLoanId={loan.id}
        onSuccess={() => refreshData()}
      />

      {/* Modal Konfirmasi Hapus Pinjaman Keseluruhan */}
      <Modal
        isOpen={isDeleteLoanModalOpen}
        onClose={() => !isDeletingLoan && setIsDeleteLoanModalOpen(false)}
        title="Konfirmasi Hapus Pinjaman"
        description=""
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Apakah kamu yakin ingin menghapus transaksi <strong>{loan.nama_barang}</strong> secara permanen?
            <br /><br />
            Tindakan ini akan menghapus seluruh data jadwal cicilan, setoran dari teman, dan riwayat pembayaran ke Shopee yang terkait dengan pinjaman ini.
          </p>
          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={() => setIsDeleteLoanModalOpen(false)}
              disabled={isDeletingLoan}
            >
              Batal
            </Button>
            <Button
              className="bg-rose-600 hover:bg-rose-700 text-white"
              onClick={confirmDeleteLoan}
              isLoading={isDeletingLoan}
            >
              Ya, Hapus Permanen
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Konfirmasi Hapus Setoran Teman */}
      <Modal
        isOpen={!!paymentToDelete}
        onClose={() => !isDeletingPayment && setPaymentToDelete(null)}
        title="Hapus Riwayat Setoran"
        description=""
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Apakah kamu yakin ingin menghapus data setoran sebesar <strong>{paymentToDelete ? formatRupiah(paymentToDelete.jumlah) : ''}</strong>?
            Saldo "Sisa Utang Teman" akan otomatis dihitung ulang.
          </p>
          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={() => setPaymentToDelete(null)}
              disabled={isDeletingPayment}
            >
              Batal
            </Button>
            <Button
              className="bg-rose-600 hover:bg-rose-700 text-white"
              onClick={confirmDeletePayment}
              isLoading={isDeletingPayment}
            >
              Ya, Hapus Setoran
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}