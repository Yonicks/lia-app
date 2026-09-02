import { Image, Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { uiIcons } from '@/design-system/assets';
import { categoryTheme } from '@/design-system/categoryTheme';
import { TalkiText } from '@/design-system/components';
import { radii } from '@/design-system/theme/radii';
import { shadowSm } from '@/design-system/theme/shadows';
import { v3 } from '@/design-system/theme/colors';
import type { TalkiCategory } from '@/domain/types';
import { plain } from '@/domain/vocabulary/niqqud';
import { testIds } from '@/testing/testIds';

export interface HomeCategoryCardProps {
  category: TalkiCategory;
  learned: number;
  onPress: () => void;
}

/**
 * index.html `homeCategoryCard()` (2189-2204) — a horizontal row: coloured
 * icon chip, title, `learned/total` plus a thin track. Matches both the
 * current legacy Home and `docs/design/talki-home-approved.png`. `mine`
 * stretches full-width (`.home-cat-card.mine{grid-column:1/-1}`).
 */
export function HomeCategoryCard({ category, learned, onPress }: HomeCategoryCardProps) {
  const theme = categoryTheme[category.id];
  const total = category.items.length;
  const wide = category.id === 'mine';
  const progress = total > 0 ? learned / total : 0;

  return (
    <Pressable
      testID={testIds.home.category(category.id)}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${category.title}, ${learned} מתוך ${total}`}
      style={({ pressed }) => [styles.card, shadowSm, wide && styles.wide, pressed && styles.pressed]}
    >
      <LinearGradient colors={[theme.gradientFrom, theme.gradientTo]} start={{ x: 0.15, y: 0 }} end={{ x: 0.85, y: 1 }} style={styles.icon}>
        <Image source={theme.icon ?? uiIcons.star} style={styles.iconImg} resizeMode="contain" />
      </LinearGradient>
      <View style={styles.copy}>
        <TalkiText weight="bold" style={styles.title} numberOfLines={1}>
          {plain(category.title)}
        </TalkiText>
        <View style={styles.statsRow}>
          <TalkiText color={v3.textMuted} style={styles.stats} align="start">
            {learned}/{total}
          </TalkiText>
          <Image source={uiIcons.star} style={styles.star} resizeMode="contain" />
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.round(progress * 100)}%`, backgroundColor: theme.gradientFrom }]} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexGrow: 1,
    flexBasis: 150,
    minWidth: 150,
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBlock: 9,
    paddingInline: 12,
    borderRadius: radii.card,
    backgroundColor: v3.surface,
    borderWidth: 1,
    borderColor: 'rgba(121,83,47,0.08)',
  },
  wide: {
    flexBasis: '100%',
    minWidth: '100%',
  },
  pressed: {
    transform: [{ translateY: 1 }],
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconImg: {
    width: 36,
    height: 36,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  title: {
    fontSize: 15,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stats: {
    fontSize: 11,
  },
  star: {
    width: 11,
    height: 11,
  },
  track: {
    height: 4,
    borderRadius: 999,
    backgroundColor: v3.track,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
});
