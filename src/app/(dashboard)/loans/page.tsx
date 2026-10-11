'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, CreditCard, ChevronRight, Share2, Users, Check } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { useCicilanStore } from '@/lib/store';
import { calculateLoanBalance } from '@/lib/calculations/balance';
import { formatRupiah, formatTanggalIndo } from '@/lib/formatters';

export default function LoansPage() {
  const { loans, isLoaded } = useCicilanStore();
  const [filterStatus, setFilterStatus] = useState<'semua' | 'aktif' | 'lunas'>('semua');
  const [searchQuery, setSearchQuery] = useState('');

  // State untuk melacak ID pinjaman mana yang link-nya sedang disalin
  const [copiedLoanId, setCopiedLoanId] = useState<string | null>(null);

  if (!isLoaded) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-shopee-500" />
      </div>
    );
  }

  const filteredLoans = loans.filter((loan) => {
    const matchesStatus = filterStatus === 'semua' || loan.status === filterStatus;
    const matchesSearch =
      loan.nama_barang.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (loan.debtor?.nama_teman || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (loan.order_id_shopee || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Fungsi modern untuk menyalin link tanpa harus membuka tab baru
  const handleCopyShareLink = (loanId: string, shareToken: string) => {
    const shareUrl = `${window.location.origin}/share/${shareToken}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLoanId(loanId);

    // Kembalikan ke ikon awal setelah 2 detik
    setTimeout(() => {
      setCopiedLoanId(null);
    }, 2000);
  };

  return (
    <div className="space-y-5">
      {/* Header Page */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Daftar Pinjaman SPayLater</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar cicilan barang Shopee PayLater yang dipakai oleh teman-temanmu.
          </p>
        </div>
        <Link href="/loans/new">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Tambah Pinjaman Baru
          </Button>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari barang, nama teman, nomor pesanan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-xs text-slate-900 focus:border-shopee-500 focus:outline-none focus:ring-2 focus:ring-shopee-500/20"
          />
        </div>

        <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200/80 shrink-0">
          {(['semua', 'aktif', 'lunas'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${filterStatus === status
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Loan List */}
      {filteredLoans.length === 0 ? (
        <Card className="text-center py-12">
          <CreditCard className="mx-auto h-12 w-12 text-slate-300 mb-2" />
          <h3 className="text-sm font-bold text-slate-700">Tidak ada pinjaman ditemukan</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `Tidak ada transaksi yang cocok dengan kata kunci "${searchQuery}".`
              : 'Belum ada data pinjaman pada filter ini.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3.5">
          {filteredLoans.map((loan) => {
            const summary = calculateLoanBalance(loan, loan.installments || [], loan.debtor_payments || []);
            const isCopied = copiedLoanId === loan.id;

            return (
              <Card key={loan.id} hoverable className="p-4 sm:p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">{loan.nama_barang}</h3>
                      <Badge status={loan.status} />
                      {summary.hasCicilanTelat && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                          Ada Cicilan Telat
                        </span>
                      )}
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                        Peminjam: <strong className="text-slate-800">{loan.debtor?.nama_teman || 'Teman'}</strong>
                      </span>
                      <span>Mulai: {formatTanggalIndo(loan.tanggal_mulai, true)}</span>
                      <span>Jatuh tempo tgl {loan.tanggal_jatuh_tempo} tiap bulan</span>
                      {loan.order_id_shopee && (
                        <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                          {loan.order_id_shopee}
                        </span>
                      )}
                    </div>

                    {/* Progress Pelunasan */}
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
                      <Progress
                        // Memastikan grafik aman dari NaN
                        value={Number.isNaN(summary.persentaseSetorTeman) ? 0 : Math.min(100, Math.max(0, summary.persentaseSetorTeman))}
                        label="Setoran Teman"
                        color="emerald"
                        size="sm"
                        sublabel={`${formatRupiah(summary.totalSetorTeman)} dari ${formatRupiah(summary.totalTagihanLoan)}`}
                      />
                      <Progress
                        // Memastikan grafik aman dari NaN
                        value={Number.isNaN(summary.persentaseBayarShopee) ? 0 : Math.min(100, Math.max(0, summary.persentaseBayarShopee))}
                        label="Bayar ke Shopee"
                        color="shopee"
                        size="sm"
                        sublabel={`${summary.jumlahCicilanLunas} dari ${summary.totalCicilan} cicilan`}
                      />
                    </div>
                  </div>

                  {/* Financial Stats & Actions */}
                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 gap-2 shrink-0">
                    <div className="text-left md:text-right">
                      <span className="text-[11px] text-slate-500 block">Sisa Utang Teman</span>
                      <span className="text-base sm:text-lg font-extrabold text-shopee-600">
                        {formatRupiah(summary.sisaUtangTeman)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyShareLink(loan.id, loan.share_token)}
                        className={`rounded-xl border p-2 transition ${isCopied
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                          : 'border-slate-200 bg-white text-slate-600 hover:text-shopee-600 hover:border-shopee-200'
                          }`}
                        title="Salin link rincian tagihan"
                      >
                        {isCopied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                      </button>

                      <Link href={`/loans/${loan.id}`}>
                        <Button size="sm" variant="outline">
                          Detail Pinjaman <ChevronRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}