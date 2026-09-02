import type { TalkiWord } from '../types';
import { allCats } from '../vocabulary/allCats';
import { totalWords } from '../progress/totals';
import type { TalkiStorage } from '@/services/storage/TalkiStorage';
import { K } from '@/services/storage/keys';

export function newCustomId(): string {
  return `cw-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

export async function saveCustomWord(storage: TalkiStorage, word: TalkiWord): Promise<TalkiWord[]> {
  const id = word.id ?? newCustomId();
  const next: TalkiWord = { ...word, id };
  const index = (await storage.get<string[]>(K.customIndex)) ?? [];
  if (!index.includes(id)) index.push(id);
  await storage.set(K.custom(id), next);
  await storage.set(K.customIndex, index);
  return loadCustomWords(storage);
}

export async function deleteCustomWord(storage: TalkiStorage, id: string): Promise<TalkiWord[]> {
  const index = ((await storage.get<string[]>(K.customIndex)) ?? []).filter((x) => x !== id);
  await storage.remove(K.custom(id));
  await storage.set(K.customIndex, index);
  return loadCustomWords(storage);
}

export async function loadCustomWords(storage: TalkiStorage): Promise<TalkiWord[]> {
  const index = (await storage.get<string[]>(K.customIndex)) ?? [];
  const loaded = await Promise.all(index.map((id) => storage.get<TalkiWord>(K.custom(id))));
  return loaded.filter((w): w is TalkiWord => !!w);
}

export function customAppearsInMine(custom: TalkiWord[]): boolean {
  const mine = allCats(custom).find((c) => c.id === 'mine');
  return !!mine && mine.items.length === custom.length;
}

export function customCountsInTotal(custom: TalkiWord[]): boolean {
  return totalWords(custom) >= custom.length;
}
