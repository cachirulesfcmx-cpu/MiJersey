import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { env } from './config/env';

export const config = {
  matcher: ['/((?!_next|api|sitemap.xml|robots.txt|.*\\..*).*)'],
};

interface ResolvedRedirect {
  toPath: string;
  statusCode: number;
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  try {
    const response = await fetch(
      `${env.NEXT_PUBLIC_API_URL}/redirects/resolve?path=${encodeURIComponent(pathname)}`,
    );
    if (response.ok) {
      const redirect = (await response.json()) as ResolvedRedirect | null;
      if (redirect) {
        const destination = request.nextUrl.clone();
        destination.pathname = redirect.toPath;
        destination.search = search;
        return NextResponse.redirect(destination, redirect.statusCode);
      }
    }
  } catch {
    // Si el servicio de redirecciones no responde, se sirve la ruta normalmente.
  }

  return NextResponse.next();
}
