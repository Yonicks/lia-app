import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { homeHref } from '@/domain/navigation/routes';
import { audioEngine } from '@/services/audio';
import type { GameId, PracticeModeId } from '@/domain/types';
import { useGoBack } from '@/hooks/useGoBack';
import { useGuardedPush } from '@/hooks/useGuardedPush';
import { testIds } from '@/testing/testIds';

import { GameShell } from '../games/shell/GameShell';
import { useGameSession, type GameSession } from '../games/shell/useGameSession';

export function PracticeGate({
  modeId,
  catId,
  title,
  children,
}: {
  modeId: GameId | PracticeModeId;
  catId: string | null;
  title: string;
  children: (session: GameSession & { category: NonNullable<GameSession['category']> }) => ReactNode;
}) {
  const goBack = useGoBack();
  const push = useGuardedPush();
  const session = useGameSession({ gameId: modeId, requestedCatId: catId });

  useEffect(() => {
    if (session.ready) void audioEngine.setMusicState('speechOrListeningTask');
  }, [session.ready]);

  useEffect(() => {
    if (session.failed) {
      const t = setTimeout(() => push(homeHref), 400);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [session.failed, push]);

  if (!session.ready || !session.category) {
    return (
      <GameShell
        title={title}
        chips={[]}
        done={false}
        result={{ score: 0, total: 0 }}
        onBack={goBack}
        onReplay={session.restart}
        onHome={() => push(homeHref)}
        toast={session.toast}
        onDismissToast={session.dismissToast}
        celebrateMessage={null}
        onDismissCelebrate={() => undefined}
      >
        {null}
      </GameShell>
    );
  }

  return (
    <View testID={testIds.practice.root} style={styles.fill}>
      {children({ ...session, category: session.category })}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
