import { env } from '../../config/env';

export const dynamic = 'force-dynamic';

export async function GET() {
  const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/robots.txt`, {
    next: { revalidate: 600 },
  });
  const text = await response.text();
  return new Response(text, {
    status: response.status,
    headers: { 'Content-Type': 'text/plain' },
  });
}
