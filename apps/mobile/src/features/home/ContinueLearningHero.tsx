import { homeAssets } from '@/design-system/assets';
import { LandscapeHeroPanel } from '@/design-system/landscape';
import type { TalkiCategory } from '@/domain/types';
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
 * Landscape Home welcome / continue-learning hero (Phase 20).
 *
 * Behaviour still matches legacy `homeHero()`:
 *   fresh      learned.size === 0 → welcome copy, no progress bar
 *   returning  "ממשיכים עם" + category title + this-category progress
 *
 * Visual composition uses `LandscapeHeroPanel` + `homeAssets.heroStar`
 * against the world background (no embedded hero-scene card).
 */
export function ContinueLearningHero({ category, learned, points, onContinue }: ContinueLearningHeroProps) {
  const fresh = points === 0;
  const total = category.items.length;
  const progress = total > 0 ? learned / total : 0;
  const remaining = wordsToNextStar(points);

  if (fresh) {
    return (
      <LandscapeHeroPanel
        testID={testIds.home.hero}
        ctaTestID={testIds.home.heroContinue}
        title="היי כאן דברי"
        subtitle="לומדים מילים, מתרגלים ומדברים בביטחון"
        ctaLabel="מתחילים ללמוד"
        onCtaPress={onContinue}
        mascot={homeAssets.heroStar}
      />
    );
  }

  return (
    <LandscapeHeroPanel
      testID={testIds.home.hero}
      ctaTestID={testIds.home.heroContinue}
      eyebrow="ממשיכים עם"
      title={plain(category.title)}
      subtitle={`עוד ${Math.min(remaining, STAR_STEP)} מילים לכוכב הבא`}
      progress={progress}
      progressLabel={`${learned}/${total}`}
      ctaLabel="המשך ללמוד"
      onCtaPress={onContinue}
      mascot={homeAssets.heroStar}
    />
  );
}
