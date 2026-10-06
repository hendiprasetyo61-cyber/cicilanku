import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
    // Memanggil logika penjaga sesi Supabase setiap kali ada halaman yang dibuka
    return await updateSession(request);
}

// Menentukan halaman mana saja yang perlu dijaga oleh middleware
export const config = {
    matcher: [
        /*
         * Mengecualikan jalur internal Next.js agar performa aplikasi tetap cepat:
         * - _next/static (file statis CSS/JS)
         * - _next/image (gambar yang dioptimasi)
         * - favicon.ico (ikon situs)
         * - api (API routes, biarkan API mengurus keamanannya sendiri)
         */
        '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};