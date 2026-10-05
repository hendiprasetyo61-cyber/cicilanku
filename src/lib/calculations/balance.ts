import { DebtorPayment, Installment, InstallmentStatus, LoanStatus, PaylaterLoan, ShopeePayment } from '../types';

export interface LoanFinancialSummary {
  totalTagihanLoan: number;
  totalSetorTeman: number;
  sisaUtangTeman: number;
  totalDibayarKeShopee: number;
  sisaTagihanShopee: number;
  posisiKas: number; // >0: Teman setor surplus, <0: Pemilik menalangi (nombok), =0: Pas
  isNombok: boolean;
  nominalNombok: number;
  persentaseSetorTeman: number;
  persentaseBayarShopee: number;
  statusPinjaman: LoanStatus;
  jumlahCicilanLunas: number;
  totalCicilan: number;
  hasCicilanTelat: boolean;
  cicilanTerdekat?: {
    cicilan_ke: number;
    jatuh_tempo: string;
    sisa_harus_dibayar: number;
    total_tagihan: number;
    sudah_dibayar: number;
    status: InstallmentStatus;
  };
}

/**
 * Menghitung status cicilan (belum, sebagian, telat, lunas) berdasarkan jatuh tempo dan nominal bayar
 */
export function determineInstallmentStatus(
  totalTagihan: number,
  sudahDibayar: number,
  jatuhTempoStr: string,
  referenceDate: Date = new Date()
): InstallmentStatus {
  if (sudahDibayar >= totalTagihan) {
    return 'lunas';
  }

  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);

  const due = new Date(jatuhTempoStr);
  due.setHours(0, 0, 0, 0);

  const isPastDue = today.getTime() > due.getTime();

  if (isPastDue) {
    return 'telat';
  }

  if (sudahDibayar > 0) {
    return 'sebagian';
  }

  return 'belum';
}

/**
 * Menghitung ringkasan finansial pinjaman secara komprehensif
 */
export function calculateLoanBalance(
  loan: Pick<PaylaterLoan, 'total_tagihan'>,
  installments: Array<Pick<Installment, 'cicilan_ke' | 'jatuh_tempo' | 'total_tagihan' | 'sudah_dibayar' | 'status'>>,
  debtorPayments: Array<Pick<DebtorPayment, 'jumlah'>>,
  referenceDate: Date = new Date()
): LoanFinancialSummary {
  const totalTagihanLoan = Math.round(Number(loan.total_tagihan) || 0);

  // 1. Total Pembayaran Teman
  const totalSetorTeman = debtorPayments.reduce((acc, p) => acc + (Math.round(Number(p.jumlah)) || 0), 0);
  const sisaUtangTeman = Math.max(0, totalTagihanLoan - totalSetorTeman);

  // 2. Total Pembayaran ke Shopee
  let totalDibayarKeShopee = 0;
  let jumlahCicilanLunas = 0;
  let hasCicilanTelat = false;
  let cicilanTerdekat: LoanFinancialSummary['cicilanTerdekat'] = undefined;

  // Urutkan installments berdasarkan cicilan_ke
  const sortedInstallments = [...installments].sort((a, b) => a.cicilan_ke - b.cicilan_ke);

  for (const inst of sortedInstallments) {
    const totalInst = Math.round(Number(inst.total_tagihan));
    const paidInst = Math.round(Number(inst.sudah_dibayar));
    totalDibayarKeShopee += paidInst;

    const currentStatus = determineInstallmentStatus(totalInst, paidInst, inst.jatuh_tempo, referenceDate);

    if (currentStatus === 'lunas') {
      jumlahCicilanLunas++;
    } else {
      if (currentStatus === 'telat') {
        hasCicilanTelat = true;
      }
      // Ambil installment yang belum lunas pertama sebagai cicilan terdekat
      if (!cicilanTerdekat) {
        cicilanTerdekat = {
          cicilan_ke: inst.cicilan_ke,
          jatuh_tempo: inst.jatuh_tempo,
          sisa_harus_dibayar: Math.max(0, totalInst - paidInst),
          total_tagihan: totalInst,
          sudah_dibayar: paidInst,
          status: currentStatus,
        };
      }
    }
  }

  const sisaTagihanShopee = Math.max(0, totalTagihanLoan - totalDibayarKeShopee);

  // 3. Posisi Kas Pemilik
  // Posisi kas = SUM(debtor_payments) - SUM(shopee_payments)
  // Jika < 0: Pemilik akun sedang menalangi
  const posisiKas = totalSetorTeman - totalDibayarKeShopee;
  const isNombok = posisiKas < 0;
  const nominalNombok = isNombok ? Math.abs(posisiKas) : 0;

  // 4. Persentase
  const persentaseSetorTeman = totalTagihanLoan > 0
    ? Math.min(100, Math.round((totalSetorTeman / totalTagihanLoan) * 100))
    : 0;

  const persentaseBayarShopee = totalTagihanLoan > 0
    ? Math.min(100, Math.round((totalDibayarKeShopee / totalTagihanLoan) * 100))
    : 0;

  // 5. Status Keseluruhan Pinjaman
  // Pinjaman otomatis 'lunas' jika semua cicilan lunas dan sisa utang teman <= 0
  const isAllInstallmentsPaid = sortedInstallments.length > 0 && jumlahCicilanLunas === sortedInstallments.length;
  const statusPinjaman: LoanStatus = isAllInstallmentsPaid && sisaUtangTeman <= 0 ? 'lunas' : 'aktif';

  return {
    totalTagihanLoan,
    totalSetorTeman,
    sisaUtangTeman,
    totalDibayarKeShopee,
    sisaTagihanShopee,
    posisiKas,
    isNombok,
    nominalNombok,
    persentaseSetorTeman,
    persentaseBayarShopee,
    statusPinjaman,
    jumlahCicilanLunas,
    totalCicilan: sortedInstallments.length,
    hasCicilanTelat,
    cicilanTerdekat,
  };
}
