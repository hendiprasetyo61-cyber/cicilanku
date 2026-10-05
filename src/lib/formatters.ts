/**
 * Format mata uang Rupiah standar Indonesia: Rp 1.250.000
 */
export function formatRupiah(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return 'Rp 0';
  }
  const numeric = Math.round(Number(amount));
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(numeric);
  return `Rp ${formatted}`;
}

/**
 * Format tanggal Indonesia: 15 Oktober 2024 atau 15 Okt 2024
 */
export function formatTanggalIndo(
  dateInput: string | Date | null | undefined,
  shortMonth: boolean = false
): string {
  if (!dateInput) return '-';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: shortMonth ? 'short' : 'long',
    year: 'numeric',
  }).format(date);
}

/**
 * Hitung selisih hari dari sekarang ke tanggal jatuh tempo
 * Mengembalikan:
 * - positif: N hari lagi (contoh: 3 hari lagi)
 * - 0: Hari ini jatuh tempo
 * - negatif: Terlewat N hari (contoh: Terlewat 2 hari)
 */
export function getDaysDiffFromToday(dueDateStr: string): {
  diffDays: number;
  label: string;
  isToday: boolean;
  isPast: boolean;
  isUpcoming: boolean;
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return { diffDays: 0, label: 'Hari ini', isToday: true, isPast: false, isUpcoming: false };
  } else if (diffDays > 0) {
    return {
      diffDays,
      label: `${diffDays} hari lagi`,
      isToday: false,
      isPast: false,
      isUpcoming: true,
    };
  } else {
    return {
      diffDays,
      label: `Lewat ${Math.abs(diffDays)} hari`,
      isToday: false,
      isPast: true,
      isUpcoming: false,
    };
  }
}
