import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { RewardOverlay } from '@/components/shell';
import { TalkiButton, TalkiHeading, TalkiIconButton, TalkiProgress, TalkiScreen, TalkiText } from '@/design-system/components';
import { uiIcons } from '@/design-system/assets';
import { useDevice } from '@/design-system/responsive/useDevice';
import { homePaddingInline } from '@/design-system/theme/spacing';
import { v3 } from '@/design-system/theme/colors';
import { celebrateTitle, shouldCelebrate } from '@/domain/progress/celebrate';
import { cardsHref, gameHref, practiceMenuHref } from '@/domain/navigation/routes';
import type { CategoryId } from '@/domain/types';
import { display, plain } from '@/domain/vocabulary/niqqud';
import { useGoBack } from '@/hooks/useGoBack';
import { useGuardedPush } from '@/hooks/useGuardedPush';
import { audioEngine } from '@/services/audio';
import { wordVoiceService } from '@/services/voice';
import { useSettingsStore } from '@/state/settingsStore';
import { testIds } from '@/testing/testIds';

import { WordGrid } from './WordGrid';
import { useCategoryProgress } from './useCategoryProgress';

export interface CategoryScreenProps {
  catId: CategoryId;
}

/**
 * index.html `renderCategory()` (2293-2327). Tapping a word speaks it
 * (always the PLAIN form, regardless of the niqqud display setting — see
 * WordTile.tsx) and marks it learned. Opening the screen writes
 * `lia:lastcat` via `useCategoryProgress`'s equivalent of `enterCat()`.
 *
 * The three pills mirror legacy's own `data-cards`/`data-play`/
 * `data-practice` row (2309-2311) exactly, including which of them lead
 * to a real destination: `משחק` goes to the (stubbed) quiz game — the
 * only mode this phase wires end-to-end — while `כרטיסיות` (flashcards,
 * a mode of its own that this phase does not build) and `תרגול` (the
 * general practice menu, matching legacy's `view='practice'`) route to a
 * stub and the real practice menu respectively, per phase-07's "menus
 * only; cards route to a stub" scope.
 */
export function CategoryScreen({ catId }: CategoryScreenProps) {
  const goBack = useGoBack();
  const push = useGuardedPush();
  const { deviceClass } = useDevice();
  const { ready, category, learnedCount, isLearned, niqqudEnabled, markLearned } = useCategoryProgress(catId);
  const effects = useSettingsStore((s) => s.settings.effects);
  const [celebrate, setCelebrate] = useState<string | null>(null);

  if (!ready || !category) {
    return <TalkiScreen testID={testIds.category.root}>{null}</TalkiScreen>;
  }

  const total = category.items.length;
  const progress = total > 0 ? learnedCount / total : 0;

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
    <TalkiScreen testID={testIds.category.root}>
      <View style={[styles.header, { paddingInline: homePaddingInline(deviceClass) }]}>
        <TalkiIconButton
          testID={testIds.category.back}
          icon={uiIcons.back}
          accessibilityLabel="חזרה"
          onPress={goBack}
        />
        <View style={styles.titleWrap}>
          <TalkiHeading testID={testIds.category.title} level={2} align="center">
            {display(category.title, niqqudEnabled)}
          </TalkiHeading>
          <TalkiText align="center" color={v3.textSecondary}>
            {total ? `${learnedCount} מתוך ${total} מילים כבר מוכרות` : 'עוד אין כאן מילים'}
          </TalkiText>
          {total ? (
            <View style={styles.progressWrap}>
              <TalkiProgress testID={testIds.category.progress} value={progress} />
            </View>
          ) : null}
        </View>
        <View style={styles.spacer} />
      </View>

      {total ? (
        <View style={[styles.playRow, { paddingInline: homePaddingInline(deviceClass) }]}>
          <TalkiButton
            testID={testIds.category.cards}
            label="🖼️ כרטיסיות"
            variant="secondary"
            onPress={() => push(cardsHref(category.id))}
          />
          <TalkiButton
            testID={testIds.category.play}
            label="🎮 משחק"
            variant="secondary"
            onPress={() => push(gameHref('quiz', category.id))}
          />
          <TalkiButton
            testID={testIds.category.practice}
            label="🗣️ תרגול"
            variant="secondary"
            onPress={() => push(practiceMenuHref)}
          />
        </View>
      ) : null}

      <ScrollView contentContainerStyle={[styles.content, { paddingInline: homePaddingInline(deviceClass) }]}>
        {total ? (
          <WordGrid words={category.items} niqqudEnabled={niqqudEnabled} isLearned={isLearned} onWordPress={(w) => speakAndLearn(w.word)} />
        ) : (
          <TalkiText align="center" color={v3.textSecondary} style={styles.empty}>
            עוד אין כאן מילים. אפשר להוסיף מילים אישיות עם תמונה והקלטה במסך ההורים.
          </TalkiText>
        )}
      </ScrollView>
      <RewardOverlay
        visible={celebrate !== null}
        title={celebrate ?? ''}
        onDismiss={() => setCelebrate(null)}
        testID="category-celebrate"
      />
    </TalkiScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingBlock: 12,
  },
  titleWrap: {
    flex: 1,
    gap: 2,
  },
  progressWrap: {
    marginTop: 6,
  },
  spacer: {
    width: 48,
  },
  playRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  content: {
    paddingBlock: 12,
  },
  empty: {
    marginTop: 40,
  },
});
