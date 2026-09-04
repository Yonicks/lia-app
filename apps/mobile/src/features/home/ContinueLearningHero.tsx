import { Image, StyleSheet, View } from 'react-native';

import { brand, categoryArt, homeAssets } from '@/design-system/assets';
import { TalkiButton, TalkiHeading, TalkiProgress, TalkiText } from '@/design-system/components';
import { useDevice } from '@/design-system/responsive/useDevice';
import { radii } from '@/design-system/theme/radii';
import { shadowCard } from '@/design-system/theme/shadows';
import { v2, v3 } from '@/design-system/theme/colors';
import type { CategoryId, TalkiCategory } from '@/domain/types';
import { STAR_STEP, wordsToNextStar } from '@/domain/progress/stars';
import { plain } from '@/domain/vocabulary/niqqud';
import { testIds } from '@/testing/testIds';

export interface ContinueLearningHeroProps {
  category: TalkiCategory;
  learned: number;
  points: number;
  onContinue: () => void;
}

/**
 * index.html `homeHero()` (1427-1462). Two visual states, selected by
 * `learned.size === 0` (NOT by `currentCategory()` returning null — that
 * function never returns null once categories exist):
 *
 *   fresh      "היי כאן דברי" welcome, no tile / bar / numbers
 *   returning  "ממשיכים עם" + category tile + this-category progress
 *
 * Visual arrangement follows `talki-home-hero-mockup.png` and the
 * `talki-hero-scene-*.webp` / `talki-hero-star.webp` art. Behaviour
 * (which category the CTA opens, when each state fires) comes from the
 * code, per phase-07 standing rules.
 */
export function ContinueLearningHero({ category, learned, points, onContinue }: ContinueLearningHeroProps) {
  const { deviceClass } = useDevice();
  const fresh = points === 0;
  const total = category.items.length;
  const progress = total > 0 ? learned / total : 0;
  const remaining = wordsToNextStar(points);
  const heroTile = category.id === 'mine' ? brand.starMark : categoryArt[category.id as Exclude<CategoryId, 'mine'>];
  const scene =
    deviceClass === 'tablet' || deviceClass === 'largeTablet' ? homeAssets.heroSceneWide : homeAssets.heroSceneCompact;

  return (
    <View testID={testIds.home.hero} style={[styles.card, shadowCard]}>
      <Image source={scene} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <View style={styles.overlay} />
      <View style={styles.content}>
        {fresh ? (
          <>
            <TalkiHeading level={1} color={v3.surface}>
              היי כאן דברי
            </TalkiHeading>
            <TalkiText color={v3.surface} weight="semibold">
              לומדים מילים, מתרגלים ומדברים בביטחון
            </TalkiText>
            <TalkiButton
              testID={testIds.home.heroContinue}
              label="מתחילים ללמוד"
              variant="secondary"
              onPress={onContinue}
              style={styles.button}
            />
          </>
        ) : (
          <>
            <TalkiHeading level={1} color={v3.surface}>
              ממשיכים עם
            </TalkiHeading>
            <View style={styles.catRow}>
              {heroTile ? <Image source={heroTile} style={styles.catTile} resizeMode="contain" /> : null}
              <TalkiHeading level={2} color={v3.surface}>
                {plain(category.title)}
              </TalkiHeading>
            </View>
            <TalkiText color={v3.surface}>
              עוד {Math.min(remaining, STAR_STEP)} מילים לכוכב הבא
            </TalkiText>
            <View style={styles.progressRow}>
              <View style={styles.progressWrap}>
                <TalkiProgress value={progress} />
              </View>
              <TalkiText color={v3.surface} weight="bold">
                {learned}/{total}
              </TalkiText>
            </View>
            <TalkiButton
              testID={testIds.home.heroContinue}
              label="המשך ללמוד"
              variant="secondary"
              onPress={onContinue}
              style={styles.button}
            />
          </>
        )}
      </View>
      <Image source={homeAssets.heroStar} style={styles.star} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.hero,
    overflow: 'hidden',
    minHeight: 220,
    borderWidth: 3,
    borderColor: v2.line,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    start: 0,
    end: 0,
    backgroundColor: 'rgba(76,29,149,0.38)',
  },
  content: {
    padding: 20,
    gap: 8,
    maxWidth: '72%',
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  catTile: {
    width: 40,
    height: 40,
    borderRadius: 12,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressWrap: {
    flex: 1,
  },
  button: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  star: {
    position: 'absolute',
    insetInlineEnd: 4,
    bottom: 4,
    width: 96,
    height: 96,
  },
});
