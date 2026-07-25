import { ApiClient } from '@mijersey/sdk';
import type { HealthStatus } from '@mijersey/shared-types';

import { env } from '../config/env';

async function getApiStatus(): Promise<HealthStatus> {
  const client = new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL });

  try {
    const health = await client.getHealth();
    return health.status;
  } catch {
    return 'down';
  }
}

export default async function AdminHomePage() {
  const status = await getApiStatus();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-2 p-6 text-center">
      <h1 className="text-3xl font-semibold text-neutral-900">MiJersey Admin</h1>
      <p className="text-neutral-500">Panel administrativo en construcción.</p>
      <p className="text-sm text-neutral-400">Estado de la API: {status}</p>
    </main>
  );
}
