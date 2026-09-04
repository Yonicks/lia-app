import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { RewardOverlay, ToastHost } from '@/components/shell';
import { landscapeBackgrounds, uiIcons } from '@/design-system/assets';
import { TalkiIconButton, TalkiText } from '@/design-system/components';
import { LandscapeTopBar, LandscapeWorldShell, landscapeTokens } from '@/design-system/landscape';
import { useLandscapeLayout } from '@/design-system/responsive/useLandscapeLayout';
import { v3 } from '@/design-system/theme/colors';
import { useParentBrand } from '@/hooks/useParentBrand';
import { useProgressStore } from '@/state/progressStore';
import { useSettingsStore } from '@/state/settingsStore';
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
  /** `false` for cards — a flashcard browser, not a scored game. */
  scoring?: boolean;
  chipTestIDs?: (string | undefined)[];
  /** Detail world — games default; practice activities use `practice`. */
  world?: 'games' | 'practice';
  children: ReactNode;
}

/**
 * Shared landscape game-detail frame (Phase 24): world background, top bar
 * with back accessory, compact title + chips, board or done card, toast and
 * celebration hosts. Wave A/B games supply only the board; props stay stable.
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
  scoring = true,
  chipTestIDs,
  world = 'games',
  children,
}: GameShellProps) {
  const layout = useLandscapeLayout();
  const tokens = landscapeTokens(layout.deviceClass, layout.uiScale);
  const learned = useProgressStore((s) => s.learned);
  const { settings, toggleMusic } = useSettingsStore();
  const parent = useParentBrand();
  const showDone = scoring && done;
  const isPractice = world === 'practice';

  return (
    <LandscapeWorldShell
      variant={isPractice ? 'practice' : 'detail'}
      world={world}
      backgroundSource={isPractice ? landscapeBackgrounds.practice : landscapeBackgrounds.games}
      testID={testIds.game.shellRoot}
      contentStyle={styles.shellContent}
      topBar={
        <LandscapeTopBar
          testID={isPractice ? 'landscape-practice-topbar' : 'landscape-game-topbar'}
          points={learned.size}
          musicOn={settings.music}
          onToggleMusic={() => void toggleMusic()}
          onBrandLongPress={parent.onBrandLongPress}
          onBrandShortPress={parent.onBrandShortPress}
          showLogo
          startAccessory={
            <TalkiIconButton
              testID={testIds.game.headerBack}
              icon={uiIcons.back}
              accessibilityLabel="חזרה"
              onPress={onBack}
            />
          }
        />
      }
    >
      <View style={[styles.frame, { gap: Math.max(2, tokens.gap - 4) }]}>
        {showDone ? null : (
          <View
            style={[
              styles.chrome,
              {
                gap: Math.max(4, tokens.gap - 4),
                flexDirection: layout.deviceClass === 'compactPhone' || layout.deviceClass === 'phone' ? 'row' : 'column',
                flexWrap: 'wrap',
              },
            ]}
          >
            <TalkiText
              testID={testIds.game.headerTitle}
              weight="extrabold"
              color={v3.purple800}
              align="center"
              style={{ fontSize: tokens.gameTitleSize }}
            >
              {title}
            </TalkiText>
            <GameChips chips={chips} chipTestIDs={chipTestIDs} gap={Math.max(6, tokens.gap - 2)} />
          </View>
        )}
        <View style={styles.body}>{showDone ? <DoneCard result={result} onReplay={onReplay} onHome={onHome} /> : children}</View>
      </View>
      <ToastHost message={toast} onHide={onDismissToast} testID="game-toast" />
      <ToastHost message={parent.toast} onHide={parent.dismissToast} testID={testIds.parent.toast} />
      <RewardOverlay
        visible={celebrateMessage !== null}
        title={celebrateMessage ?? ''}
        onDismiss={onDismissCelebrate}
        testID="game-celebrate"
      />
    </LandscapeWorldShell>
  );
}

const styles = StyleSheet.create({
  shellContent: {
    paddingBlock: 2,
  },
  frame: {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
  chrome: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  body: {
    flex: 1,
    minHeight: 0,
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
