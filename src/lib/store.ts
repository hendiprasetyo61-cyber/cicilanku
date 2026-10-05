'use client';

import { useEffect, useState } from 'react';
import { Debtor, PaylaterLoan, UserSettings, DebtorPayment, ShopeePayment, LoanCalculationInput } from './types';
import { INITIAL_DEBTORS, INITIAL_LOANS, INITIAL_SETTINGS } from './demo-data';
import { generateInstallmentSchedule } from './calculations/installment';
import { calculateLoanBalance } from './calculations/balance';

const STORAGE_KEYS = {
  DEBTORS: 'cicilanku_debtors_v1',
  LOANS: 'cicilanku_loans_v1',
  SETTINGS: 'cicilanku_settings_v1',
};

// Event bus untuk sinkronisasi state antar komponen tanpa perlu Redux
const EVENT_STATE_CHANGE = 'cicilanku_state_change';

function emitChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(EVENT_STATE_CHANGE));
  }
}

export function getStoredDebtors(): Debtor[] {
  if (typeof window === 'undefined') return INITIAL_DEBTORS;
  const raw = localStorage.getItem(STORAGE_KEYS.DEBTORS);
  if (!raw) {
    localStorage.setItem(STORAGE_KEYS.DEBTORS, JSON.stringify(INITIAL_DEBTORS));
    return INITIAL_DEBTORS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return INITIAL_DEBTORS;
  }
}

export function getStoredLoans(): PaylaterLoan[] {
  if (typeof window === 'undefined') return INITIAL_LOANS;
  const raw = localStorage.getItem(STORAGE_KEYS.LOANS);
  if (!raw) {
    localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(INITIAL_LOANS));
    return INITIAL_LOANS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return INITIAL_LOANS;
  }
}

export function getStoredSettings(): UserSettings {
  if (typeof window === 'undefined') return INITIAL_SETTINGS;
  const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  if (!raw) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
    return INITIAL_SETTINGS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return INITIAL_SETTINGS;
  }
}

export function saveDebtor(debtor: Omit<Debtor, 'id' | 'created_at'>): Debtor {
  const current = getStoredDebtors();
  const newDebtor: Debtor = {
    ...debtor,
    id: `deb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    created_at: new Date().toISOString(),
  };
  const updated = [newDebtor, ...current];
  localStorage.setItem(STORAGE_KEYS.DEBTORS, JSON.stringify(updated));
  emitChange();
  return newDebtor;
}

export function updateDebtor(id: string, data: Partial<Debtor>): void {
  const current = getStoredDebtors();
  const updated = current.map((d) => (d.id === id ? { ...d, ...data, updated_at: new Date().toISOString() } : d));
  localStorage.setItem(STORAGE_KEYS.DEBTORS, JSON.stringify(updated));
  emitChange();
}

export function deleteDebtor(id: string): void {
  const current = getStoredDebtors();
  const updated = current.filter((d) => d.id !== id);
  localStorage.setItem(STORAGE_KEYS.DEBTORS, JSON.stringify(updated));
  emitChange();
}

export function createLoan(input: LoanCalculationInput & {
  debtorId: string;
  namaBarang: string;
  orderIdShopee?: string;
  userId?: string;
}): PaylaterLoan {
  const debtors = getStoredDebtors();
  const debtor = debtors.find((d) => d.id === input.debtorId);

  const schedule = generateInstallmentSchedule(input);
  const loanId = `loan-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const shareToken = `share-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

  const newLoan: PaylaterLoan = {
    id: loanId,
    user_id: input.userId || 'user-demo-01',
    debtor_id: input.debtorId,
    nama_barang: input.namaBarang,
    order_id_shopee: input.orderIdShopee || null,
    harga_pokok: input.hargaPokok,
    bunga_persen_per_bulan: input.bungaPersenPerBulan,
    metode_bunga: input.metodeBunga,
    biaya_admin: input.biayaAdmin,
    alokasi_admin: input.alokasiAdmin,
    tenor_bulan: input.tenorBulan,
    tanggal_mulai: input.tanggalMulai,
    tanggal_jatuh_tempo: input.tanggalJatuhTempo,
    total_tagihan: schedule.totalTagihan,
    status: 'aktif',
    share_token: shareToken,
    created_at: new Date().toISOString(),
    debtor: debtor,
    installments: schedule.installments.map((inst, idx) => ({
      id: `inst-${loanId}-${idx + 1}`,
      loan_id: loanId,
      cicilan_ke: inst.cicilan_ke,
      jatuh_tempo: inst.jatuh_tempo,
      pokok: inst.pokok,
      bunga: inst.bunga,
      total_tagihan: inst.total_tagihan,
      sudah_dibayar: 0,
      status: 'belum',
      shopee_payments: [],
    })),
    debtor_payments: [],
  };

  const currentLoans = getStoredLoans();
  const updatedLoans = [newLoan, ...currentLoans];
  localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(updatedLoans));
  emitChange();
  return newLoan;
}

export function recordShopeePayment(params: {
  installmentId: string;
  jumlah: number;
  tanggalBayar: string;
  catatan?: string;
}): void {
  const currentLoans = getStoredLoans();

  const updatedLoans = currentLoans.map((loan) => {
    let loanModified = false;
    const installments = (loan.installments || []).map((inst) => {
      if (inst.id === params.installmentId) {
        loanModified = true;
        const newPayment: ShopeePayment = {
          id: `shp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          installment_id: inst.id,
          tanggal_bayar: params.tanggalBayar,
          jumlah: params.jumlah,
          catatan: params.catatan || null,
          created_at: new Date().toISOString(),
        };

        const existingPayments = inst.shopee_payments || [];
        const updatedPayments = [...existingPayments, newPayment];
        const totalPaid = updatedPayments.reduce((acc, p) => acc + p.jumlah, 0);

        let newStatus = inst.status;
        if (totalPaid >= inst.total_tagihan) {
          newStatus = 'lunas';
        } else if (totalPaid > 0) {
          const isPast = new Date() > new Date(inst.jatuh_tempo);
          newStatus = isPast ? 'telat' : 'sebagian';
        }

        return {
          ...inst,
          sudah_dibayar: totalPaid,
          status: newStatus,
          shopee_payments: updatedPayments,
        };
      }
      return inst;
    });

    if (loanModified) {
      // Recalculate loan status
      const summary = calculateLoanBalance(loan, installments, loan.debtor_payments || []);
      return {
        ...loan,
        installments,
        status: summary.statusPinjaman,
      };
    }
    return loan;
  });

  localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(updatedLoans));
  emitChange();
}

export function recordDebtorPayment(params: {
  loanId: string;
  jumlah: number;
  tanggalTerima: string;
  metode: 'transfer' | 'tunai';
  catatan?: string;
  buktiUrl?: string;
}): void {
  const currentLoans = getStoredLoans();

  const updatedLoans = currentLoans.map((loan) => {
    if (loan.id === params.loanId) {
      const newPayment: DebtorPayment = {
        id: `dp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        loan_id: loan.id,
        tanggal_terima: params.tanggalTerima,
        jumlah: params.jumlah,
        metode: params.metode,
        catatan: params.catatan || null,
        bukti_url: params.buktiUrl || null,
        created_at: new Date().toISOString(),
      };

      const updatedDebtorPayments = [newPayment, ...(loan.debtor_payments || [])];
      const summary = calculateLoanBalance(loan, loan.installments || [], updatedDebtorPayments);

      return {
        ...loan,
        debtor_payments: updatedDebtorPayments,
        status: summary.statusPinjaman,
      };
    }
    return loan;
  });

  localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(updatedLoans));
  emitChange();
}

export function deleteDebtorPayment(loanId: string, paymentId: string): void {
  const currentLoans = getStoredLoans();

  const updatedLoans = currentLoans.map((loan) => {
    if (loan.id === loanId) {
      const updatedDebtorPayments = (loan.debtor_payments || []).filter((p) => p.id !== paymentId);
      const summary = calculateLoanBalance(loan, loan.installments || [], updatedDebtorPayments);

      return {
        ...loan,
        debtor_payments: updatedDebtorPayments,
        status: summary.statusPinjaman,
      };
    }
    return loan;
  });

  localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(updatedLoans));
  emitChange();
}

export function deleteLoan(loanId: string): void {
  const currentLoans = getStoredLoans();
  const updatedLoans = currentLoans.filter((l) => l.id !== loanId);
  localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(updatedLoans));
  emitChange();
}

export function updateSettings(settings: Partial<UserSettings>): void {
  const current = getStoredSettings();
  const updated = { ...current, ...settings };
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
  emitChange();
}

export function findLoanByShareToken(token: string): PaylaterLoan | undefined {
  const loans = getStoredLoans();
  return loans.find((l) => l.share_token === token);
}

// React Custom Hook untuk reactive store
export function useCicilanStore() {
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [loans, setLoans] = useState<PaylaterLoan[]>([]);
  const [settings, setSettings] = useState<UserSettings>(INITIAL_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  const refreshData = () => {
    setDebtors(getStoredDebtors());
    setLoans(getStoredLoans());
    setSettings(getStoredSettings());
  };

  useEffect(() => {
    refreshData();
    setIsLoaded(true);

    const handleUpdate = () => {
      refreshData();
    };

    window.addEventListener(EVENT_STATE_CHANGE, handleUpdate);
    return () => window.removeEventListener(EVENT_STATE_CHANGE, handleUpdate);
  }, []);

  return {
    debtors,
    loans,
    settings,
    isLoaded,
    saveDebtor,
    updateDebtor,
    deleteDebtor,
    createLoan,
    recordShopeePayment,
    recordDebtorPayment,
    deleteDebtorPayment,
    deleteLoan,
    updateSettings,
    refreshData,
  };
}
