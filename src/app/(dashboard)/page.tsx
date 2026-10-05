'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  AlertTriangle,
  Clock,
  ArrowDownRight,
  ArrowUpRight,
  CreditCard,
  Plus,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Share2,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { useCicilanStore } from '@/lib/store';
import { calculateLoanBalance } from '@/lib/calculations/balance';
import { formatRupiah, formatTanggalIndo, getDaysDiffFromToday } from '@/lib/formatters';
import { DebtorPaymentModal } from '@/components/payments/DebtorPaymentModal';
import { ShopeePayModal } from '@/components/loans/ShopeePayModal';
import { Installment, PaylaterLoan } from '@/lib/types';

export default function DashboardPage() {
  const { loans, debtors, isLoaded } = useCicilanStore();

  const [isDebtorPaymentOpen, setIsDebtorPaymentOpen] = useState(false);
  const [selectedShopeeInst, setSelectedShopeeInst] = useState<{
    installment: Installment;
    loan: PaylaterLoan;
  } | null>(null);

  if (!isLoaded) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-shopee-500" />
      </div>
    );
  }

  // Hitung agregat finansial semua pinjaman aktif
  let totalSemuaTagihan = 0;
  let totalSemuaSetorTeman = 0;
  let totalSemuaBayarShopee = 0;
  let allUpcomingInstallments: Array<{
    loan: PaylaterLoan;
    installment: Installment;
    diffDays: number;
    label: string;
    isPast: boolean;
    isToday: boolean;
    sisa: number;
  }> = [];

  loans.forEach((loan) => {
    const summary = calculateLoanBalance(loan, loan.installments || [], loan.debtor_payments || []);
    totalSemuaTagihan += summary.totalTagihanLoan;
    totalSemuaSetorTeman += summary.totalSetorTeman;
    totalSemuaBayarShopee += summary.totalDibayarKeShopee;

    (loan.installments || []).forEach((inst) => {
      const sisa = inst.total_tagihan - inst.sudah_dibayar;
      if (sisa > 0) {
        const diff = getDaysDiffFromToday(inst.jatuh_tempo);
        allUpcomingInstallments.push({
          loan,
          installment: inst,
          diffDays: diff.diffDays,
          label: diff.label,
          isPast: diff.isPast,
          isToday: diff.isToday,
          sisa,
        });
      }
    });
  });

  // Urutkan jadwal tagihan dari yang paling mendesak (terlewat / paling dekat)
  allUpcomingInstallments.sort((a, b) => a.diffDays - b.diffDays);
  const nearestInstallment = allUpcomingInstallments[0];

  const totalSisaUtangTeman = Math.max(0, totalSemuaTagihan - totalSemuaSetorTeman);
  const totalPosisiKas = totalSemuaSetorTeman - totalSemuaBayarShopee;
  const isKasNombok = totalPosisiKas < 0;

  const pctSetorTeman = totalSemuaTagihan > 0 ? Math.round((totalSemuaSetorTeman / totalSemuaTagihan) * 100) : 0;
  const pctBayarShopee = totalSemuaTagihan > 0 ? Math.round((totalSemuaBayarShopee / totalSemuaTagihan) * 100) : 0;

  // Filter peringatan (telat atau H-3 s.d H-0)
  const urgentAlerts = allUpcomingInstallments.filter((item) => item.diffDays <= 3);

  return (
    <div className="space-y-6">
      {/* Welcome & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-orange-500 via-rose-500 to-shopee-600 rounded-2xl p-5 text-white shadow-md shadow-shopee-500/15">
        <div>
          <span className="text-xs uppercase tracking-wider text-orange-100 font-semibold">Ringkasan SPayLater</span>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight mt-0.5">
            Kelola Cicilan Teman Tanpa Ribet
          </h1>
          <p className="text-xs text-orange-100 mt-1 max-w-lg">
            Pantau posisi talangan uang pribadi, jatuh tempo Shopee, dan catat setoran fleksibel teman.
          </p>
        </div>
        <div className="flex items-center gap-2 pt-2 sm:pt-0">
          <Button
            size="sm"
            onClick={() => setIsDebtorPaymentOpen(true)}
            className="bg-white text-slate-900 hover:bg-slate-100 font-bold shadow-sm"
          >
            <ArrowDownRight className="h-4 w-4 mr-1 text-emerald-600" />
            Catat Setoran Teman
          </Button>
          <Link href="/loans/new">
            <Button
              size="sm"
              variant="outline"
              className="bg-orange-600/60 border-orange-300/40 text-white hover:bg-orange-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              Pinjaman
            </Button>
          </Link>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Tagihan Terdekat */}
        <Card hoverable className="border-l-4 border-l-amber-500 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Tagihan Terdekat</span>
              <div className="rounded-lg bg-amber-50 p-1.5 text-amber-600">
                <Clock className="h-4 w-4" />
              </div>
            </div>

            {nearestInstallment ? (
              <div className="mt-2.5">
                <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {formatRupiah(nearestInstallment.sisa)}
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span
                    className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full ${
                      nearestInstallment.isPast
                        ? 'bg-rose-100 text-rose-700'
                        : nearestInstallment.isToday
                        ? 'bg-amber-100 text-amber-800 animate-pulse'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {nearestInstallment.label}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Jatuh tempo {formatTanggalIndo(nearestInstallment.installment.jatuh_tempo, true)}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-2 truncate font-medium">
                  {nearestInstallment.loan.nama_barang} • {nearestInstallment.loan.debtor?.nama_teman} (Ke-{nearestInstallment.installment.cicilan_ke})
                </p>
              </div>
            ) : (
              <div className="mt-4">
                <p className="text-sm font-semibold text-emerald-600">Semua Tagihan Sudah Lunas! 🎉</p>
                <p className="text-xs text-slate-500 mt-0.5">Tidak ada tagihan Shopee yang menunggu dibayar.</p>
              </div>
            )}
          </div>

          {nearestInstallment && (
            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() =>
                  setSelectedShopeeInst({
                    installment: nearestInstallment.installment,
                    loan: nearestInstallment.loan,
                  })
                }
                className="text-xs font-bold text-shopee-600 hover:text-shopee-700 flex items-center gap-1"
              >
                Bayar Sekarang <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </Card>

        {/* Card 2: Sisa Utang Teman */}
        <Card hoverable className="border-l-4 border-l-shopee-500 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Sisa Utang Teman</span>
              <div className="rounded-lg bg-orange-50 p-1.5 text-shopee-600">
                <CreditCard className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {formatRupiah(totalSisaUtangTeman)}
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
                <span>Dari total tagihan pinjaman</span>
                <span className="font-semibold text-slate-700">{formatRupiah(totalSemuaTagihan)}</span>
              </div>
              <div className="mt-3">
                <Progress
                  value={pctSetorTeman}
                  label="Pelunasan Teman"
                  color="emerald"
                  sublabel={`${formatRupiah(totalSemuaSetorTeman)} dari ${formatRupiah(totalSemuaTagihan)} disetor`}
                />
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
            <Link href="/payments" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
              Lihat Riwayat Setoran <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </Card>

        {/* Card 3: Posisi Kas Saya (Nombok vs Surplus) */}
        <Card
          hoverable
          className={`border-l-4 flex flex-col justify-between ${
            isKasNombok ? 'border-l-rose-500 bg-rose-50/20' : 'border-l-emerald-500 bg-emerald-50/20'
          }`}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Posisi Kas Saya</span>
              <div className={`rounded-lg p-1.5 ${isKasNombok ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                {isKasNombok ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
              </div>
            </div>
            <div className="mt-2.5">
              <div className={`text-2xl font-extrabold tracking-tight ${isKasNombok ? 'text-rose-600' : 'text-emerald-600'}`}>
                {isKasNombok ? `- ${formatRupiah(Math.abs(totalPosisiKas))}` : formatRupiah(totalPosisiKas)}
              </div>
              <div className="mt-1">
                {isKasNombok ? (
                  <span className="inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                    Kamu Sedang Menalangi
                  </span>
                ) : (
                  <span className="inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                    Kas Surplus / Teman Setor Duluan
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                {isKasNombok
                  ? 'Jumlah uang pribadi yang sudah kamu bayarkan ke Shopee tapi belum diganti teman.'
                  : 'Teman telah menyetor uang lebih banyak daripada total yang telah dibayar ke Shopee.'}
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
            <span>Dibayar ke Shopee:</span>
            <span className="font-bold text-slate-800">{formatRupiah(totalSemuaBayarShopee)}</span>
          </div>
        </Card>
      </div>

      {/* Dual Progress Bars */}
      <Card className="space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <span>Perbandingan Pembayaran & Pelunasan</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-200/60">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-slate-700">Setoran dari Teman</span>
              <span className="text-xs font-extrabold text-emerald-600">{pctSetorTeman}%</span>
            </div>
            <Progress value={pctSetorTeman} showPercentage={false} color="emerald" size="lg" />
            <div className="mt-2 flex justify-between text-xs text-slate-500">
              <span>Disetor: {formatRupiah(totalSemuaSetorTeman)}</span>
              <span>Sisa: {formatRupiah(totalSisaUtangTeman)}</span>
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 border border-slate-200/60">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-slate-700">Pembayaran ke Shopee PayLater</span>
              <span className="text-xs font-extrabold text-shopee-600">{pctBayarShopee}%</span>
            </div>
            <Progress value={pctBayarShopee} showPercentage={false} color="shopee" size="lg" />
            <div className="mt-2 flex justify-between text-xs text-slate-500">
              <span>Dibayar: {formatRupiah(totalSemuaBayarShopee)}</span>
              <span>Sisa: {formatRupiah(Math.max(0, totalSemuaTagihan - totalSemuaBayarShopee))}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Urgent Alerts (Telat & Mendekati Jatuh Tempo) */}
      {urgentAlerts.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/40">
          <div className="flex items-center gap-2 text-amber-800 font-bold text-sm mb-3">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span>Peringatan Tagihan SPayLater Mendesak ({urgentAlerts.length})</span>
          </div>
          <div className="space-y-2.5">
            {urgentAlerts.map((alert) => (
              <div
                key={alert.installment.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl bg-white p-3.5 border border-amber-200/80 shadow-2xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                        alert.isPast ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {alert.label}
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {alert.loan.nama_barang} • Cicilan ke-{alert.installment.cicilan_ke}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Teman peminjam: <strong className="text-slate-700">{alert.loan.debtor?.nama_teman}</strong> • Jatuh tempo{' '}
                    {formatTanggalIndo(alert.installment.jatuh_tempo)}
                  </p>
                </div>
                <div className="flex items-center gap-3 justify-between sm:justify-end">
                  <span className="text-sm font-extrabold text-shopee-600">{formatRupiah(alert.sisa)}</span>
                  <Button
                    size="sm"
                    onClick={() =>
                      setSelectedShopeeInst({
                        installment: alert.installment,
                        loan: alert.loan,
                      })
                    }
                  >
                    Bayar Shopee
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Daftar Pinjaman Aktif */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Pinjaman SPayLater</h2>
          <Link href="/loans" className="text-xs font-semibold text-shopee-600 hover:text-shopee-700 flex items-center gap-0.5">
            Lihat Semua ({loans.length}) <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {loans.length === 0 ? (
          <Card className="text-center py-10">
            <CreditCard className="mx-auto h-10 w-10 text-slate-400 mb-2" />
            <h4 className="text-sm font-bold text-slate-800">Belum ada catatan pinjaman</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Mulai catat transaksi Shopee PayLater yang dipakai teman agar tidak lupa dan posisi kas tercatat rapi.
            </p>
            <div className="mt-4">
              <Link href="/loans/new">
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Tambah Pinjaman Pertama
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loans.map((loan) => {
              const summary = calculateLoanBalance(loan, loan.installments || [], loan.debtor_payments || []);
              return (
                <Card key={loan.id} hoverable className="flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">{loan.nama_barang}</span>
                          <Badge status={loan.status} />
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Teman: <strong className="text-slate-700">{loan.debtor?.nama_teman || 'Teman'}</strong>
                          {loan.order_id_shopee && ` • Order: ${loan.order_id_shopee}`}
                        </p>
                      </div>
                      <Link
                        href={`/share/${loan.share_token}`}
                        target="_blank"
                        title="Link publik untuk teman"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-shopee-600 transition"
                      >
                        <Share2 className="h-4 w-4" />
                      </Link>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-slate-500 block">Total Tagihan:</span>
                        <span className="font-bold text-slate-800">{formatRupiah(summary.totalTagihanLoan)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Sisa Utang Teman:</span>
                        <span className="font-bold text-shopee-600">{formatRupiah(summary.sisaUtangTeman)}</span>
                      </div>
                    </div>

                    <div className="mt-3">
                      <Progress
                        value={summary.persentaseSetorTeman}
                        label="Pelunasan Teman"
                        color="emerald"
                        size="sm"
                      />
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      Tenor {loan.tenor_bulan} bln • {summary.jumlahCicilanLunas}/{summary.totalCicilan} cicilan Shopee lunas
                    </span>
                    <Link
                      href={`/loans/${loan.id}`}
                      className="font-bold text-shopee-600 hover:text-shopee-700 flex items-center gap-0.5"
                    >
                      Detail <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <DebtorPaymentModal
        isOpen={isDebtorPaymentOpen}
        onClose={() => setIsDebtorPaymentOpen(false)}
        loans={loans}
      />

      <ShopeePayModal
        isOpen={!!selectedShopeeInst}
        onClose={() => setSelectedShopeeInst(null)}
        installment={selectedShopeeInst?.installment || null}
        namaBarang={selectedShopeeInst?.loan.nama_barang}
      />
    </div>
  );
}
