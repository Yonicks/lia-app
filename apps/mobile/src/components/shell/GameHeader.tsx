import { StyleSheet, View } from 'react-native';

import { TalkiHeading, TalkiIconButton, TalkiProgress } from '@/design-system/components';
import { uiIcons } from '@/design-system/assets';

export interface GameHeaderProps {
  title: string;
  progress?: number;
  onBack: () => void;
  testID?: string;
}

/** A per-game header: back control at the reading-start edge, title, and an
 *  optional round-progress bar. Distinct from `TopBar` — legacy games render
 *  inside `<main>` below the persistent topbar and layer their own
 *  in-content header for the round/back control (e.g. quiz/memory headers),
 *  which is what this primitive stands in for. */
export function GameHeader({ title, progress, onBack, testID }: GameHeaderProps) {
  return (
    <View testID={testID} style={styles.row}>
      <TalkiIconButton testID="game-header-back" icon={uiIcons.back} onPress={onBack} accessibilityLabel="חזרה" />
      <View style={styles.titleWrap}>
        <TalkiHeading level={3} align="center">
          {title}
        </TalkiHeading>
        {progress !== undefined ? (
          <View style={styles.progressWrap}>
            <TalkiProgress testID="game-header-progress" value={progress} />
          </View>
        ) : null}
      </View>
      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingInline: 14,
    paddingBlock: 10,
  },
  titleWrap: {
    flex: 1,
  },
  progressWrap: {
    marginTop: 6,
  },
  spacer: {
    width: 48,
  },
});
