import { Image, StyleSheet, View } from 'react-native';

import { TalkiButton, TalkiText } from '@/design-system/components';
import { v3 } from '@/design-system/theme/colors';
import { photoService } from '@/services/photos';
import { testIds } from '@/testing/testIds';

export function PhotoPicker({
  photo,
  onPicked,
}: {
  photo: string | null;
  onPicked: (dataUrl: string | null) => void;
}) {
  return (
    <View style={styles.wrap}>
      <TalkiButton
        testID={testIds.parent.wordsPhoto}
        label="בחירת תמונה"
        variant="secondary"
        onPress={() => {
          void photoService.pick().then(onPicked);
        }}
      />
      {photo ? <Image source={{ uri: photo }} style={styles.preview} /> : <TalkiText color={v3.textSecondary}>320×320 JPEG</TalkiText>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBlock: 8 },
  preview: { width: 48, height: 48, borderRadius: 8 },
});
