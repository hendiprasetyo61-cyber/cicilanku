-- ==============================================================================
-- CICILANKU DATABASE MIGRATION SCRIPT (PostgreSQL / Supabase)
-- Full schema, Indexes, Triggers, and Row-Level Security (RLS) Policies
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. DEBTORS (Teman yang meminjam/memakai limit PayLater)
CREATE TABLE IF NOT EXISTS public.debtors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nama_teman TEXT NOT NULL,
    no_hp TEXT,
    catatan TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for user lookup
CREATE INDEX IF NOT EXISTS idx_debtors_user_id ON public.debtors(user_id);

-- 2. PAYLATER LOANS (Data pinjaman Shopee PayLater untuk teman)
CREATE TABLE IF NOT EXISTS public.paylater_loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    debtor_id UUID NOT NULL REFERENCES public.debtors(id) ON DELETE RESTRICT,
    nama_barang TEXT NOT NULL,
    order_id_shopee TEXT,
    harga_pokok NUMERIC(15, 0) NOT NULL CHECK (harga_pokok > 0),
    bunga_persen_per_bulan NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (bunga_persen_per_bulan >= 0),
    metode_bunga TEXT NOT NULL DEFAULT 'flat' CHECK (metode_bunga IN ('flat', 'efektif')),
    biaya_admin NUMERIC(15, 0) NOT NULL DEFAULT 0 CHECK (biaya_admin >= 0),
    alokasi_admin TEXT NOT NULL DEFAULT 'pertama' CHECK (alokasi_admin IN ('pertama', 'rata')),
    tenor_bulan INT NOT NULL DEFAULT 6 CHECK (tenor_bulan > 0 AND tenor_bulan <= 60),
    tanggal_mulai DATE NOT NULL DEFAULT CURRENT_DATE,
    tanggal_jatuh_tempo INT NOT NULL CHECK (tanggal_jatuh_tempo >= 1 AND tanggal_jatuh_tempo <= 31),
    total_tagihan NUMERIC(15, 0) NOT NULL CHECK (total_tagihan >= harga_pokok),
    status TEXT NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif', 'lunas')),
    share_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_loans_user_id ON public.paylater_loans(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_debtor_id ON public.paylater_loans(debtor_id);
CREATE INDEX IF NOT EXISTS idx_loans_share_token ON public.paylater_loans(share_token);

-- 3. INSTALLMENTS (Jadwal tagihan bulanan Shopee)
CREATE TABLE IF NOT EXISTS public.installments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID NOT NULL REFERENCES public.paylater_loans(id) ON DELETE CASCADE,
    cicilan_ke INT NOT NULL CHECK (cicilan_ke > 0),
    jatuh_tempo DATE NOT NULL,
    pokok NUMERIC(15, 0) NOT NULL CHECK (pokok >= 0),
    bunga NUMERIC(15, 0) NOT NULL DEFAULT 0 CHECK (bunga >= 0),
    total_tagihan NUMERIC(15, 0) NOT NULL CHECK (total_tagihan >= 0),
    sudah_dibayar NUMERIC(15, 0) NOT NULL DEFAULT 0 CHECK (sudah_dibayar >= 0),
    status TEXT NOT NULL DEFAULT 'belum' CHECK (status IN ('belum', 'sebagian', 'lunas', 'telat')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_loan_installment UNIQUE (loan_id, cicilan_ke)
);

CREATE INDEX IF NOT EXISTS idx_installments_loan_id ON public.installments(loan_id);
CREATE INDEX IF NOT EXISTS idx_installments_jatuh_tempo ON public.installments(jatuh_tempo);
CREATE INDEX IF NOT EXISTS idx_installments_status ON public.installments(status);

-- 4. SHOPEE PAYMENTS (Pembayaran oleh pemilik akun ke Shopee)
CREATE TABLE IF NOT EXISTS public.shopee_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    installment_id UUID NOT NULL REFERENCES public.installments(id) ON DELETE CASCADE,
    tanggal_bayar DATE NOT NULL DEFAULT CURRENT_DATE,
    jumlah NUMERIC(15, 0) NOT NULL CHECK (jumlah > 0),
    catatan TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_shopee_payments_installment ON public.shopee_payments(installment_id);

-- 5. DEBTOR PAYMENTS (Setoran dari teman ke pemilik akun)
CREATE TABLE IF NOT EXISTS public.debtor_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID NOT NULL REFERENCES public.paylater_loans(id) ON DELETE CASCADE,
    tanggal_terima DATE NOT NULL DEFAULT CURRENT_DATE,
    jumlah NUMERIC(15, 0) NOT NULL CHECK (jumlah > 0),
    metode TEXT NOT NULL DEFAULT 'transfer' CHECK (metode IN ('transfer', 'tunai')),
    catatan TEXT,
    bukti_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_debtor_payments_loan_id ON public.debtor_payments(loan_id);
CREATE INDEX IF NOT EXISTS idx_debtor_payments_tanggal ON public.debtor_payments(tanggal_terima);

-- 6. REMINDERS (Log & Riwayat Peringatan Notifikasi)
CREATE TABLE IF NOT EXISTS public.reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    installment_id UUID REFERENCES public.installments(id) ON DELETE CASCADE,
    tipe TEXT NOT NULL DEFAULT 'h-3' CHECK (tipe IN ('h-3', 'h-1', 'h-0', 'inactivity')),
    waktu_kirim TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    kanal TEXT NOT NULL CHECK (kanal IN ('push', 'email')),
    status TEXT NOT NULL DEFAULT 'terkirim' CHECK (status IN ('antrean', 'terkirim', 'gagal')),
    pesan TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON public.reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_installment_id ON public.reminders(installment_id);

-- 7. PUSH SUBSCRIPTIONS (Web Push Subscription pengguna)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_push_subs_user_id ON public.push_subscriptions(user_id);

-- 8. USER NOTIFICATION SETTINGS (Preferensi Pengguna)
CREATE TABLE IF NOT EXISTS public.user_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    remind_h3 BOOLEAN NOT NULL DEFAULT true,
    remind_h1 BOOLEAN NOT NULL DEFAULT true,
    remind_h0 BOOLEAN NOT NULL DEFAULT true,
    remind_inactivity BOOLEAN NOT NULL DEFAULT true,
    reminder_hour INT NOT NULL DEFAULT 9 CHECK (reminder_hour >= 0 AND reminder_hour <= 23),
    reminder_minute INT NOT NULL DEFAULT 0 CHECK (reminder_minute >= 0 AND reminder_minute <= 59),
    enable_push BOOLEAN NOT NULL DEFAULT true,
    enable_email BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- DATABASE TRIGGERS & FUNCTIONS FOR AUTOMATIC RECALCULATION
-- ==============================================================================

-- Function 1: Recalculate Installment payment & status when shopee_payments changes
CREATE OR REPLACE FUNCTION public.fn_sync_installment_payment()
RETURNS TRIGGER AS $$
DECLARE
    target_installment_id UUID;
    total_paid NUMERIC(15, 0);
    target_total NUMERIC(15, 0);
    target_due_date DATE;
    new_status TEXT;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_installment_id := OLD.installment_id;
    ELSE
        target_installment_id := NEW.installment_id;
    END IF;

    -- Calculate sum of payments for this installment
    SELECT COALESCE(SUM(jumlah), 0)
    INTO total_paid
    FROM public.shopee_payments
    WHERE installment_id = target_installment_id;

    -- Get total tagihan and due date
    SELECT total_tagihan, jatuh_tempo
    INTO target_total, target_due_date
    FROM public.installments
    WHERE id = target_installment_id;

    -- Determine new status
    IF total_paid >= target_total THEN
        new_status := 'lunas';
    ELSIF total_paid > 0 THEN
        IF CURRENT_DATE > target_due_date THEN
            new_status := 'telat';
        ELSE
            new_status := 'sebagian';
        END IF;
    ELSE
        IF CURRENT_DATE > target_due_date THEN
            new_status := 'telat';
        ELSE
            new_status := 'belum';
        END IF;
    END IF;

    -- Update installment
    UPDATE public.installments
    SET sudah_dibayar = total_paid,
        status = new_status,
        updated_at = timezone('utc'::text, now())
    WHERE id = target_installment_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_shopee_payments ON public.shopee_payments;
CREATE TRIGGER trg_sync_shopee_payments
AFTER INSERT OR UPDATE OR DELETE ON public.shopee_payments
FOR EACH ROW EXECUTE FUNCTION public.fn_sync_installment_payment();

-- Function 2: Recalculate loan status ('aktif' vs 'lunas')
CREATE OR REPLACE FUNCTION public.fn_sync_loan_status()
RETURNS TRIGGER AS $$
DECLARE
    target_loan_id UUID;
    loan_total NUMERIC(15, 0);
    debtor_total_paid NUMERIC(15, 0);
    unpaid_installments_count INT;
BEGIN
    IF TG_TABLE_NAME = 'debtor_payments' THEN
        IF (TG_OP = 'DELETE') THEN
            target_loan_id := OLD.loan_id;
        ELSE
            target_loan_id := NEW.loan_id;
        END IF;
    ELSIF TG_TABLE_NAME = 'installments' THEN
        IF (TG_OP = 'DELETE') THEN
            target_loan_id := OLD.loan_id;
        ELSE
            target_loan_id := NEW.loan_id;
        END IF;
    END IF;

    -- Fetch loan total
    SELECT total_tagihan INTO loan_total
    FROM public.paylater_loans
    WHERE id = target_loan_id;

    -- Fetch total payments from debtor
    SELECT COALESCE(SUM(jumlah), 0) INTO debtor_total_paid
    FROM public.debtor_payments
    WHERE loan_id = target_loan_id;

    -- Count installments not marked 'lunas'
    SELECT COUNT(*) INTO unpaid_installments_count
    FROM public.installments
    WHERE loan_id = target_loan_id AND status != 'lunas';

    -- Loan is fully settled if all installments are lunas AND debtor has paid off the full loan debt
    IF unpaid_installments_count = 0 AND debtor_total_paid >= loan_total THEN
        UPDATE public.paylater_loans
        SET status = 'lunas', updated_at = timezone('utc'::text, now())
        WHERE id = target_loan_id;
    ELSE
        UPDATE public.paylater_loans
        SET status = 'aktif', updated_at = timezone('utc'::text, now())
        WHERE id = target_loan_id;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_loan_from_debtor_payments ON public.debtor_payments;
CREATE TRIGGER trg_sync_loan_from_debtor_payments
AFTER INSERT OR UPDATE OR DELETE ON public.debtor_payments
FOR EACH ROW EXECUTE FUNCTION public.fn_sync_loan_status();

DROP TRIGGER IF EXISTS trg_sync_loan_from_installments ON public.installments;
CREATE TRIGGER trg_sync_loan_from_installments
AFTER UPDATE OF status ON public.installments
FOR EACH ROW EXECUTE FUNCTION public.fn_sync_loan_status();

-- Function 3: Auto-create default settings on user registration
CREATE OR REPLACE FUNCTION public.fn_handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.fn_handle_new_user();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.debtors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paylater_loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debtor_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- 1. DEBTORS Policies
CREATE POLICY "Users can manage their own debtors"
ON public.debtors
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2. PAYLATER LOANS Policies
CREATE POLICY "Users can manage their own loans"
ON public.paylater_loans
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Public read access for shared loans via share_token
CREATE POLICY "Public read for loans by share_token"
ON public.paylater_loans
FOR SELECT
USING (share_token IS NOT NULL);

-- 3. INSTALLMENTS Policies
CREATE POLICY "Users can manage installments through loan ownership"
ON public.installments
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.paylater_loans
        WHERE public.paylater_loans.id = installments.loan_id
        AND public.paylater_loans.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.paylater_loans
        WHERE public.paylater_loans.id = installments.loan_id
        AND public.paylater_loans.user_id = auth.uid()
    )
);

-- Public read for installments of shared loan
CREATE POLICY "Public read for installments by loan share_token"
ON public.installments
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.paylater_loans
        WHERE public.paylater_loans.id = installments.loan_id
        AND public.paylater_loans.share_token IS NOT NULL
    )
);

-- 4. SHOPEE PAYMENTS Policies
CREATE POLICY "Users can manage shopee payments through installment & loan ownership"
ON public.shopee_payments
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.installments
        JOIN public.paylater_loans ON public.paylater_loans.id = installments.loan_id
        WHERE installments.id = shopee_payments.installment_id
        AND public.paylater_loans.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.installments
        JOIN public.paylater_loans ON public.paylater_loans.id = installments.loan_id
        WHERE installments.id = shopee_payments.installment_id
        AND public.paylater_loans.user_id = auth.uid()
    )
);

-- 5. DEBTOR PAYMENTS Policies
CREATE POLICY "Users can manage debtor payments through loan ownership"
ON public.debtor_payments
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.paylater_loans
        WHERE public.paylater_loans.id = debtor_payments.loan_id
        AND public.paylater_loans.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.paylater_loans
        WHERE public.paylater_loans.id = debtor_payments.loan_id
        AND public.paylater_loans.user_id = auth.uid()
    )
);

-- Public read for debtor payments of shared loan
CREATE POLICY "Public read for debtor payments by share_token"
ON public.debtor_payments
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.paylater_loans
        WHERE public.paylater_loans.id = debtor_payments.loan_id
        AND public.paylater_loans.share_token IS NOT NULL
    )
);

-- 6. REMINDERS Policies
CREATE POLICY "Users can manage their own reminders"
ON public.reminders
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 7. PUSH SUBSCRIPTIONS Policies
CREATE POLICY "Users can manage their own push subscriptions"
ON public.push_subscriptions
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 8. USER SETTINGS Policies
CREATE POLICY "Users can manage their own settings"
ON public.user_settings
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
