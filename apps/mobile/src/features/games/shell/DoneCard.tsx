import { Image, StyleSheet, View } from 'react-native';

import { uiIcons } from '@/design-system/assets';
import { TalkiButton, TalkiHeading, TalkiText } from '@/design-system/components';
import { landscapeTokens } from '@/design-system/landscape/tokens';
import { useLandscapeLayout } from '@/design-system/responsive/useLandscapeLayout';
import { radii } from '@/design-system/theme/radii';
import { shadowCard } from '@/design-system/theme/shadows';
import { v3 } from '@/design-system/theme/colors';
import { doneCardStars } from '@/domain/games/doneStars';
import { testIds } from '@/testing/testIds';

import type { GameResult } from './types';

export interface DoneCardProps {
  result: GameResult;
  onReplay: () => void;
  onHome: () => void;
}

/**
 * index.html `doneCard()` (3204-3214). Star count comes from
 * `doneCardStars()` — never inlined here so eleven games share one
 * threshold table.
 */
export function DoneCard({ result, onReplay, onHome }: DoneCardProps) {
  const layout = useLandscapeLayout();
  const tokens = landscapeTokens(layout.deviceClass, layout.uiScale);
  const filled = doneCardStars(result.score, result.total);
  const summary = [
    `${result.score} מתוך ${result.total}`,
    result.best ? `רצף הכי טוב: ${result.best}` : null,
    result.extra ?? null,
  ]
    .filter(Boolean)
    .join(' • ');

  return (
    <View
      testID={testIds.game.doneCard}
      style={[
        styles.card,
        shadowCard,
        {
          marginInline: tokens.padInline,
          padding: Math.max(16, tokens.padBlock + 8),
          maxWidth: layout.width - tokens.padInline * 2,
        },
      ]}
    >
      <View testID={testIds.game.doneStars} style={styles.stars} accessibilityLabel={`${filled} כוכבים`}>
        {[0, 1, 2].map((i) => (
          <Image
            key={i}
            source={uiIcons.star}
            style={[styles.star, i < filled ? styles.starOn : styles.starOff]}
            resizeMode="contain"
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        ))}
      </View>
      <TalkiHeading level={1} align="center">
        כל הכבוד!
      </TalkiHeading>
      <TalkiText align="center" color={v3.textSecondary}>
        {summary}
      </TalkiText>
      <View style={styles.actions}>
        <TalkiButton testID={testIds.game.doneReplay} label="לשחק שוב" onPress={onReplay} />
        <TalkiButton testID={testIds.game.doneHome} label="הביתה" variant="secondary" onPress={onHome} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.hero,
    backgroundColor: v3.surface,
    alignItems: 'center',
    gap: 12,
    alignSelf: 'center',
  },
  stars: {
    flexDirection: 'row',
    gap: 8,
  },
  star: {
    width: 44,
    height: 44,
  },
  starOn: {
    opacity: 1,
  },
  starOff: {
    opacity: 0.3,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    marginTop: 8,
  },
});
