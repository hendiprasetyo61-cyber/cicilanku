'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  ShoppingBag,
  Download,
  Printer,
  CheckCircle2,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { getStoredLoans } from '@/lib/store';
import { calculateLoanBalance } from '@/lib/calculations/balance';
import { formatRupiah, formatTanggalIndo } from '@/lib/formatters';
import { PaylaterLoan } from '@/lib/types';

export default function PublicSharePage() {
  const params = useParams();
  const token = params.token as string;

  const [loan, setLoan] = useState<PaylaterLoan | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Cari pinjaman berdasarkan share_token
    const loans = getStoredLoans();
    const found = loans.find((l) => l.share_token === token);
    if (found) {
      setLoan(found);
    }
    setIsReady(true);
  }, [token]);

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-shopee-500" />
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <Card className="max-w-md w-full text-center py-10">
          <AlertCircle className="mx-auto h-12 w-12 text-slate-400 mb-3" />
          <h2 className="text-lg font-bold text-slate-800">Tautan Tidak Ditemukan</h2>
          <p className="text-xs text-slate-500 mt-1">
            Tautan ringkasan cicilan ini sudah tidak aktif atau salah ketik.
          </p>
        </Card>
      </div>
    );
  }

  const summary = calculateLoanBalance(loan, loan.installments || [], loan.debtor_payments || []);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['No', 'Tanggal Terima', 'Jumlah (Rp)', 'Metode', 'Catatan'];
    const rows = (loan.debtor_payments || []).map((p, idx) => [
      idx + 1,
      p.tanggal_terima,
      p.jumlah,
      p.metode,
      `"${(p.catatan || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [`Ringkasan Cicilan: ${loan.nama_barang}`] +
      '\n' +
      [`Peminjam: ${loan.debtor?.nama_teman || 'Teman'}`] +
      '\n' +
      [`Total Tagihan: ${loan.total_tagihan}`] +
      '\n' +
      [`Sisa Utang: ${summary.sisaUtangTeman}`] +
      '\n\n' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ringkasan_cicilan_${loan.nama_barang.toLowerCase().replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 py-6 sm:py-10 px-4 print:bg-white print:p-0">
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Brand Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-shopee-600 to-shopee-400 text-white shadow-md shadow-shopee-500/20">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <span className="text-base font-extrabold text-slate-900">
                Cicilan<span className="text-shopee-500">Ku</span>
              </span>
              <p className="text-[10px] text-slate-500">Rincian Transparansi Cicilan</p>
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <Button size="sm" variant="outline" onClick={handleExportCSV} className="text-xs">
              <FileSpreadsheet className="h-3.5 w-3.5 mr-1 text-emerald-600" />
              Unduh CSV
            </Button>
            <Button size="sm" variant="secondary" onClick={handlePrint} className="text-xs">
              <Printer className="h-3.5 w-3.5 mr-1" />
              Cetak / PDF
            </Button>
          </div>
        </div>

        {/* Main Card */}
        <div className="rounded-3xl bg-white p-6 shadow-xl border border-slate-200/80 space-y-6">
          {/* Header Info */}
          <div className="border-b border-slate-100 pb-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Laporan Status Pelunasan
              </span>
              <Badge status={summary.sisaUtangTeman === 0 ? 'lunas' : 'aktif'} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              {loan.nama_barang}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Diterbitkan untuk:{' '}
              <strong className="text-slate-800">{loan.debtor?.nama_teman || 'Teman'}</strong> • Transaksi{' '}
              {formatTanggalIndo(loan.tanggal_mulai)}
            </p>
          </div>

          {/* 3 Metric Box */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-500 block uppercase">Total Tagihan</span>
              <span className="text-lg font-black text-slate-900 mt-1 block">
                {formatRupiah(summary.totalTagihanLoan)}
              </span>
            </div>

            <div className="rounded-2xl bg-emerald-50/70 p-4 border border-emerald-100">
              <span className="text-[11px] font-semibold text-emerald-700 block uppercase">Sudah Disetor</span>
              <span className="text-lg font-black text-emerald-600 mt-1 block">
                {formatRupiah(summary.totalSetorTeman)}
              </span>
            </div>

            <div className="rounded-2xl bg-orange-50/80 p-4 border border-orange-100">
              <span className="text-[11px] font-semibold text-orange-700 block uppercase">Sisa yang Belum</span>
              <span className="text-lg font-black text-shopee-600 mt-1 block">
                {formatRupiah(summary.sisaUtangTeman)}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2 rounded-2xl bg-slate-50 p-4 border border-slate-100">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span>Progres Pelunasan</span>
              <span className="text-emerald-600">{summary.persentaseSetorTeman}% Selesai</span>
            </div>
            <Progress value={summary.persentaseSetorTeman} showPercentage={false} color="emerald" size="lg" />
            {summary.sisaUtangTeman === 0 ? (
              <p className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 mt-2">
                <CheckCircle2 className="h-4 w-4" />
                Terima kasih, cicilan barang ini sudah lunas sepenuhnya!
              </p>
            ) : (
              <p className="text-[11px] text-slate-500 mt-1">
                Sisa kekurangan pembayaran: <strong className="text-slate-800">{formatRupiah(summary.sisaUtangTeman)}</strong>
              </p>
            )}
          </div>

          {/* Riwayat Setoran Teman */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900">
              Riwayat Pembayaran Diterima ({(loan.debtor_payments || []).length})
            </h3>

            {(loan.debtor_payments || []).length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
                Belum ada catatan setoran masuk.
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Tanggal</th>
                      <th className="py-2.5 px-3">Metode</th>
                      <th className="py-2.5 px-3">Catatan</th>
                      <th className="py-2.5 px-3 text-right">Jumlah</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(loan.debtor_payments || []).map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/60">
                        <td className="py-2.5 px-3 text-slate-700 font-medium">
                          {formatTanggalIndo(p.tanggal_terima)}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="capitalize px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-semibold text-slate-700">
                            {p.metode}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 italic">
                          {p.catatan || '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                          {formatRupiah(p.jumlah)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50/80 font-bold border-t border-slate-200 text-xs">
                    <tr>
                      <td colSpan={3} className="py-2.5 px-3 text-slate-700">
                        Total Disetor:
                      </td>
                      <td className="py-2.5 px-3 text-right text-emerald-600 font-black">
                        {formatRupiah(summary.totalSetorTeman)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Footer Note */}
          <div className="pt-4 border-t border-slate-100 text-center text-[11px] text-slate-400">
            Dicatat secara rapi dan transparan menggunakan aplikasi <strong>CicilanKu</strong>.
          </div>
        </div>
      </div>
    </div>
  );
}
