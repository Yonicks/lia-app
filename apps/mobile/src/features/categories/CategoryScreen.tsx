import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { RewardOverlay, ToastHost } from '@/components/shell';
import { landscapeBackgrounds, uiIcons } from '@/design-system/assets';
import { TalkiButton, TalkiIconButton, TalkiText } from '@/design-system/components';
import {
  LandscapePageIndicator,
  LandscapeProgress,
  LandscapeTopBar,
  LandscapeWordGrid,
  LandscapeWorldShell,
  landscapeTokens,
} from '@/design-system/landscape';
import { useLandscapeLayout } from '@/design-system/responsive/useLandscapeLayout';
import { shadowCard } from '@/design-system/theme/shadows';
import { v2, v3 } from '@/design-system/theme/colors';
import { radii } from '@/design-system/theme/radii';
import { celebrateTitle, shouldCelebrate } from '@/domain/progress/celebrate';
import { cardsHref, gameHref, practiceMenuHref } from '@/domain/navigation/routes';
import type { CategoryId } from '@/domain/types';
import { display, plain } from '@/domain/vocabulary/niqqud';
import { wordGridPages, wordGridPageSize } from '@/domain/vocabulary/wordGridPages';
import { useGoBack } from '@/hooks/useGoBack';
import { useGuardedPush } from '@/hooks/useGuardedPush';
import { useParentBrand } from '@/hooks/useParentBrand';
import { audioEngine } from '@/services/audio';
import { wordVoiceService } from '@/services/voice';
import { useProgressStore } from '@/state/progressStore';
import { useSettingsStore } from '@/state/settingsStore';
import { testIds } from '@/testing/testIds';

import { WordTile } from './WordTile';
import { useCategoryProgress } from './useCategoryProgress';

export interface CategoryScreenProps {
  catId: CategoryId;
}

/**
 * Landscape category / vocabulary learning surface (Phase 23).
 *
 * Composition:
 *   LandscapeWorldShell (detail) + home world background
 *   LandscapeTopBar with back accessory + points/music/parent brand
 *   Compact header panel (title + progress + cards/play/practice CTAs)
 *   LandscapeWordGrid page (token-driven columns × rows)
 *   LandscapePageIndicator when words exceed one page
 *
 * Behavior preserved from legacy `renderCategory()`: speak PLAIN form on
 * tap, mark learned, celebrate milestones, write lia:lastcat, keep all
 * words/custom/mine reachable.
 */
export function CategoryScreen({ catId }: CategoryScreenProps) {
  const goBack = useGoBack();
  const push = useGuardedPush();
  const layout = useLandscapeLayout();
  const tokens = landscapeTokens(layout.deviceClass, layout.uiScale);
  const { ready, category, learnedCount, isLearned, niqqudEnabled, markLearned } = useCategoryProgress(catId);
  const learned = useProgressStore((s) => s.learned);
  const effects = useSettingsStore((s) => s.settings.effects);
  const { settings, toggleMusic } = useSettingsStore();
  const parent = useParentBrand();
  const [celebrate, setCelebrate] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageScope, setPageScope] = useState({ catId, pageSize: 0 });

  const pageSize = wordGridPageSize(tokens.wordGridColumns, tokens.wordGridRows);
  const pages = useMemo(
    () => (category ? wordGridPages(category.items, pageSize) : [[]]),
    [category, pageSize],
  );

  // Reset paging when category or grid density changes (render-time adjust).
  if (pageScope.catId !== catId || pageScope.pageSize !== pageSize) {
    setPageScope({ catId, pageSize });
    setPageIndex(0);
  }

  const safePage = Math.min(pageIndex, Math.max(0, pages.length - 1));
  const activePage = pages[safePage] ?? [];

  const selectPage = (index: number) => {
    setPageIndex(Math.max(0, Math.min(index, pages.length - 1)));
  };

  if (!ready || !category) {
    return (
      <LandscapeWorldShell variant="detail" world="home" testID={testIds.category.root}>
        {null}
      </LandscapeWorldShell>
    );
  }

  const total = category.items.length;
  const progress = total > 0 ? learnedCount / total : 0;
  const progressLabel = total ? `${learnedCount} מתוך ${total} מילים כבר מוכרות` : 'עוד אין כאן מילים';

  const speakAndLearn = (word: string) => {
    void wordVoiceService.say(category.id, plain(word));
    void markLearned(word).then((r) => {
      if (r && r.added && shouldCelebrate(r.size) && effects) {
        audioEngine.playSfx('reward.unlock');
        setCelebrate(celebrateTitle(r.size));
      }
    });
  };

  return (
    <LandscapeWorldShell
      variant="detail"
      world="home"
      backgroundSource={landscapeBackgrounds.home}
      testID={testIds.category.root}
      topBar={
        <LandscapeTopBar
          testID="landscape-category-topbar"
          points={learned.size}
          musicOn={settings.music}
          onToggleMusic={() => void toggleMusic()}
          onBrandLongPress={parent.onBrandLongPress}
          onBrandShortPress={parent.onBrandShortPress}
          showLogo
          startAccessory={
            <TalkiIconButton
              testID={testIds.category.back}
              icon={uiIcons.back}
              accessibilityLabel="חזרה"
              onPress={goBack}
            />
          }
        />
      }
      auxiliary={
        total > pageSize ? (
          <LandscapePageIndicator
            testID={testIds.category.pageIndicator}
            pageCount={pages.length}
            activeIndex={safePage}
            onSelect={selectPage}
          />
        ) : null
      }
    >
      <ToastHost message={parent.toast} onHide={parent.dismissToast} testID={testIds.parent.toast} />
      <View style={[styles.body, { gap: tokens.gap }]}>
        <View style={[styles.headerPanel, shadowCard, { gap: Math.max(4, tokens.gap - 4) }]}>
          <TalkiText
            testID={testIds.category.title}
            weight="extrabold"
            color={v3.purple800}
            align="center"
            style={{ fontSize: Math.round(tokens.titleSize * 0.78) }}
          >
            {display(category.title, niqqudEnabled)}
          </TalkiText>
          {total ? (
            <LandscapeProgress
              testID={testIds.category.progress}
              value={progress}
              label={progressLabel}
            />
          ) : (
            <TalkiText align="center" color={v3.textSecondary} style={{ fontSize: tokens.subtitleSize }}>
              {progressLabel}
            </TalkiText>
          )}
          {total ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.playRow}
              style={styles.playStrip}
            >
              <TalkiButton
                testID={testIds.category.cards}
                label="🖼️ כרטיסיות"
                variant="secondary"
                onPress={() => push(cardsHref(category.id))}
                style={styles.playBtn}
              />
              <TalkiButton
                testID={testIds.category.play}
                label="🎮 משחק"
                variant="secondary"
                onPress={() => push(gameHref('quiz', category.id))}
                style={styles.playBtn}
              />
              <TalkiButton
                testID={testIds.category.practice}
                label="🗣️ תרגול"
                variant="secondary"
                onPress={() => push(practiceMenuHref)}
                style={styles.playBtn}
              />
            </ScrollView>
          ) : null}
        </View>

        <View style={styles.gridHost} testID={testIds.category.grid}>
          {total ? (
            <View style={styles.page} testID={testIds.category.page(safePage)}>
              <LandscapeWordGrid>
                {activePage.map((word, localIndex) => {
                  const index = safePage * pageSize + localIndex;
                  return (
                    <WordTile
                      key={`${word.word}-${index}`}
                      word={word}
                      index={index}
                      niqqudEnabled={niqqudEnabled}
                      learned={isLearned(word.word)}
                      onPress={() => speakAndLearn(word.word)}
                    />
                  );
                })}
              </LandscapeWordGrid>
            </View>
          ) : (
            <View style={[styles.emptyPanel, shadowCard]}>
              <TalkiText align="center" color={v3.textSecondary} style={styles.empty}>
                עוד אין כאן מילים. אפשר להוסיף מילים אישיות עם תמונה והקלטה במסך ההורים.
              </TalkiText>
            </View>
          )}
        </View>
      </View>

      <RewardOverlay
        visible={celebrate !== null}
        title={celebrate ?? ''}
        onDismiss={() => setCelebrate(null)}
        testID="category-celebrate"
      />
    </LandscapeWorldShell>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    minHeight: 0,
  },
  headerPanel: {
    flexGrow: 0,
    flexShrink: 0,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: radii.card,
    borderWidth: 2,
    borderColor: v2.line,
    paddingInline: 12,
    paddingBlock: 8,
  },
  playStrip: {
    flexGrow: 0,
    flexShrink: 0,
    maxHeight: 52,
  },
  playRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    paddingInline: 2,
  },
  playBtn: {
    paddingInline: 14,
  },
  gridHost: {
    flex: 1,
    minHeight: 0,
    minWidth: 0,
  },
  page: {
    flex: 1,
    minHeight: 0,
  },
  emptyPanel: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: radii.card,
    borderWidth: 2,
    borderColor: v2.line,
    padding: 20,
  },
  empty: {
    fontSize: 15,
  },
});
