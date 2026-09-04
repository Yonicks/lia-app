import { brand, categoryArt, categoryIcons } from '@/design-system/assets';
import { LandscapeCategoryCard, LandscapeCategoryStrip } from '@/design-system/landscape';
import type { CategoryId, TalkiCategory } from '@/domain/types';
import { plain } from '@/domain/vocabulary/niqqud';
import { testIds } from '@/testing/testIds';

export interface HomeCategoryStripProps {
  categories: TalkiCategory[];
  onOpen: (id: CategoryId) => void;
}

function categoryImage(id: CategoryId) {
  if (id === 'mine') return brand.starMark;
  return categoryArt[id] ?? categoryIcons[id];
}

/**
 * One-row landscape category strip. Every category from `allCats()` —
 * including synthetic `mine` — stays reachable via horizontal scroll
 * (AGENTS.md #21). Never drops cards to match the reference viewport count.
 */
export function HomeCategoryStrip({ categories, onOpen }: HomeCategoryStripProps) {
  return (
    <LandscapeCategoryStrip testID={testIds.home.sectionCategories}>
      {categories.map((cat) => (
        <LandscapeCategoryCard
          key={cat.id}
          testID={testIds.home.category(cat.id)}
          title={plain(cat.title)}
          image={categoryImage(cat.id)}
          onPress={() => onOpen(cat.id)}
        />
      ))}
    </LandscapeCategoryStrip>
  );
}
