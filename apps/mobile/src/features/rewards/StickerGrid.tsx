import { Image, StyleSheet, View } from 'react-native';

import { v3 } from '@/design-system/theme/colors';
import { radii } from '@/design-system/theme/radii';
import { stickerImage } from '@/domain/rewards/stickerArt';
import { stickerUnlocked } from '@/domain/rewards/stickers';
import type { Sticker, TalkiWord } from '@/domain/types';
import { testIds } from '@/testing/testIds';

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
        const src = stickerImage(s);
        return (
          <View
            key={`${s.img}-${index}`}
            testID={testIds.stickers.item(index)}
            accessibilityRole="image"
            accessibilityState={{ disabled: !on }}
            accessibilityLabel={s.word ?? s.img}
            style={[styles.cell, !on && styles.locked]}
          >
            {src ? (
              <Image source={src} style={styles.art} resizeMode="contain" />
            ) : null}
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
  art: { width: 56, height: 56 },
});
