export type InterestMethod = 'flat' | 'efektif';
export type AdminAllocation = 'pertama' | 'rata';
export type InstallmentStatus = 'belum' | 'sebagian' | 'lunas' | 'telat';
export type LoanStatus = 'aktif' | 'lunas';
export type PaymentMethod = 'transfer' | 'tunai';
export type ReminderType = 'h-3' | 'h-1' | 'h-0' | 'inactivity';
export type ReminderChannel = 'push' | 'email';
export type ReminderStatus = 'antrean' | 'terkirim' | 'gagal';

export interface Debtor {
  id: string;
  user_id: string;
  nama_teman: string;
  no_hp?: string | null;
  catatan?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface PaylaterLoan {
  id: string;
  user_id: string;
  debtor_id: string;
  nama_barang: string;
  order_id_shopee?: string | null;
  harga_pokok: number; // Integer Rupiah
  bunga_persen_per_bulan: number; // e.g. 2.95% or 0%
  metode_bunga: InterestMethod;
  biaya_admin: number; // Integer Rupiah
  alokasi_admin: AdminAllocation;
  tenor_bulan: number;
  tanggal_mulai: string; // ISO Date YYYY-MM-DD
  tanggal_jatuh_tempo: number; // 1-31
  total_tagihan: number; // Total Rupiah
  status: LoanStatus;
  share_token: string;
  created_at: string;
  updated_at?: string;
  // Joins
  debtor?: Debtor;
  installments?: Installment[];
  debtor_payments?: DebtorPayment[];
}

export interface Installment {
  id?: string;
  loan_id?: string;
  cicilan_ke: number;
  jatuh_tempo: string; // ISO Date YYYY-MM-DD
  pokok: number;
  bunga: number;
  biaya_admin?: number;
  total_tagihan: number;
  sudah_dibayar: number;
  status: InstallmentStatus;
  created_at?: string;
  updated_at?: string;
  shopee_payments?: ShopeePayment[];
}

export interface ShopeePayment {
  id: string;
  installment_id: string;
  tanggal_bayar: string; // YYYY-MM-DD
  jumlah: number;
  catatan?: string | null;
  created_at: string;
}

export interface DebtorPayment {
  id: string;
  loan_id: string;
  tanggal_terima: string; // YYYY-MM-DD
  jumlah: number;
  metode: PaymentMethod;
  catatan?: string | null;
  bukti_url?: string | null;
  created_at: string;
}

export interface UserSettings {
  user_id: string;
  remind_h3: boolean;
  remind_h1: boolean;
  remind_h0: boolean;
  remind_inactivity: boolean;
  reminder_hour: number;
  reminder_minute: number;
  enable_push: boolean;
  enable_email: boolean;
}

export interface LoanCalculationInput {
  hargaPokok: number;
  bungaPersenPerBulan: number;
  metodeBunga: InterestMethod;
  biayaAdmin: number;
  alokasiAdmin: AdminAllocation;
  tenorBulan: number;
  tanggalMulai: string; // YYYY-MM-DD
  tanggalJatuhTempo: number; // Day of month 1-31
}

export interface GeneratedSchedule {
  installments: Array<{
    cicilan_ke: number;
    jatuh_tempo: string;
    pokok: number;
    bunga: number;
    total_tagihan: number;
    sudah_dibayar: number;
    status: InstallmentStatus;
  }>;
  totalPokok: number;
  totalBunga: number;
  totalAdmin: number;
  totalTagihan: number;
}
