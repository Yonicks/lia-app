import { View, StyleSheet } from 'react-native';

import { TalkiButton } from '@/design-system/components';
import { testIds } from '@/testing/testIds';

export function RecordButton({
  recording,
  hasRec,
  onStart,
  onStop,
  onPlay,
  onDelete,
}: {
  recording: boolean;
  hasRec: boolean;
  onStart: () => void;
  onStop: () => void;
  onPlay: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={styles.row}>
      {recording ? (
        <TalkiButton testID={testIds.parent.recordStop} label="עצירה" onPress={onStop} />
      ) : (
        <TalkiButton testID={testIds.parent.recordStart} label="הקלטה" onPress={onStart} />
      )}
      <TalkiButton testID={testIds.parent.recordPlay} label="השמעה" variant="secondary" onPress={onPlay} disabled={!hasRec} />
      <TalkiButton
        testID={testIds.parent.recordDelete}
        label="מחיקה"
        variant="ghost"
        onPress={onDelete}
        disabled={!hasRec}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBlockStart: 8 },
});
