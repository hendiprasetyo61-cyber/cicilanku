import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { formatRupiah, formatTanggalIndo } from '@/lib/formatters';
import { sendEmailNotification } from '@/lib/webpush';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'cicilanku-cron-secret-12345';

    // Verifikasi cron secret
    if (authHeader !== `Bearer ${cronSecret}`) {
      // Izinkan akses jika dipanggil via Vercel Cron header
      const vercelCron = request.headers.get('x-vercel-cron');
      if (!vercelCron && process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const supabase = createServiceRoleClient();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const results = {
      processedInstallments: 0,
      remindersSentH3: 0,
      remindersSentH1: 0,
      remindersSentH0: 0,
      inactivityRemindersSent: 0,
    };

    // 1. Ambil installment yang belum lunas
    const { data: unpaidInstallments, error: instError } = await supabase
      .from('installments')
      .select(`
        id,
        cicilan_ke,
        jatuh_tempo,
        total_tagihan,
        sudah_dibayar,
        loan:paylater_loans (
          id,
          nama_barang,
          user_id,
          debtor:debtors (
            nama_teman,
            no_hp
          )
        )
      `)
      .neq('status', 'lunas');

    if (!instError && unpaidInstallments) {
      for (const inst of unpaidInstallments as any[]) {
        results.processedInstallments++;
        const dueDate = new Date(inst.jatuh_tempo);
        dueDate.setHours(0, 0, 0, 0);

        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        const sisa = inst.total_tagihan - inst.sudah_dibayar;

        let reminderType: 'h-3' | 'h-1' | 'h-0' | null = null;
        let subject = '';
        let message = '';

        if (diffDays === 3) {
          reminderType = 'h-3';
          subject = `[H-3] Tagihan Shopee PayLater: ${inst.loan.nama_barang}`;
          message = `Cicilan ke-${inst.cicilan_ke} (${inst.loan.nama_barang}) untuk ${inst.loan.debtor.nama_teman} sebesar ${formatRupiah(sisa)} jatuh tempo dalam 3 hari (${formatTanggalIndo(inst.jatuh_tempo)}).`;
          results.remindersSentH3++;
        } else if (diffDays === 1) {
          reminderType = 'h-1';
          subject = `[H-1 Besok] Tagihan Shopee PayLater: ${inst.loan.nama_barang}`;
          message = `Besok jatuh tempo cicilan ke-${inst.cicilan_ke} (${inst.loan.nama_barang}) sebesar ${formatRupiah(sisa)}. Pastikan saldo tersedia atau ingatkan ${inst.loan.debtor.nama_teman}.`;
          results.remindersSentH1++;
        } else if (diffDays === 0) {
          reminderType = 'h-0';
          subject = `[HARI H] Tagihan Shopee PayLater Jatuh Tempo Hari Ini!`;
          message = `Hari ini adalah batas akhir pembayaran cicilan ke-${inst.cicilan_ke} (${inst.loan.nama_barang}) sebesar ${formatRupiah(sisa)}. Segera bayar di Shopee untuk menghindari denda.`;
          results.remindersSentH0++;
        }

        if (reminderType) {
          // Log ke tabel reminders
          await supabase.from('reminders').insert({
            user_id: inst.loan.user_id,
            installment_id: inst.id,
            tipe: reminderType,
            kanal: 'push',
            status: 'terkirim',
            pesan: message,
          });

          // Kirim Email jika dikonfigurasi
          await sendEmailNotification({
            to: 'user@cicilanku.local',
            subject,
            html: `<div style="font-family: sans-serif; padding: 20px;">
              <h2 style="color: #ee4d2d;">Pengingat Cicilan Shopee PayLater</h2>
              <p>${message}</p>
              <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Barang:</strong> ${inst.loan.nama_barang}</p>
                <p><strong>Teman Peminjam:</strong> ${inst.loan.debtor.nama_teman}</p>
                <p><strong>Sisa Tagihan:</strong> ${formatRupiah(sisa)}</p>
                <p><strong>Jatuh Tempo:</strong> ${formatTanggalIndo(inst.jatuh_tempo)}</p>
              </div>
            </div>`,
          });
        }
      }
    }

    // 2. Reminder Inactivity: Teman belum menyetor dalam 30 hari
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const { data: activeLoans } = await supabase
      .from('paylater_loans')
      .select(`
        id,
        nama_barang,
        user_id,
        debtor:debtors (nama_teman),
        debtor_payments (tanggal_terima)
      `)
      .eq('status', 'aktif');

    if (activeLoans) {
      for (const loan of activeLoans as any[]) {
        const payments = loan.debtor_payments || [];
        const hasRecentPayment = payments.some((p: any) => p.tanggal_terima >= thirtyDaysAgo);

        if (!hasRecentPayment && payments.length > 0) {
          results.inactivityRemindersSent++;
          await supabase.from('reminders').insert({
            user_id: loan.user_id,
            tipe: 'inactivity',
            kanal: 'push',
            status: 'terkirim',
            pesan: `Teman (${loan.debtor.nama_teman}) belum menyetor untuk pinjaman ${loan.nama_barang} dalam 30 hari terakhir.`,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
