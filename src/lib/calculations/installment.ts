import { GeneratedSchedule, LoanCalculationInput } from '../types';

/**
 * Menghitung tanggal jatuh tempo untuk bulan tertentu dengan aman
 * Menangani kasus hari 29, 30, 31 pada bulan-bulan pendek seperti Februari.
 */
export function calculateDueDate(
  startDateStr: string,
  dueDayOfMonth: number,
  installmentMonthIndex: number // 1, 2, 3...
): string {
  const startDate = new Date(startDateStr);
  const startDay = startDate.getDate();
  const startMonth = startDate.getMonth();
  const startYear = startDate.getFullYear();

  // Jika hari mulai sudah melewati tanggal jatuh tempo di bulan yang sama,
  // maka cicilan pertama jatuh di bulan berikutnya (offset = installmentMonthIndex)
  // Jika belum, cicilan pertama jatuh pada tanggal tsb di bulan yang sama (offset = installmentMonthIndex - 1)
  const monthOffset = startDay >= dueDayOfMonth ? installmentMonthIndex : installmentMonthIndex - 1;

  // Hitung target tahun dan bulan
  const targetDate = new Date(startYear, startMonth + monthOffset, 1);
  const targetYear = targetDate.getFullYear();
  const targetMonth = targetDate.getMonth();

  // Dapatkan jumlah hari maksimum di bulan target
  const maxDaysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  const actualDay = Math.min(dueDayOfMonth, maxDaysInMonth);

  const finalDate = new Date(targetYear, targetMonth, actualDay);

  const yyyy = finalDate.getFullYear();
  const mm = String(finalDate.getMonth() + 1).padStart(2, '0');
  const dd = String(finalDate.getDate()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Generate jadwal cicilan Shopee PayLater
 * Mendukung Bunga 0%, Bunga Flat, dan Bunga Efektif (Anuitas)
 * Penanganan selisih pembulatan uang Rupiah ke cicilan terakhir
 */
export function generateInstallmentSchedule(input: LoanCalculationInput): GeneratedSchedule {
  const {
    hargaPokok,
    bungaPersenPerBulan,
    metodeBunga,
    biayaAdmin,
    alokasiAdmin,
    tenorBulan,
    tanggalMulai,
    tanggalJatuhTempo,
  } = input;

  if (tenorBulan <= 0) {
    throw new Error('Tenor bulan harus lebih besar dari 0');
  }

  if (hargaPokok <= 0) {
    throw new Error('Harga pokok harus lebih besar dari 0');
  }

  const installments: GeneratedSchedule['installments'] = [];
  let totalPokok = 0;
  let totalBunga = 0;

  // 1. Alokasi Biaya Admin
  const adminPerMonth: number[] = new Array(tenorBulan).fill(0);
  if (biayaAdmin > 0) {
    if (alokasiAdmin === 'pertama') {
      adminPerMonth[0] = Math.round(biayaAdmin);
    } else {
      // Bagi rata ke seluruh tenor
      const baseAdmin = Math.floor(biayaAdmin / tenorBulan);
      const remainderAdmin = Math.round(biayaAdmin) - baseAdmin * tenorBulan;
      for (let i = 0; i < tenorBulan; i++) {
        adminPerMonth[i] = baseAdmin;
      }
      // Sisa pembulatan dialokasikan ke bulan terakhir
      adminPerMonth[tenorBulan - 1] += remainderAdmin;
    }
  }

  // 2. Kalkulasi Pokok dan Bunga per metode
  if (bungaPersenPerBulan === 0) {
    // KASUS 1: BUNGA 0%
    const basePokok = Math.floor(hargaPokok / tenorBulan);
    const remainderPokok = Math.round(hargaPokok) - basePokok * tenorBulan;

    for (let i = 0; i < tenorBulan; i++) {
      const isLast = i === tenorBulan - 1;
      const pokok = isLast ? basePokok + remainderPokok : basePokok;
      const bunga = 0;
      const admin = adminPerMonth[i];
      const total = pokok + bunga + admin;

      totalPokok += pokok;
      totalBunga += bunga;

      installments.push({
        cicilan_ke: i + 1,
        jatuh_tempo: calculateDueDate(tanggalMulai, tanggalJatuhTempo, i + 1),
        pokok,
        bunga,
        total_tagihan: total,
        sudah_dibayar: 0,
        status: 'belum',
      });
    }
  } else if (metodeBunga === 'flat') {
    // KASUS 2: BUNGA FLAT
    // Bunga dihitung tetap setiap bulan dari harga pokok awal
    const bungaPerBulan = Math.round(hargaPokok * (bungaPersenPerBulan / 100));
    const basePokok = Math.floor(hargaPokok / tenorBulan);
    const remainderPokok = Math.round(hargaPokok) - basePokok * tenorBulan;

    for (let i = 0; i < tenorBulan; i++) {
      const isLast = i === tenorBulan - 1;
      const pokok = isLast ? basePokok + remainderPokok : basePokok;
      const bunga = bungaPerBulan;
      const admin = adminPerMonth[i];
      const total = pokok + bunga + admin;

      totalPokok += pokok;
      totalBunga += bunga;

      installments.push({
        cicilan_ke: i + 1,
        jatuh_tempo: calculateDueDate(tanggalMulai, tanggalJatuhTempo, i + 1),
        pokok,
        bunga,
        total_tagihan: total,
        sudah_dibayar: 0,
        status: 'belum',
      });
    }
  } else {
    // KASUS 3: BUNGA EFEKTIF (ANUITAS)
    // Formula Anuitas: A = P * (i * (1 + i)^n) / ((1 + i)^n - 1)
    const i = bungaPersenPerBulan / 100;
    const n = tenorBulan;
    const factor = Math.pow(1 + i, n);
    const rawAnnuity = (hargaPokok * (i * factor)) / (factor - 1);
    const annuity = Math.round(rawAnnuity);

    let remainingPrincipal = Math.round(hargaPokok);

    for (let month = 0; month < tenorBulan; month++) {
      const isLast = month === tenorBulan - 1;
      let bunga = Math.round(remainingPrincipal * i);
      let pokok: number;

      if (isLast) {
        // Bulan terakhir: seluruh sisa pokok dilunasi
        pokok = remainingPrincipal;
      } else {
        pokok = annuity - bunga;
        // Jaga agar pokok tidak melebihi sisa pokok
        if (pokok > remainingPrincipal) {
          pokok = remainingPrincipal;
        }
      }

      remainingPrincipal -= pokok;
      const admin = adminPerMonth[month];
      const total = pokok + bunga + admin;

      totalPokok += pokok;
      totalBunga += bunga;

      installments.push({
        cicilan_ke: month + 1,
        jatuh_tempo: calculateDueDate(tanggalMulai, tanggalJatuhTempo, month + 1),
        pokok,
        bunga,
        total_tagihan: total,
        sudah_dibayar: 0,
        status: 'belum',
      });
    }
  }

  const totalAdmin = adminPerMonth.reduce((a, b) => a + b, 0);
  const totalTagihan = totalPokok + totalBunga + totalAdmin;

  return {
    installments,
    totalPokok,
    totalBunga,
    totalAdmin,
    totalTagihan,
  };
}
