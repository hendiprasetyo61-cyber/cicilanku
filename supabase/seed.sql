-- ==============================================================================
-- CICILANKU SEED DATA CONTOH
-- Skenario: Pembelian Smartphone Rp 3.000.000, Tenor 6 Bulan, Bunga 0% (Shopee PayLater)
-- Pemilik akun mencicil ke Shopee tiap bulan Rp 500.000.
-- Teman (Budi Santoso) mencicil ke pemilik akun dengan nominal tidak beraturan.
-- ==============================================================================

DO $$
DECLARE
    demo_user_id UUID;
    v_debtor_id UUID := '11111111-1111-1111-1111-111111111111';
    v_loan_id UUID := '22222222-2222-2222-2222-222222222222';
    v_inst_1 UUID := '33333333-3333-3333-3333-333333333301';
    v_inst_2 UUID := '33333333-3333-3333-3333-333333333302';
    v_inst_3 UUID := '33333333-3333-3333-3333-333333333303';
    v_inst_4 UUID := '33333333-3333-3333-3333-333333333304';
    v_inst_5 UUID := '33333333-3333-3333-3333-333333333305';
    v_inst_6 UUID := '33333333-3333-3333-3333-333333333306';
    base_date DATE := CURRENT_DATE - INTERVAL '60 days';
BEGIN
    -- Ambil user pertama yang ada di auth.users jika ada, atau buat fallback UUID
    SELECT id INTO demo_user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;
    
    IF demo_user_id IS NULL THEN
        demo_user_id := '00000000-0000-0000-0000-000000000001';
    END IF;

    -- 1. Insert Debtor (Teman)
    INSERT INTO public.debtors (id, user_id, nama_teman, no_hp, catatan, created_at)
    VALUES (
        v_debtor_id,
        demo_user_id,
        'Budi Santoso',
        '081234567890',
        'Teman kantor divisi Finance. Pakai limit SPayLater untuk beli HP kerja.',
        base_date
    ) ON CONFLICT (id) DO NOTHING;

    -- 2. Insert PayLater Loan
    -- HP Samsung Galaxy A15 Rp 3.000.000, 6 bulan, bunga 0%, admin 0
    INSERT INTO public.paylater_loans (
        id, user_id, debtor_id, nama_barang, order_id_shopee,
        harga_pokok, bunga_persen_per_bulan, metode_bunga, biaya_admin, alokasi_admin,
        tenor_bulan, tanggal_mulai, tanggal_jatuh_tempo, total_tagihan, status, share_token, created_at
    )
    VALUES (
        v_loan_id,
        demo_user_id,
        v_debtor_id,
        'Samsung Galaxy A15 5G',
        '241005SPAYL99281',
        3000000,
        0,
        'flat',
        0,
        'pertama',
        6,
        base_date,
        15, -- Jatuh tempo tanggal 15 setiap bulan
        3000000,
        'aktif',
        'demo-budi-hp-3jt-share',
        base_date
    ) ON CONFLICT (id) DO NOTHING;

    -- 3. Insert 6 Installments (Jadwal Tagihan Shopee: Rp 500.000 / bulan)
    INSERT INTO public.installments (id, loan_id, cicilan_ke, jatuh_tempo, pokok, bunga, total_tagihan, sudah_dibayar, status)
    VALUES
        -- Bulan 1: Lunas
        (v_inst_1, v_loan_id, 1, base_date + INTERVAL '15 days', 500000, 0, 500000, 500000, 'lunas'),
        -- Bulan 2: Lunas
        (v_inst_2, v_loan_id, 2, base_date + INTERVAL '45 days', 500000, 0, 500000, 500000, 'lunas'),
        -- Bulan 3: Telat / Sebagian / Belum (jatuh tempo mendekati sekarang)
        (v_inst_3, v_loan_id, 3, base_date + INTERVAL '75 days', 500000, 0, 500000, 200000, 'sebagian'),
        -- Bulan 4: Belum
        (v_inst_4, v_loan_id, 4, base_date + INTERVAL '105 days', 500000, 0, 500000, 0, 'belum'),
        -- Bulan 5: Belum
        (v_inst_5, v_loan_id, 5, base_date + INTERVAL '135 days', 500000, 0, 500000, 0, 'belum'),
        -- Bulan 6: Belum
        (v_inst_6, v_loan_id, 6, base_date + INTERVAL '165 days', 500000, 0, 500000, 0, 'belum')
    ON CONFLICT (id) DO NOTHING;

    -- 4. Pembayaran Pemilik Akun ke Shopee
    INSERT INTO public.shopee_payments (installment_id, tanggal_bayar, jumlah, catatan)
    VALUES
        (v_inst_1, base_date + INTERVAL '14 days', 500000, 'Bayar cicilan ke-1 lewat BCA Virtual Account'),
        (v_inst_2, base_date + INTERVAL '44 days', 500000, 'Bayar cicilan ke-2 lewat ShopeePay Saldo'),
        (v_inst_3, base_date + INTERVAL '70 days', 200000, 'Cicil sebagian cicilan ke-3')
    ON CONFLICT DO NOTHING;

    -- 5. Riwayat Setoran Teman (Budi) - Nominal Bebas & Tidak Beraturan
    -- Total harus bayar Rp 3.000.000
    -- Setoran 1: Rp 350.000 (transfer via BCA)
    -- Setoran 2: Rp 500.000 (transfer via Seabank)
    -- Setoran 3: Rp 150.000 (tunai pas ketemu makan siang)
    -- Total setor Budi: Rp 1.000.000 (Sisa utang Budi: Rp 2.000.000)
    -- Total dibayar pemilik ke Shopee: Rp 1.200.000
    -- Posisi kas pemilik: Rp 1.000.000 - Rp 1.200.000 = -Rp 200.000 (Pemilik sedang menalangi Rp 200.000)
    INSERT INTO public.debtor_payments (loan_id, tanggal_terima, jumlah, metode, catatan)
    VALUES
        (v_loan_id, base_date + INTERVAL '10 days', 350000, 'transfer', 'Transfer via BCA - nyicil pertama'),
        (v_loan_id, base_date + INTERVAL '30 days', 500000, 'transfer', 'Transfer pas gajian bulan pertama'),
        (v_loan_id, base_date + INTERVAL '50 days', 150000, 'tunai', 'Uang cash pas ketemu di kantin')
    ON CONFLICT DO NOTHING;

END $$;
