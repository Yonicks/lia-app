import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ToastHost } from '@/components/shell';
import { landscapeBackgrounds, uiIcons } from '@/design-system/assets';
import { TalkiIconButton, TalkiText } from '@/design-system/components';
import {
  LandscapePageIndicator,
  LandscapeTopBar,
  LandscapeWorldShell,
  landscapeTokens,
} from '@/design-system/landscape';
import { useLandscapeLayout } from '@/design-system/responsive/useLandscapeLayout';
import { shadowCard } from '@/design-system/theme/shadows';
import { v3 } from '@/design-system/theme/colors';
import { filterStickers, stickerCounter } from '@/domain/rewards/stickerFilters';
import { wordGridPageSize, wordGridPages } from '@/domain/vocabulary/wordGridPages';
import type { CategoryId } from '@/domain/types';
import { useGoBack } from '@/hooks/useGoBack';
import { useParentBrand } from '@/hooks/useParentBrand';
import { useProgressStore } from '@/state/progressStore';
import { useSettingsStore } from '@/state/settingsStore';
import { testIds } from '@/testing/testIds';

import { StickerFilters } from './StickerFilters';
import { StickerGrid } from './StickerGrid';

/**
 * Rewards / stickers — landscape detail (Phase 27).
 * World shell + top chrome; sticker catalog is token-paged (no tall portrait list).
 * Points pill is display-only here (already on the rewards destination).
 */
export function StickersScreen() {
  const goBack = useGoBack();
  const layout = useLandscapeLayout();
  const tokens = landscapeTokens(layout.deviceClass, layout.uiScale);
  const { learned, custom } = useProgressStore();
  const { settings, toggleMusic } = useSettingsStore();
  const parent = useParentBrand();
  const [filter, setFilter] = useState<'all' | CategoryId>('all');
  const [pageIndex, setPageIndex] = useState(0);
  const [pageScope, setPageScope] = useState({ filter, pageSize: 0 });

  const items = filterStickers(filter);
  const pageSize = wordGridPageSize(tokens.stickerColumns, tokens.stickerRows);
  const pages = useMemo(() => wordGridPages(items, pageSize), [items, pageSize]);

  if (pageScope.filter !== filter || pageScope.pageSize !== pageSize) {
    setPageScope({ filter, pageSize });
    setPageIndex(0);
  }

  const safePage = Math.min(pageIndex, Math.max(0, pages.length - 1));
  const activePage = pages[safePage] ?? [];
  const baseIndex = safePage * pageSize;

  return (
    <LandscapeWorldShell
      variant="detail"
      world="home"
      backgroundSource={landscapeBackgrounds.home}
      testID={testIds.stickers.root}
      topBar={
        <LandscapeTopBar
          testID="landscape-rewards-topbar"
          points={learned.size}
          musicOn={settings.music}
          onToggleMusic={() => void toggleMusic()}
          onBrandLongPress={parent.onBrandLongPress}
          onBrandShortPress={parent.onBrandShortPress}
          showLogo
          startAccessory={
            <TalkiIconButton
              testID={testIds.stickers.back}
              icon={uiIcons.back}
              accessibilityLabel="חזרה"
              onPress={goBack}
            />
          }
        />
      }
      auxiliary={
        pages.length > 1 ? (
          <LandscapePageIndicator
            testID={testIds.stickers.pageIndicator}
            pageCount={pages.length}
            activeIndex={safePage}
            onSelect={setPageIndex}
          />
        ) : null
      }
    >
      <ToastHost message={parent.toast} onHide={parent.dismissToast} testID={testIds.parent.toast} />
      <View style={[styles.body, { gap: tokens.gap }]}>
        <View style={[styles.header, shadowCard, { gap: Math.max(4, tokens.gap - 4) }]}>
          <TalkiText weight="extrabold" align="center" color={v3.purple800} style={{ fontSize: tokens.gameTitleSize }}>
            המדבקות שלי
          </TalkiText>
          <TalkiText align="center" color={v3.textSecondary} style={{ fontSize: tokens.subtitleSize }}>
            כל מילה חדשה — עוד מדבקה!
          </TalkiText>
          <TalkiText
            testID={testIds.stickers.counter}
            align="center"
            weight="semibold"
            style={{ fontSize: tokens.subtitleSize }}
          >
            {stickerCounter(learned, custom)}
          </TalkiText>
          <StickerFilters active={filter} onChange={setFilter} />
        </View>
        <StickerGrid items={activePage} learned={learned} custom={custom} baseIndex={baseIndex} />
      </View>
    </LandscapeWorldShell>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, minHeight: 0 },
  header: {
    borderRadius: 16,
    backgroundColor: v3.surface,
    paddingInline: 12,
    paddingBlock: 8,
  },
});
