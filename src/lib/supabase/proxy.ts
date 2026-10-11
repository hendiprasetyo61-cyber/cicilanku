import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// File PWA & aset publik: JANGAN pernah diblokir/dialihkan ke /login
const PUBLIC_FILES = new Set([
  '/sw.js',
  '/manifest.json',
  '/favicon.ico',
  '/robots.txt',
]);

function isPublicAsset(pathname: string) {
  return (
    PUBLIC_FILES.has(pathname) ||
    pathname.startsWith('/icon-') ||
    pathname.startsWith('/screenshot-') ||
    pathname.startsWith('/apple-touch-icon') ||
    /\.(?:svg|png|jpg|jpeg|gif|webp|ico)$/.test(pathname)
  );
}

// Halaman khusus tamu: kalau sudah login, dialihkan ke dashboard
const GUEST_ONLY_ROUTES = ['/login', '/register'];

// Halaman yang boleh dibuka siapa saja
const OPEN_ROUTES = ['/auth', '/share'];

const startsWithAny = (pathname: string, routes: string[]) =>
  routes.some((r) => pathname === r || pathname.startsWith(`${r}/`));

function redirectTo(
  request: NextRequest,
  pathname: string,
  sessionResponse: NextResponse
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = '';
  const redirect = NextResponse.redirect(url);
  // Bawa cookie sesi yang mungkin baru di-refresh
  sessionResponse.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Lewati semua pengecekan untuk file PWA/aset
  if (isPublicAsset(pathname)) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

  // Jangan blokir jika masih memakai placeholder Supabase
  if (supabaseUrl.includes('placeholder')) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: { name: string; value: string; options: CookieOptions }[]
      ) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isGuestOnly = startsWithAny(pathname, GUEST_ONLY_ROUTES);
  const isOpen = startsWithAny(pathname, OPEN_ROUTES);

  // Belum login & bukan halaman auth/terbuka → ke /login
  if (!user && !isGuestOnly && !isOpen) {
    return redirectTo(request, '/login', response);
  }

  // Sudah login tapi buka /login atau /register → ke dashboard
  if (user && isGuestOnly) {
    return redirectTo(request, '/', response);
  }

  return response;
}