import { sqliteKvStorage } from './sqliteKvStorage';
import type { TalkiStorage } from './TalkiStorage';

/**
 * The native entry point (iOS/Android, and Metro's fallback for any
 * platform without a more specific file). `index.web.ts` is the web entry
 * point.
 *
 * Metro resolves `.web.ts` ahead of the bare `.ts` file when bundling for
 * web, and vice versa is never even considered for a native build — so
 * this file, and everything it imports (expo-sqlite/kv-store), is never
 * part of the web bundle, and webStorage.ts is never part of a native
 * bundle. That is a stronger guarantee than a runtime `Platform.OS`
 * branch in a single shared file: a first attempt at this file imported
 * both backends unconditionally and picked one with `Platform.OS`, which
 * compiled the whole app but broke `expo export --platform web` — Metro's
 * web bundler tried to resolve expo-sqlite's web worker's
 * `wa-sqlite.wasm` asset (an ExpoSQLite-web implementation detail that is
 * never actually reached, since `storage/index.web.ts` never selects
 * sqliteKvStorage) and failed, because `.wasm` was never meant to be an
 * asset the shared web bundle needs at all. Splitting by file makes the
 * unreachable branch unreachable at bundle time, not just at runtime — see
 * "Deviations from the phase plan" in phase-03-report.md.
 */
export const storage: TalkiStorage = sqliteKvStorage;

export type { TalkiStorage } from './TalkiStorage';
export { isRecordingKey, K, REC_KEY_PREFIX } from './keys';
export { selectStorage } from './platformSelect';
