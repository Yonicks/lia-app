import { StyleSheet, View } from 'react-native';

import { TalkiText } from '@/design-system/components';
import { v3 } from '@/design-system/theme/colors';
import { radii } from '@/design-system/theme/radii';
import { stickerUnlocked } from '@/domain/rewards/stickers';
import type { Sticker, TalkiWord } from '@/domain/types';
import { getCat } from '@/domain/vocabulary/allCats';
import { testIds } from '@/testing/testIds';

function stickerEmoji(s: Sticker): string {
  if (s.milestone === 1) return '⭐';
  if (s.milestone === 25) return '✨';
  if (s.milestone === 75) return '🎁';
  if (s.complete) return '🔢';
  const cat = s.cat ? getCat(s.cat) : undefined;
  return cat?.items.find((i) => i.word === s.word)?.emoji ?? '💜';
}

export function StickerGrid({
  items,
  learned,
  custom,
}: {
  items: Sticker[];
  learned: ReadonlySet<string>;
  custom: TalkiWord[];
}) {
  return (
    <View style={styles.grid}>
      {items.map((s, index) => {
        const on = stickerUnlocked(s, learned, custom);
        return (
          <View
            key={`${s.img}-${index}`}
            testID={testIds.stickers.item(index)}
            accessibilityState={{ disabled: !on }}
            style={[styles.cell, !on && styles.locked]}
          >
            <TalkiText style={styles.emoji} align="center">
              {stickerEmoji(s)}
            </TalkiText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    paddingInline: 16,
    paddingBlockEnd: 24,
  },
  cell: {
    width: 72,
    height: 72,
    borderRadius: radii.card,
    backgroundColor: v3.surface,
    borderWidth: 1,
    borderColor: v3.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locked: { opacity: 0.35 },
  emoji: { fontSize: 32 },
});
