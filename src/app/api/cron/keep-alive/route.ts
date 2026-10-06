import { NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase/server';

export async function GET(request: Request) {
    // 1. Keamanan: Memastikan yang memanggil API ini hanya Vercel (bukan orang asing)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Tidak Ada Akses (Unauthorized)', { status: 401 });
    }

    try {
        // 2. Membuka koneksi ke Supabase
        const supabase = await createClientServer();

        // 3. Melakukan aktivitas ringan (membaca 1 baris data pengaturan) agar database terbangun
        const { data, error } = await supabase
            .from('user_settings')
            .select('user_id')
            .limit(1);

        if (error) throw error;

        // 4. Memberikan laporan sukses
        return NextResponse.json({
            success: true,
            message: 'Berhasil menyapa Supabase! Database aman dari pause.'
        });
    } catch (err: any) {
        return NextResponse.json({ error: err?.message || 'Gagal menyapa database' }, { status: 500 });
    }
}