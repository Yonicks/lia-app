import type { TalkiStorage } from './TalkiStorage';
import { webStorage } from './webStorage';

/**
 * The web entry point — Metro selects this file over the bare `index.ts`
 * when bundling for the `web` platform. See index.ts for why platform
 * selection is done by file, not by a runtime `Platform.OS` branch.
 *
 * webStorage (IndexedDB) exists only because the Expo web target is a
 * Playwright test surface (standing rule: "THE WEB TARGET IS A TEST
 * SURFACE. It is never shipped."). Since this file is reachable only from
 * a web bundle, sqliteKvStorage.ts — and expo-sqlite itself — is
 * structurally excluded from ever loading here.
 */
export const storage: TalkiStorage = webStorage;

export type { TalkiStorage } from './TalkiStorage';
export { isRecordingKey, K, REC_KEY_PREFIX } from './keys';
export { selectStorage } from './platformSelect';
