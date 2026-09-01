import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { IntroSequence } from '@/features/intro/IntroSequence';
import { StudioBumper } from '@/features/intro/studioBumper';
import { testIds } from '@/testing/testIds';

type Stage = 'bumper' | 'intro' | 'done';

/**
 * A directly-linkable route for the opening sequence, isolated from the
 * root route's session-flag gate in `app/index.tsx` — the same
 * "dev-linkable, deterministic component under test" pattern `/dev/gallery`
 * and `/dev/audio-lab` already use, which is what lets `intro.spec.ts`
 * navigate here via `window.__talkiRouterE2E` and capture frames without
 * the root route's one-shot-per-session logic in the way.
 *
 * Renders the "next screen is interactive" hand-off as a plain in-place
 * marker rather than a real `router` navigation: an earlier version of
 * this file called `router.replace('/')` on completion, but React
 * Navigation's web Stack left the outgoing screen visibly painted on top
 * during the transition (confirmed by inspecting the DOM — the new
 * screen's content was present with correct computed styles the whole
 * time, it simply never painted). Staying on one mounted screen and
 * swapping its body, exactly like `app/index.tsx` does for the real boot
 * flow, sidesteps that entirely.
 */
export default function IntroRoute() {
  const [stage, setStage] = useState<Stage>('bumper');

  const advance = useCallback(() => {
    setStage((prev) => (prev === 'bumper' ? 'intro' : 'done'));
  }, []);

  if (stage === 'bumper') {
    return <StudioBumper onComplete={advance} />;
  }
  if (stage === 'intro') {
    return <IntroSequence testID={testIds.intro.root} onComplete={advance} />;
  }

  return (
    <View style={styles.root} testID="intro-next-route-placeholder">
      <Text>Home placeholder — Phase 7</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
});
