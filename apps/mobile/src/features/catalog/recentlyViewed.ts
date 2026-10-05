import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'haramain.recentlyViewed';
export const MAX_RECENT = 12;

/** Moves `productId` to the front, dropping duplicates and anything past the limit. */
export function withRecent(ids: string[], productId: string, max = MAX_RECENT): string[] {
  return [productId, ...ids.filter((id) => id !== productId)].slice(0, max);
}

export async function loadRecentlyViewed(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as string[]) : [];
}

export async function recordView(productId: string): Promise<string[]> {
  const next = withRecent(await loadRecentlyViewed(), productId);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
