import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
    // Memanggil logika penjaga yang kita buat di langkah 1
    return await updateSession(request);
}

// Menentukan halaman mana saja yang perlu dijaga oleh middleware
export const config = {
    matcher: [
        /*
         * Mengecualikan jalur internal Next.js agar aplikasi tidak menjadi lambat:
         * - _next/static (file statis)
         * - _next/image (gambar)
         * - favicon.ico (ikon situs)
         * - api (API routes, biarkan API mengurus keamanannya sendiri)
         */
        '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};