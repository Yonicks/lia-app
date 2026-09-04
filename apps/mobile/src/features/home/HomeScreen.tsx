import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import { ToastHost } from '@/components/shell';
import { LandscapeScreen, landscapeTokens } from '@/design-system/landscape';
import { useLandscapeLayout } from '@/design-system/responsive/useLandscapeLayout';
import { categoryHref } from '@/domain/navigation/routes';
import type { CategoryId } from '@/domain/types';
import { LandscapeHubFrame } from '@/features/shell/LandscapeHubFrame';
import { useGuardedPush } from '@/hooks/useGuardedPush';
import { useParentBrand } from '@/hooks/useParentBrand';
import { useSettingsStore } from '@/state/settingsStore';
import { DevStorageProbe } from '@/testing/DevStorageProbe';
import { testIds } from '@/testing/testIds';

import { ContinueLearningHero } from './ContinueLearningHero';
import { HomeCategoryStrip } from './HomeCategoryStrip';
import { useHomeData } from './useHomeData';

/**
 * Landscape Home hub (Phase 20).
 *
 * Composition (matches `docs/design/landscape/reference/home.png`):
 *   world background + top chrome + side nav (LandscapeHubFrame)
 *   welcome/progress hero (LandscapeHeroPanel via ContinueLearningHero)
 *   one-row category strip (horizontal scroll — all categories reachable)
 *
 * UX invention vs portrait Home: the former practice/games rows are folded
 * into Phase 19 side-nav hub entry (Practice / Games). Featured shortcuts
 * remain reachable from those hubs; Home itself no longer hosts a vertical
 * practice/games stack so the landscape viewport stays single-screen.
 */
export function HomeScreen() {
  const push = useGuardedPush();
  const layout = useLandscapeLayout();
  const tokens = landscapeTokens(layout.deviceClass, layout.uiScale);
  const data = useHomeData();
  const { settings, toggleMusic } = useSettingsStore();
  const parent = useParentBrand();

  const openCategory = useCallback(
    (id: CategoryId) => {
      push(categoryHref(id));
    },
    [push],
  );

  if (!data.ready) {
    return <LandscapeScreen testID={testIds.home.root}>{null}</LandscapeScreen>;
  }

  return (
    <LandscapeHubFrame
      hub="home"
      testID={testIds.home.root}
      points={data.points}
      musicOn={settings.music}
      onToggleMusic={() => void toggleMusic()}
      onBrandLongPress={parent.onBrandLongPress}
      onBrandShortPress={parent.onBrandShortPress}
    >
      <ToastHost message={parent.toast} onHide={parent.dismissToast} testID={testIds.parent.toast} />
      <View style={[styles.body, { gap: tokens.gap }]}>
        {data.hero ? (
          <ContinueLearningHero
            category={data.hero}
            learned={data.heroLearned}
            points={data.points}
            onContinue={() => openCategory(data.hero!.id)}
          />
        ) : null}
        <HomeCategoryStrip categories={data.categories} onOpen={openCategory} />
        <DevStorageProbe />
      </View>
    </LandscapeHubFrame>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    minHeight: 0,
    justifyContent: 'space-between',
  },
});
