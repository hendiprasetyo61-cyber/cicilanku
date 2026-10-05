import { z } from 'zod';

export const debtorSchema = z.object({
  nama_teman: z.string().min(2, 'Nama teman minimal 2 karakter').max(100, 'Nama terlalu panjang'),
  no_hp: z.string().optional().refine((val) => !val || /^(\+62|62|0)[0-9]{8,15}$/.test(val.replace(/[\s-]/g, '')), {
    message: 'Nomor HP tidak valid (contoh: 081234567890)',
  }),
  catatan: z.string().max(500, 'Catatan maksimal 500 karakter').optional().nullable(),
});

export const loanSchema = z.object({
  debtor_id: z.string().min(1, 'Pilih teman yang meminjam limit'),
  nama_barang: z.string().min(2, 'Nama barang minimal 2 karakter').max(150, 'Nama barang terlalu panjang'),
  order_id_shopee: z.string().max(100, 'Order ID Shopee terlalu panjang').optional().nullable(),
  harga_pokok: z.coerce.number().min(10000, 'Harga pokok minimal Rp 10.000'),
  bunga_persen_per_bulan: z.coerce.number().min(0, 'Bunga minimal 0%').max(50, 'Bunga maksimal 50% per bulan').default(0),
  metode_bunga: z.enum(['flat', 'efektif'], {
    errorMap: () => ({ message: 'Metode bunga harus "flat" atau "efektif"' }),
  }).default('flat'),
  biaya_admin: z.coerce.number().min(0, 'Biaya admin minimal Rp 0').default(0),
  alokasi_admin: z.enum(['pertama', 'rata']).default('pertama'),
  tenor_bulan: z.coerce.number().int().min(1, 'Tenor minimal 1 bulan').max(60, 'Tenor maksimal 60 bulan').default(6),
  tanggal_mulai: z.string().min(1, 'Pilih tanggal mulai transaksi'),
  tanggal_jatuh_tempo: z.coerce.number().int().min(1, 'Tanggal minimal 1').max(31, 'Tanggal maksimal 31'),
});

export const shopeePaymentSchema = z.object({
  installment_id: z.string().min(1, 'Pilih cicilan yang dibayar'),
  tanggal_bayar: z.string().min(1, 'Pilih tanggal bayar'),
  jumlah: z.coerce.number().min(1000, 'Jumlah bayar minimal Rp 1.000'),
  catatan: z.string().max(300, 'Catatan maksimal 300 karakter').optional().nullable(),
});

export const debtorPaymentSchema = z.object({
  loan_id: z.string().min(1, 'Pilih pinjaman'),
  tanggal_terima: z.string().min(1, 'Pilih tanggal terima setoran'),
  jumlah: z.coerce.number().min(1000, 'Nomor setoran minimal Rp 1.000'),
  metode: z.enum(['transfer', 'tunai']).default('transfer'),
  catatan: z.string().max(300, 'Catatan maksimal 300 karakter').optional().nullable(),
  bukti_url: z.string().url('URL bukti transfer harus valid').optional().nullable().or(z.literal('')),
});

export const authSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

export const userSettingsSchema = z.object({
  remind_h3: z.boolean().default(true),
  remind_h1: z.boolean().default(true),
  remind_h0: z.boolean().default(true),
  remind_inactivity: z.boolean().default(true),
  reminder_hour: z.coerce.number().int().min(0).max(23).default(9),
  reminder_minute: z.coerce.number().int().min(0).max(59).default(0),
  enable_push: z.boolean().default(true),
  enable_email: z.boolean().default(true),
});

export type DebtorInput = z.infer<typeof debtorSchema>;
export type LoanInput = z.infer<typeof loanSchema>;
export type ShopeePaymentInput = z.infer<typeof shopeePaymentSchema>;
export type DebtorPaymentInput = z.infer<typeof debtorPaymentSchema>;
export type AuthInput = z.infer<typeof authSchema>;
export type UserSettingsInput = z.infer<typeof userSettingsSchema>;
