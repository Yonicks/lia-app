import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useGlobalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IntroSequence } from '../src/features/intro/IntroSequence';
import { StudioBumper } from '../src/features/intro/studioBumper';
import { DevStorageProbe } from '../src/testing/DevStorageProbe';
import { testIds } from '../src/testing/testIds';

/**
 * Module-level, not component state: this must survive `Bootstrap`
 * re-rendering after the sequence completes, so the intro plays exactly
 * once per process lifetime — legacy has no equivalent because
 * `#gate`/`playIntro()` (index.html 4236-4247) only ever run once per real
 * page load anyway.
 */
let introPlayedThisSession = false;

type Stage = 'bumper' | 'intro' | 'placeholder';

/**
 * The real app entry (`/`). Decides whether to play the opening sequence
 * first — mirrors legacy `introEnabled()` (index.html 4171-4177) with the
 * two escape hatches that matter on this target: `?intro=0` (the
 * tooling/test hatch `tests/test_suite.py` and `openApp()` both rely on)
 * and "already shown this session"; reduced motion is handled a layer
 * down, inside `IntroSequence` itself.
 *
 * Deliberately renders the sequence IN PLACE rather than navigating to a
 * separate route: `router.replace()` to a sibling Stack screen and back
 * left the previous screen visibly on top on the web target (a React
 * Navigation web-transition sizing quirk, confirmed by inspecting the
 * DOM — `intro-root` was present with correct styles the whole time, just
 * not what painted). A single mounted screen that swaps its own body
 * sidesteps that entirely and is simpler besides. `app/intro/index.tsx`
 * still exists as the directly-linkable, isolated variant `intro.spec.ts`
 * exercises for frame-by-frame testing.
 *
 * Phase 7 replaces the `placeholder` stage's body with real Home; until
 * then this is the screen every path in this component ends at.
 */
export default function Bootstrap() {
  const params = useGlobalSearchParams() as { intro?: string };
  const introDisabled = params.intro === '0';
  const [stage, setStage] = useState<Stage>(introDisabled || introPlayedThisSession ? 'placeholder' : 'bumper');

  const advance = useCallback(() => {
    introPlayedThisSession = true;
    setStage((prev) => (prev === 'bumper' ? 'intro' : 'placeholder'));
  }, []);

  if (stage === 'bumper') {
    return <StudioBumper onComplete={advance} />;
  }
  if (stage === 'intro') {
    return <IntroSequence testID={testIds.intro.root} onComplete={advance} />;
  }

  return (
    <SafeAreaView style={styles.root} testID={testIds.bootstrap.root}>
      <View style={styles.center}>
        <Text style={styles.title} testID={testIds.bootstrap.title}>
          Talki Native Migration
        </Text>
        <Text style={styles.subtitle}>Phase 1</Text>
        <DevStorageProbe />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    textAlign: 'center',
  },
});
