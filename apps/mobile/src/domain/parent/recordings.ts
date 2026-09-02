import { key } from '../progress/keys';
import type { TalkiWord } from '../types';
import type { TalkiStorage } from '@/services/storage/TalkiStorage';
import { K } from '@/services/storage/keys';

/** Lazy per-category flags — do not scan every lia:rec:* key. */
export async function recordingFlagsForCategory(
  storage: TalkiStorage,
  catId: string,
  items: TalkiWord[],
): Promise<boolean[]> {
  return Promise.all(items.map(async (it) => (await storage.get(K.rec(key(catId, it.word)))) != null));
}

export async function deleteRecording(storage: TalkiStorage, catId: string, word: string): Promise<void> {
  await storage.remove(K.rec(key(catId, word)));
}
