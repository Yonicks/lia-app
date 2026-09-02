import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ToastHost, TopBar } from '@/components/shell';
import { TalkiHeading, TalkiScreen, TalkiText } from '@/design-system/components';
import { v3 } from '@/design-system/theme/colors';
import { filterStickers, stickerCounter } from '@/domain/rewards/stickerFilters';
import type { CategoryId } from '@/domain/types';
import { useParentBrand } from '@/hooks/useParentBrand';
import { useProgressStore } from '@/state/progressStore';
import { useSettingsStore } from '@/state/settingsStore';
import { testIds } from '@/testing/testIds';

import { StickerFilters } from './StickerFilters';
import { StickerGrid } from './StickerGrid';

export function StickersScreen() {
  const { learned, custom } = useProgressStore();
  const { settings, toggleMusic } = useSettingsStore();
  const parent = useParentBrand();
  const [filter, setFilter] = useState<'all' | CategoryId>('all');
  const items = filterStickers(filter);

  return (
    <TalkiScreen testID="rewards-root">
      <View testID={testIds.stickers.root} style={styles.fill}>
      <TopBar
        points={learned.size}
        musicOn={settings.music}
        onToggleMusic={() => void toggleMusic()}
        onBrandLongPress={parent.onBrandLongPress}
        onBrandShortPress={parent.onBrandShortPress}
      />
      <ToastHost message={parent.toast} onHide={parent.dismissToast} testID={testIds.parent.toast} />
      <ScrollView>
        <TalkiHeading level={1} align="center" style={styles.title}>
          המדבקות שלי
        </TalkiHeading>
        <TalkiText align="center" color={v3.textSecondary}>
          כל מילה חדשה — עוד מדבקה!
        </TalkiText>
        <TalkiText testID={testIds.stickers.counter} align="center" weight="semibold" style={styles.counter}>
          {stickerCounter(learned, custom)}
        </TalkiText>
        <StickerFilters active={filter} onChange={setFilter} />
        <StickerGrid items={items} learned={learned} custom={custom} />
      </ScrollView>
      </View>
    </TalkiScreen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  title: { marginBlockStart: 12 },
  counter: { marginBlock: 8 },
});
