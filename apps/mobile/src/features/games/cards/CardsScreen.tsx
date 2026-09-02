import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';

import { TalkiButton, TalkiHeading, TalkiText } from '@/design-system/components';
import { radii } from '@/design-system/theme/radii';
import { shadowCard } from '@/design-system/theme/shadows';
import { v3 } from '@/design-system/theme/colors';
import { homeHref } from '@/domain/navigation/routes';
import { display } from '@/domain/vocabulary/niqqud';
import { useGoBack } from '@/hooks/useGoBack';
import { useGuardedPush } from '@/hooks/useGuardedPush';
import { wordVoiceService } from '@/services/voice';
import { useProgressStore } from '@/state/progressStore';
import { useSettingsStore } from '@/state/settingsStore';
import { testIds } from '@/testing/testIds';

import { GameShell } from '../shell/GameShell';
import { WordArt } from '../shell/WordArt';
import { useGameSession } from '../shell/useGameSession';
import { clampCardIndex, stepCardIndex } from './cardsNav';
import { useCardSwipe } from './useCardSwipe';

export interface CardsScreenProps {
  catId: string | null;
  seed?: number;
}

export function CardsScreen({ catId }: CardsScreenProps) {
  const goBack = useGoBack();
  const push = useGuardedPush();
  const session = useGameSession({ gameId: 'cards', requestedCatId: catId, mode: 'browse' });
  const settings = useSettingsStore((s) => s.settings);
  const markLearned = useProgressStore((s) => s.markLearned);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (session.failed) {
      const t = setTimeout(() => push(homeHref), 400);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [session.failed, push]);

  const items = useMemo(() => session.category?.items ?? [], [session.category]);
  const safeIndex = clampCardIndex(index, items.length);
  const current = items[safeIndex];

  const go = useCallback(
    (delta: -1 | 1) => {
      if (!session.category || items.length === 0) return;
      const next = stepCardIndex(safeIndex, delta, items.length);
      setIndex(next);
      const word = items[next]!.word;
      void markLearned(session.category.id, word);
      void wordVoiceService.say(session.category.id, word);
    },
    [session.category, items, safeIndex, markLearned],
  );

  const say = useCallback(() => {
    if (!session.category || !current) return;
    void wordVoiceService.say(session.category.id, current.word);
  }, [session.category, current]);

  const swipe = useCardSwipe(go);

  const title = session.category ? `🖼️ ${session.category.title}` : '🖼️ כרטיסיות';
  const counter = items.length ? `${safeIndex + 1}/${items.length}` : '0/0';

  return (
    <GameShell
      title={title}
      chips={[counter]}
      done={false}
      result={{ score: 0, total: 0 }}
      onBack={goBack}
      onReplay={session.restart}
      onHome={() => push(homeHref)}
      toast={session.toast}
      onDismissToast={session.dismissToast}
      celebrateMessage={null}
      onDismissCelebrate={() => undefined}
      scoring={false}
      chipTestIDs={[testIds.cards.counter]}
    >
      {current ? (
        <View testID={testIds.cards.root} style={styles.stage}>
          <GestureDetector gesture={swipe}>
            <Pressable
              testID={testIds.cards.word}
              accessibilityRole="button"
              onPress={say}
              style={[styles.card, shadowCard]}
            >
              <WordArt word={current} size="64%" />
              <TalkiHeading level={1} align="center">
                {display(current.word, settings.niqqud)}
              </TalkiHeading>
            </Pressable>
          </GestureDetector>
          <View style={styles.nav}>
            <TalkiButton testID={testIds.cards.prev} label="הקודם" variant="secondary" onPress={() => go(-1)} />
            <TalkiButton testID={testIds.cards.say} label="שוב" onPress={say} />
            <TalkiButton testID={testIds.cards.next} label="הבא" variant="secondary" onPress={() => go(1)} />
          </View>
          <TalkiText align="center" color={v3.textSecondary}>
            מחליקים ימינה ושמאלה כדי להחליף מילה
          </TalkiText>
        </View>
      ) : null}
    </GameShell>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    paddingInline: 16,
    paddingBlock: 12,
    gap: 14,
    justifyContent: 'center',
  },
  card: {
    flex: 1,
    minHeight: 220,
    borderRadius: radii.hero,
    backgroundColor: v3.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
  },
  nav: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
});
