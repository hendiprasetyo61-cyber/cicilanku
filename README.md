# CicilanKu 📱💳
> **Aplikasi PWA Modern untuk Mencatat Cicilan Shopee PayLater yang Dipakai Teman**

**CicilanKu** dirancang khusus untuk memecahkan masalah nyata: akun Shopee PayLater milik kamu dipinjam teman untuk belanja barang, kamu yang wajib membayar tagihan bulanan ke Shopee tepat waktu, sementara teman mencicil kembali ke kamu dengan nominal tidak tetap dan tanggal bebas.

Dengan **CicilanKu**, kamu dapat mengetahui secara pasti:
1. **Posisi Kas Saya**: Apakah kamu sedang **menalangi (nombok)** uang pribadi dan berapa nominalnya.
2. **Sisa Utang Teman**: Berapa sisa yang belum diganti oleh temanmu.
3. **Jadwal & Countdown Jatuh Tempo Shopee**: Pengingat H-3, H-1, dan hari H agar terhindar dari denda keterlambatan Shopee PayLater.
4. **Halaman Publik Read-Only**: Bagikan link rincian tagihan transparan ke teman tanpa perlu login dan tanpa menampilkan data sensitif akun Shopee-mu.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, Server & Client Components, TypeScript)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + Glassmorphism & Palet Desain Modern Shopee
- **Icons**: [Lucide React](https://lucide.dev/)
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL dengan Row Level Security / RLS, Triggers, Functions)
- **PWA (Progressive Web App)**: Web App Manifest, Service Worker (`sw.js`), Offline Caching, Installable di Android & Desktop
- **Notifikasi**: Web Push API (VAPID) + Email Notifications ([Resend](https://resend.com/))
- **Unit Testing**: [Vitest](https://vitest.dev/) untuk akurasi kalkulasi bunga 0%, flat, efektif/anuitas, dan saldo
- **Deployment**: [Vercel](https://vercel.com/)

---

## 📂 Struktur Direktori Proyek

```
cicilanku/
├── .env.example                                      # Template environment variable
├── .env.local                                        # Environment variable lokal
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── vitest.config.ts                                  # Konfigurasi Unit Test Vitest
├── supabase/
│   ├── migrations/
│   │   └── 20240101000000_init_cicilanku_schema.sql  # DDL Tabel, Relasi FK, Triggers, RLS Policies
│   ├── seed.sql                                      # Seed data contoh HP Rp 3.000.000 tenor 6 bulan
│   └── functions/
│       └── send-reminders/index.ts                   # Supabase Edge Function untuk cron daily reminder
├── public/
│   ├── manifest.json                                 # PWA Manifest (stand-alone, theme color Shopee)
│   ├── sw.js                                         # Service Worker custom (push & offline caching)
│   ├── icon-192.png                                  # Icon Android PWA
│   ├── icon-512.png                                  # Icon Splash PWA
│   └── icon.svg
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx                        # Login + Instant Demo Mode
│   │   │   └── register/page.tsx                     # Pendaftaran Akun
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx                            # Navbar Desktop + Bottom Navigation Mobile
│   │   │   ├── page.tsx                              # Dashboard (Countdown, Sisa Utang, Posisi Kas)
│   │   │   ├── loans/
│   │   │   │   ├── page.tsx                          # Daftar Semua Pinjaman
│   │   │   │   ├── new/page.tsx                      # Form Tambah Pinjaman + Live Schedule Preview
│   │   │   │   └── [id]/page.tsx                     # Detail Pinjaman (Tabel Jadwal 1-N, Catat Bayar Shopee)
│   │   │   ├── debtors/page.tsx                      # Kelola Data Teman (Panggilan & WhatsApp Direct)
│   │   │   ├── payments/page.tsx                     # Riwayat Setoran Fleksibel Teman
│   │   │   └── settings/page.tsx                     # Pengaturan Reminder H-3, H-1, H-0 & Web Push
│   │   ├── share/[token]/page.tsx                    # Halaman Publik Read-Only Teman + Ekspor PDF/CSV
│   │   ├── api/
│   │   │   ├── cron/reminders/route.ts               # Cron Job Reminder H-3, H-1, H-0 & Inactivity 30 Hari
│   │   │   └── push/subscribe/route.ts               # Web Push Subscription endpoint
│   │   ├── globals.css                               # Design system & typography
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                                       # Button, Input, Card, Badge, Progress, Modal, Select
│   │   ├── layout/                                   # Header, BottomNav
│   │   ├── loans/                                    # ShopeePayModal, SchedulePreviewModal
│   │   ├── payments/                                 # DebtorPaymentModal
│   │   ├── debtors/                                  # DebtorModal
│   │   └── pwa/                                      # PWAInstallPrompt
│   ├── lib/
│   │   ├── calculations/
│   │   │   ├── installment.ts                        # Rumus Bunga 0%, Flat, Efektif & Pembulatan Rupiah
│   │   │   └── balance.ts                            # Rumus Posisi Kas Nombok/Surplus & Status Lunas
│   │   ├── supabase/                                 # Client, Server SSR, dan Service Role helper
│   │   ├── types/index.ts                            # TypeScript Definitions
│   │   ├── formatters.ts                             # Format Rp 1.250.000 & Tanggal Indonesia
│   │   └── store.ts                                  # Reactive Store + Local/Cloud Sync
│   └── tests/
│       ├── installment.test.ts                       # Unit test jadwal cicilan & pembulatan rupiah
│       └── balance.test.ts                           # Unit test posisi kas & status pinjaman
```

---

## 🧮 Logika Bisnis & Finansial

1. **Jadwal Cicilan Otomatis (Installments)**:
   - **Bunga 0%**: Pokok dibagi rata sesuai tenor. Selisih pembulatan dialokasikan ke bulan terakhir.
   - **Bunga Flat**: Bunga per bulan = `harga_pokok * persen`. Tagihan bulanan = `(pokok / tenor) + bunga`.
   - **Bunga Efektif (Anuitas)**: Dihitung dengan rumus anuitas standar perbankan:
     $$A = P \times \frac{i \times (1+i)^n}{(1+i)^n - 1}$$
   - **Opsi Biaya Admin**: Ditambahkan ke cicilan ke-1 atau dibagi rata ke seluruh tenor.
2. **Kalkulasi Posisi Kas (Talangan Uang Pribadi)**:
   - `total_setor_teman = SUM(debtor_payments.jumlah)`
   - `total_bayar_shopee = SUM(shopee_payments.jumlah)`
   - `posisi_kas = total_setor_teman - total_bayar_shopee`
     * **Jika Negatif (< 0)**: Pemilik akun sedang **menalangi (nombok)** uang pribadi sebesar nilai tersebut.
     * **Jika Positif (> 0)**: Teman menyetor surplus / lebih cepat daripada jadwal bayar ke Shopee.
3. **Status Otomatis**:
   - Status **'telat'** otomatis terpasang jika melewati tanggal jatuh tempo dan belum lunas.
   - Pinjaman otomatis berstatus **'lunas'** jika seluruh cicilan Shopee berstatus lunas dan `sisa_utang_teman <= 0`.

---

## 🚀 Panduan Setup & Menjalankan di Lokal

### 1. Prasyarat
- Node.js v18 atau v20+
- Akun [Supabase](https://supabase.com/) (gratis)

### 2. Clone & Install Dependencies
```bash
git clone <repository-url>
cd cicilanku
npm install
```

### 3. Setup Database Supabase
1. Buka [Supabase Dashboard](https://supabase.com/dashboard) dan buat project baru.
2. Masuk ke menu **SQL Editor**.
3. Buka file `supabase/migrations/20240101000000_init_cicilanku_schema.sql`, salin seluruh isinya, dan klik **Run**.
   - Ini akan membuat semua tabel (`debtors`, `paylater_loans`, `installments`, `shopee_payments`, `debtor_payments`, `reminders`, `push_subscriptions`, `user_settings`), indexes, trigger otomatis kalkulasi, dan RLS policies.
4. *(Opsional)* Untuk memasukkan data contoh HP Rp 3.000.000 tenor 6 bulan, salin isi file `supabase/seed.sql` dan jalankan di SQL Editor.

### 4. Konfigurasi Environment Variables
Buat file `.env.local` di direktori utama (atau salin dari `.env.example`):
```env
# Supabase (Dapatkan di Project Settings > API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Web Push (VAPID) - Buat dengan perintah `npx web-push generate-vapid-keys`
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_SUBJECT=mailto:admin@cicilanku.local

# Resend Email (Opsional jika ingin notifikasi email)
RESEND_API_KEY=re_your_resend_api_key
EMAIL_FROM=CicilanKu <notifications@resend.dev>

# Cron Secret
CRON_SECRET=cicilanku-cron-secret-12345
```

> **Catatan Mode Demo**: Jika kamu belum memasukkan URL Supabase, aplikasi secara otomatis berjalan dalam **Mode Demo Interaktif** menggunakan penyimpanan lokal browser (localStorage). Semua fitur input data, edit, catat bayar, dan share tetap dapat dicoba secara utuh!

### 5. Jalankan Unit Test
Untuk memastikan keakuratan perhitungan bunga dan saldo:
```bash
npm run test
```

### 6. Jalankan Server Development
```bash
npm run dev
```
Buka browser di `http://localhost:3000`.

---

## 🌐 Panduan Deploy ke Vercel

1. Push kode ke repository GitHub/GitLab kamu.
2. Buka [Vercel](https://vercel.com/) dan pilih **Add New Project** > Import repository `cicilanku`.
3. Di bagian **Environment Variables**, masukkan variabel dari file `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL` (URL domain Vercel kamu, misal: `https://cicilanku.vercel.app`)
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
   - `RESEND_API_KEY`
   - `CRON_SECRET`
4. Klik **Deploy**.
5. Vercel akan otomatis mendeteksi konfigurasi Next.js 14 App Router.

---

## ⏰ Konfigurasi Reminder Otomatis

Aplikasi mendukung reminder **H-3**, **H-1**, dan **Hari H** via Web Push dan Email:
1. **Via Vercel Cron**: Tambahkan `vercel.json` untuk menjalankan endpoint `/api/cron/reminders` setiap hari pada jam 09:00 WIB:
```json
{
  "crons": [
    {
      "path": "/api/cron/reminders",
      "schedule": "0 2 * * *"
    }
  ]
}
```
*(Catatan: Jam 02:00 UTC = Jam 09:00 WIB).*

2. **Via Supabase Edge Function & pg_cron**:
   - Deploy function di `supabase/functions/send-reminders`:
     ```bash
     supabase functions deploy send-reminders
     ```
   - Jadwalkan di SQL Editor Supabase:
     ```sql
     SELECT cron.schedule(
       'daily-reminders-spaylater',
       '0 2 * * *',
       $$ SELECT net.http_post(
            url:='https://your-project.supabase.co/functions/v1/send-reminders',
            headers:='{"Authorization": "Bearer YOUR_CRON_SECRET"}'::jsonb
          ); $$
     );
     ```

---

## 📲 Cara Install PWA di Android & Laptop

### Pada Smartphone Android (Google Chrome):
1. Buka tautan website CicilanKu di Google Chrome.
2. Banner **"Pasang CicilanKu di HP / Laptop"** akan otomatis muncul di bagian atas aplikasi.
3. Klik tombol **"Install Sekarang"**.
4. Atau klik tombol menu titik tiga (⋮) di pojok kanan atas Chrome, lalu pilih **"Tambahkan ke Layar Utama"** atau **"Instal Aplikasi"**.
5. Icon **CicilanKu** akan terpasang di layar utama HP seperti aplikasi native Android.

### Pada Laptop / PC (Google Chrome atau Microsoft Edge):
1. Buka website CicilanKu.
2. Perhatikan address bar di pojok kanan atas browser (di sebelah ikon bintang bookmark).
3. Klik ikon komputer/download **"Instal CicilanKu"**.
4. Aplikasi akan terbuka di jendela standalone yang terpisah dari tab browser.

---

## 🔒 Keamanan & Privasi (RLS Policies)
- Semua data pinjaman, cicilan, dan data teman dilindungi oleh **Row Level Security (RLS)** PostgreSQL.
- Pengguna hanya dapat membaca dan memodifikasi data miliknya sendiri (`auth.uid() = user_id`).
- Link publik dibagikan melalui token acak terenkripsi (`share_token`) yang hanya mengekspos data agregat tagihan dan riwayat setoran tanpa data sensitif lainnya.
