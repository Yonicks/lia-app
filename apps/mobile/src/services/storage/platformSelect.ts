import type { TalkiStorage } from './TalkiStorage';

/**
 * Pure, dependency-free mapping from a platform name to "web" or "native".
 * Kept separate from index.ts/index.web.ts (see those files for why the
 * real runtime selection is done by Metro's platform-extension resolution,
 * not a Platform.OS branch) purely so the mapping itself stays directly
 * unit-testable without importing either real backend — see
 * tests/unit/storage.test.ts, "webStorage is never selected on a native
 * platform".
 */
export function selectStorage(platformOS: string, backends: { web: TalkiStorage; native: TalkiStorage }): TalkiStorage {
  return platformOS === 'web' ? backends.web : backends.native;
}
