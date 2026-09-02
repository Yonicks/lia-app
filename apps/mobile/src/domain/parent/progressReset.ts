import type { TalkiStorage } from '@/services/storage/TalkiStorage';
import { K } from '@/services/storage/keys';

/**
 * index.html 3290-3292 / reset progress — clears learned progress, stats
 * and lastCat. NEVER touches lia:rec:* or lia:custom:*.
 */
export async function resetProgress(storage: TalkiStorage): Promise<void> {
  await storage.remove(K.progress);
  await storage.remove(K.stats);
  await storage.remove(K.lastcat);
}

export const RESET_CLEARS = [K.progress, K.stats, K.lastcat] as const;
export const RESET_KEEPS = ['lia:rec:*', 'lia:custom:*'] as const;

/** index.html 3787 — confirmation copy, plus explicit key names the prompt requires. */
export const RESET_CONFIRM_TEXT =
  'לאפס את כל ההתקדמות? ההקלטות והמילים האישיות יישארו. מומלץ לייצא גיבוי קודם.';
export const RESET_DELETES_TEXT =
  'מוחק: התקדמות, סטטיסטיקות וקטגוריה אחרונה (lia:progress, lia:stats, lia:lastcat).';
export const RESET_KEEPS_TEXT = 'נשאר: הקלטות הקול והמילים האישיות (lia:rec:*, lia:custom:*).';
