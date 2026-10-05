'use client';

import { useEffect, useState, useCallback } from 'react';
import { Debtor, PaylaterLoan, UserSettings, DebtorPayment, ShopeePayment, LoanCalculationInput } from './types';
import { generateInstallmentSchedule } from './calculations/installment';
import { createClient } from './supabase/client';

export const DEFAULT_SETTINGS: UserSettings = {
  user_id: '',
  remind_h3: true,
  remind_h1: true,
  remind_h0: true,
  remind_inactivity: true,
  reminder_hour: 9,
  reminder_minute: 0,
  enable_push: true,
  enable_email: true,
};

export function useCicilanStore() {
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [loans, setLoans] = useState<PaylaterLoan[]>([]);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const supabase = createClient();

  const refreshData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setDebtors([]);
        setLoans([]);
        setCurrentUserId(null);
        setIsLoaded(true);
        return;
      }

      setCurrentUserId(user.id);

      // 1. Ambil Teman (Debtors) dari Supabase
      const { data: debtorsData, error: debtorsErr } = await supabase
        .from('debtors')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!debtorsErr && debtorsData) {
        setDebtors(debtorsData);
      }

      // 2. Ambil Pinjaman (Loans) beserta Relasi Lengkap
      const { data: loansData, error: loansErr } = await supabase
        .from('paylater_loans')
        .select(`
          *,
          debtor:debtors(*),
          installments(
            *,
            shopee_payments(*)
          ),
          debtor_payments(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!loansErr && loansData) {
        // Urutkan installments per loan berdasarkan cicilan_ke
        const formattedLoans = loansData.map((loan: any) => ({
          ...loan,
          installments: (loan.installments || []).sort(
            (a: any, b: any) => a.cicilan_ke - b.cicilan_ke
          ),
          debtor_payments: (loan.debtor_payments || []).sort(
            (a: any, b: any) => new Date(b.tanggal_terima).getTime() - new Date(a.tanggal_terima).getTime()
          ),
        }));
        setLoans(formattedLoans);
      }

      // 3. Ambil Pengaturan (Settings)
      const { data: settingsData } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (settingsData) {
        setSettings({ ...DEFAULT_SETTINGS, ...settingsData });
      } else {
        setSettings({ ...DEFAULT_SETTINGS, user_id: user.id });
      }

      setIsLoaded(true);
    } catch (err) {
      console.error('Error fetching Supabase data:', err);
      setIsLoaded(true);
    }
  }, [supabase]);

  useEffect(() => {
    refreshData();

    // Listen to Supabase auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      refreshData();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshData, supabase.auth]);

  // 1. Simpan Teman Baru ke Supabase
  const saveDebtor = async (debtor: Omit<Debtor, 'id' | 'created_at'>): Promise<Debtor | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Pengguna belum masuk');

      const { data, error } = await supabase
        .from('debtors')
        .insert({
          user_id: user.id,
          nama_teman: debtor.nama_teman,
          no_hp: debtor.no_hp || null,
          catatan: debtor.catatan || null,
        })
        .select()
        .single();

      if (error) throw error;
      await refreshData();
      return data;
    } catch (err: any) {
      console.error('Error saving debtor:', err);
      throw err;
    }
  };

  // 2. Update Teman
  const updateDebtor = async (id: string, updates: Partial<Debtor>): Promise<void> => {
    try {
      const { error } = await supabase
        .from('debtors')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      await refreshData();
    } catch (err: any) {
      console.error('Error updating debtor:', err);
      throw err;
    }
  };

  // 3. Hapus Teman
  const deleteDebtor = async (id: string): Promise<void> => {
    try {
      const { error } = await supabase.from('debtors').delete().eq('id', id);
      if (error) throw error;
      await refreshData();
    } catch (err: any) {
      console.error('Error deleting debtor:', err);
      throw err;
    }
  };

  // 4. Buat Pinjaman Baru & Generate Jadwal Installments di Supabase
  const createLoan = async (input: LoanCalculationInput & {
    debtorId: string;
    namaBarang: string;
    orderIdShopee?: string;
  }): Promise<PaylaterLoan> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Pengguna belum masuk');

      const schedule = generateInstallmentSchedule(input);

      // Simpan ke tabel paylater_loans
      const { data: loan, error: loanErr } = await supabase
        .from('paylater_loans')
        .insert({
          user_id: user.id,
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
        })
        .select()
        .single();

      if (loanErr || !loan) throw loanErr || new Error('Gagal membuat pinjaman');

      // Simpan jadwal cicilan ke tabel installments
      const installmentsToInsert = schedule.installments.map((inst) => ({
        loan_id: loan.id,
        cicilan_ke: inst.cicilan_ke,
        jatuh_tempo: inst.jatuh_tempo,
        pokok: inst.pokok,
        bunga: inst.bunga,
        total_tagihan: inst.total_tagihan,
        sudah_dibayar: 0,
        status: 'belum',
      }));

      const { error: instErr } = await supabase.from('installments').insert(installmentsToInsert);
      if (instErr) throw instErr;

      await refreshData();
      return loan;
    } catch (err: any) {
      console.error('Error creating loan:', err);
      throw err;
    }
  };

  // 5. Catat Pembayaran ke Shopee
  const recordShopeePayment = async (params: {
    installmentId: string;
    jumlah: number;
    tanggalBayar: string;
    catatan?: string;
  }): Promise<void> => {
    try {
      const { error } = await supabase.from('shopee_payments').insert({
        installment_id: params.installmentId,
        tanggal_bayar: params.tanggalBayar,
        jumlah: params.jumlah,
        catatan: params.catatan || null,
      });

      if (error) throw error;
      await refreshData();
    } catch (err: any) {
      console.error('Error recording Shopee payment:', err);
      throw err;
    }
  };

  // 6. Catat Setoran Masuk dari Teman
  const recordDebtorPayment = async (params: {
    loanId: string;
    jumlah: number;
    tanggalTerima: string;
    metode: 'transfer' | 'tunai';
    catatan?: string;
    buktiUrl?: string;
  }): Promise<void> => {
    try {
      const { error } = await supabase.from('debtor_payments').insert({
        loan_id: params.loanId,
        tanggal_terima: params.tanggalTerima,
        jumlah: params.jumlah,
        metode: params.metode,
        catatan: params.catatan || null,
        bukti_url: params.buktiUrl || null,
      });

      if (error) throw error;
      await refreshData();
    } catch (err: any) {
      console.error('Error recording debtor payment:', err);
      throw err;
    }
  };

  // 7. Hapus Setoran Teman
  const deleteDebtorPayment = async (loanId: string, paymentId: string): Promise<void> => {
    try {
      const { error } = await supabase.from('debtor_payments').delete().eq('id', paymentId);
      if (error) throw error;
      await refreshData();
    } catch (err: any) {
      console.error('Error deleting debtor payment:', err);
      throw err;
    }
  };

  // 8. Hapus Pinjaman
  const deleteLoan = async (loanId: string): Promise<void> => {
    try {
      const { error } = await supabase.from('paylater_loans').delete().eq('id', loanId);
      if (error) throw error;
      await refreshData();
    } catch (err: any) {
      console.error('Error deleting loan:', err);
      throw err;
    }
  };

  // 9. Update Settings
  const updateSettings = async (newSettings: Partial<UserSettings>): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const merged = { ...settings, ...newSettings, user_id: user.id };
      const { error } = await supabase.from('user_settings').upsert(merged);
      if (error) throw error;

      setSettings(merged);
    } catch (err: any) {
      console.error('Error updating settings:', err);
    }
  };

  return {
    debtors,
    loans,
    settings,
    isLoaded,
    currentUserId,
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
