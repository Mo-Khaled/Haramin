import type { PrismaClient } from '@prisma/client';

import type { Language, PushMessage } from '../domain/messages.js';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const BATCH_SIZE = 100;

interface ExpoTicket {
  status: 'ok' | 'error';
  details?: { error?: string };
}

type Localized = Record<Language, PushMessage>;

export interface PushTarget {
  token: string;
  language: string;
}

function messageFor(localized: Localized, language: string): PushMessage {
  return language === 'ar' ? localized.ar : localized.en;
}

/** Sends a localized push to every target and removes tokens Expo reports as unregistered. */
export async function sendLocalizedPush(
  prisma: PrismaClient,
  targets: PushTarget[],
  localized: Localized,
  data: Record<string, unknown> = {},
): Promise<void> {
  const valid = targets.filter((t) => t.token.startsWith('ExponentPushToken') || t.token.startsWith('ExpoPushToken'));
  for (let start = 0; start < valid.length; start += BATCH_SIZE) {
    const batch = valid.slice(start, start + BATCH_SIZE);
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(
        batch.map((target) => ({ to: target.token, sound: 'default', data, ...messageFor(localized, target.language) })),
      ),
    });
    if (!response.ok) throw new Error(`Expo push HTTP ${response.status}`);
    const { data: tickets } = (await response.json()) as { data: ExpoTicket[] };
    const dead = batch.filter((_, i) => tickets[i]?.details?.error === 'DeviceNotRegistered').map((t) => t.token);
    if (dead.length) await prisma.deviceToken.deleteMany({ where: { token: { in: dead } } });
  }
}

export async function pushToCustomer(
  prisma: PrismaClient,
  customerId: string,
  localized: Localized,
  data: Record<string, unknown> = {},
): Promise<void> {
  const devices = await prisma.deviceToken.findMany({ where: { shopifyCustomerId: customerId } });
  await sendLocalizedPush(prisma, devices, localized, data);
}
