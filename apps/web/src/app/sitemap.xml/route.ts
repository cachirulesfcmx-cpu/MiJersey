import { env } from '../../config/env';

export const dynamic = 'force-dynamic';

export async function GET() {
  const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/sitemap.xml`, {
    next: { revalidate: 600 },
  });
  const xml = await response.text();
  return new Response(xml, {
    status: response.status,
    headers: { 'Content-Type': 'application/xml' },
  });
}
