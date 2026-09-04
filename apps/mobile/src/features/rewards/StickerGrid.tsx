import { Image, StyleSheet, View } from 'react-native';

import { landscapeTokens } from '@/design-system/landscape';
import { useLandscapeLayout } from '@/design-system/responsive/useLandscapeLayout';
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
  baseIndex = 0,
}: {
  items: Sticker[];
  learned: ReadonlySet<string>;
  custom: TalkiWord[];
  /** Absolute index of the first item on this page (for stable testIDs). */
  baseIndex?: number;
}) {
  const layout = useLandscapeLayout();
  const tokens = landscapeTokens(layout.deviceClass, layout.uiScale);
  const cell = tokens.stickerCellSize;
  const art = Math.max(32, cell - 12);

  return (
    <View
      style={[
        styles.grid,
        {
          gap: tokens.gap,
          paddingInline: tokens.padInline,
        },
      ]}
    >
      {items.map((s, i) => {
        const index = baseIndex + i;
        const on = stickerUnlocked(s, learned, custom);
        const src = stickerImage(s);
        return (
          <View
            key={`${s.img}-${index}`}
            testID={testIds.stickers.item(index)}
            accessibilityRole="image"
            accessibilityState={{ disabled: !on }}
            accessibilityLabel={s.word ?? s.img}
            style={[
              styles.cell,
              {
                width: cell,
                height: cell,
                borderRadius: radii.card,
              },
              !on && styles.locked,
            ]}
          >
            {src ? <Image source={src} style={{ width: art, height: art }} resizeMode="contain" /> : null}
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
    alignContent: 'center',
    flex: 1,
    minHeight: 0,
  },
  cell: {
    backgroundColor: v3.surface,
    borderWidth: 1,
    borderColor: v3.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locked: { opacity: 0.35 },
});
