import { useEffect, useState } from 'react';
import { Platform, Pressable, Text } from 'react-native';

import { storage } from '../services/storage';
import { testIds } from './testIds';

const PROBE_KEY = 'lia:__maestro_persistence_probe';

/**
 * Dev-only, native-only Tier 3 hook for
 * apps/mobile/.maestro/persistence.yaml — see phase-03-plan.md's Tier 3 test
 * plan: "write a known progress value through a dev-only trigger". Renders
 * nothing on web (`Platform.OS === 'web'`) or in a production build
 * (`__DEV__ === false`), so it has zero effect on the Tier 2 Playwright
 * screenshot baselines or on anything a real user could ever see. This is
 * NOT the parent area, the backup screen, or any settings UI — Phase 3
 * ships none of those (Phase 12 does) — it is test scaffolding to prove
 * expo-sqlite survives a real process kill, which nothing else in this
 * phase can prove (validation.md §4: "expo-sqlite durability across a
 * genuine process kill, as opposed to a page reload").
 */
export function DevStorageProbe() {
  const [value, setValue] = useState<string | null>('(loading)');

  useEffect(() => {
    let cancelled = false;
    storage.get<string>(PROBE_KEY).then((v) => {
      if (!cancelled) setValue(v);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (Platform.OS === 'web' || !__DEV__) {
    return null;
  }

  return (
    <>
      <Pressable
        testID={testIds.devStorageProbe.writeButton}
        onPress={() => {
          const stamp = `probe-${Date.now()}`;
          void storage.set(PROBE_KEY, stamp).then(() => setValue(stamp));
        }}
      >
        <Text>Write storage probe</Text>
      </Pressable>
      <Text testID={testIds.devStorageProbe.valueLabel}>{value ?? '(none)'}</Text>
    </>
  );
}
