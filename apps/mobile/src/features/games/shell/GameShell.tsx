import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { GameHeader, RewardOverlay, ToastHost } from '@/components/shell';
import { TalkiScreen } from '@/design-system/components';
import { testIds } from '@/testing/testIds';

import { DoneCard } from './DoneCard';
import { GameChips } from './GameChips';
import type { GameResult } from './types';

export interface GameShellProps {
  title: string;
  chips: string[];
  done: boolean;
  result: GameResult;
  onBack: () => void;
  onReplay: () => void;
  onHome: () => void;
  toast: string | null;
  onDismissToast: () => void;
  celebrateMessage: string | null;
  onDismissCelebrate: () => void;
  children: ReactNode;
}

/**
 * Shared frame for every game: header, chips, board or done card,
 * toast, celebration. A game supplies only its board.
 */
export function GameShell({
  title,
  chips,
  done,
  result,
  onBack,
  onReplay,
  onHome,
  toast,
  onDismissToast,
  celebrateMessage,
  onDismissCelebrate,
  children,
}: GameShellProps) {
  return (
    <TalkiScreen testID={testIds.game.shellRoot}>
      <GameHeader title={title} titleTestID={testIds.game.headerTitle} onBack={onBack} />
      {done ? null : <GameChips chips={chips} />}
      <View style={styles.body}>{done ? <DoneCard result={result} onReplay={onReplay} onHome={onHome} /> : children}</View>
      <ToastHost message={toast} onHide={onDismissToast} testID="game-toast" />
      <RewardOverlay
        visible={celebrateMessage !== null}
        title={celebrateMessage ?? ''}
        onDismiss={onDismissCelebrate}
        testID="game-celebrate"
      />
    </TalkiScreen>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    justifyContent: 'center',
  },
});
