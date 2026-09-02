import { StyleSheet, View } from 'react-native';

import { TalkiHeading } from '@/design-system/components';
import { useDevice } from '@/design-system/responsive/useDevice';
import { homeGridGap } from '@/design-system/theme/spacing';
import type { TalkiCategory } from '@/domain/types';
import { testIds } from '@/testing/testIds';

import { HomeCategoryCard } from './HomeCategoryCard';

export interface CategoryGridProps {
  categories: TalkiCategory[];
  learnedByCategory: (cat: TalkiCategory) => number;
  onOpen: (id: TalkiCategory['id']) => void;
}

/**
 * index.html `renderHome()`'s "קטגוריות" section — every category from
 * `allCats()`, including the synthetic `mine` category (always present,
 * empty until Phase 12 seeds custom words). Layout follows
 * `homeCategoryCard()` (2189-2204): horizontal icon + title + count.
 */
export function CategoryGrid({ categories, learnedByCategory, onOpen }: CategoryGridProps) {
  const { deviceClass } = useDevice();
  const gap = homeGridGap(deviceClass);

  return (
    <View testID={testIds.home.sectionCategories}>
      <TalkiHeading level={2} style={styles.heading}>
        קטגוריות
      </TalkiHeading>
      <View style={[styles.grid, { gap }]}>
        {categories.map((cat) => (
          <HomeCategoryCard
            key={cat.id}
            category={cat}
            learned={learnedByCategory(cat)}
            onPress={() => onOpen(cat.id)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
