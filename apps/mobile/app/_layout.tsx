import { useCallback, useState } from 'react';
import { Stack, useGlobalSearchParams } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { forceRTL } from '../src/design-system/rtl/forceRTL';
import { v3 } from '../src/design-system/theme/colors';
import { useTalkiFonts } from '../src/design-system/theme/useTalkiFonts';
import { IntroSequence } from '../src/features/intro/IntroSequence';
import { StudioBumper } from '../src/features/intro/studioBumper';
import { installE2ERouterBridge } from '../src/testing/e2eRouterBridge';
import { installE2EStorageBridge } from '../src/testing/e2eStorageBridge';
import { installE2EStoreBridge } from '../src/testing/e2eStoreBridge';
import { installE2EVoiceSpyBridge } from '../src/testing/e2eVoiceSpyBridge';
import { testIds } from '../src/testing/testIds';

// Module-level, not inside the component: runs once per bundle load,
// web-only, no-op on native. See e2eStorageBridge.ts /
// e2eVoiceSpyBridge.ts / e2eRouterBridge.ts / e2eStoreBridge.ts for why
// these exist.
installE2EStorageBridge();
installE2EVoiceSpyBridge();
installE2ERouterBridge();
installE2EStoreBridge();
forceRTL();

/**
 * Module-level, not component state: this must survive `RootLayout`
 * re-rendering after the sequence completes, so the intro plays exactly
 * once per process lifetime — legacy has no equivalent because
 * `#gate`/`playIntro()` (index.html 4236-4247) only ever run once per real
 * page load anyway.
 */
let introPlayedThisSession = false;

type OpeningStage = 'bumper' | 'intro' | 'app';

/**
 * The opening sequence lives here, one level above the `Stack`, rather than
 * inside `app/index.tsx` (Phase 6's location) — Phase 7 gives `app/index`
 * to `app/(tabs)/index.tsx` (real Home), and the intro must never be a
 * `router.replace()` target: that was tried for the Phase 6
 * bumper→placeholder handoff and left the previous screen visibly stuck on
 * top on the web target (a React Navigation web-transition quirk — see
 * `app/intro/index.tsx`'s history). Gating here is a pure state swap in one
 * mounted component, exactly like the font-loading gate below it, so no
 * navigation event ever fires for the handoff. Once `stage` reaches `'app'`
 * the real `Stack` mounts and `/` resolves to `app/(tabs)/index.tsx` for
 * the first time.
 */
export default function RootLayout() {
  const fontsLoaded = useTalkiFonts();
  const params = useGlobalSearchParams() as { intro?: string };
  const introDisabled = params.intro === '0';
  const [stage, setStage] = useState<OpeningStage>(
    introDisabled || introPlayedThisSession ? 'app' : 'bumper',
  );

  const advance = useCallback(() => {
    introPlayedThisSession = true;
    setStage((prev) => (prev === 'bumper' ? 'intro' : 'app'));
  }, []);

  if (!fontsLoaded) {
    // A blank/system-font first frame is the exact "silent fallback" the
    // font-bundling requirement guards against — block on load instead.
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: v3.bg }}>
        <ActivityIndicator color={v3.purple600} />
      </View>
    );
  }

  if (stage === 'bumper') {
    return <StudioBumper onComplete={advance} />;
  }
  if (stage === 'intro') {
    return <IntroSequence testID={testIds.intro.root} onComplete={advance} />;
  }

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}
