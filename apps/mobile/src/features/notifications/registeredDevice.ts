import { backend } from '@/lib/backend';
import { reportFailure } from '@/lib/sentry';

let registeredToken: string | null = null;

export function rememberRegisteredDevice(token: string): void {
  registeredToken = token;
}

/** Stops the previous customer's pushes on this phone; failing to reach the backend must never block sign-out. */
export async function unregisterDevice(accessToken: string): Promise<void> {
  const token = registeredToken;
  registeredToken = null;
  if (!token) return;
  await backend.unregisterDevice(accessToken, token).catch(reportFailure);
}
