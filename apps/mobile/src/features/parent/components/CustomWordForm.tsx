import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { TalkiButton, TalkiHeading, TalkiText } from '@/design-system/components';
import { v3 } from '@/design-system/theme/colors';
import { radii } from '@/design-system/theme/radii';
import { newCustomId } from '@/domain/parent/customWords';
import { useProgressStore } from '@/state/progressStore';
import { testIds } from '@/testing/testIds';

import { PhotoPicker } from './PhotoPicker';

export function CustomWordForm() {
  const addCustom = useProgressStore((s) => s.addCustom);
  const [word, setWord] = useState('');
  const [emoji, setEmoji] = useState('💜');
  const [photo, setPhoto] = useState<string | null>(null);

  const save = () => {
    const trimmed = word.trim();
    if (!trimmed) return;
    void addCustom({ id: newCustomId(), word: trimmed, emoji: emoji || '💜', photo: photo ?? undefined });
    setWord('');
    setEmoji('💜');
    setPhoto(null);
  };

  return (
    <View>
      <TalkiHeading level={3}>הוספת מילה אישית</TalkiHeading>
      <TalkiText color={v3.textSecondary}>
        המילים שהכי מדברות אליה — סבתא, הכלב של השכנים, הבובה האהובה.
      </TalkiText>
      <View style={styles.row}>
        <View style={styles.wordCol}>
          <TalkiText weight="bold" style={styles.label}>
            המילה
          </TalkiText>
          <TextInput
            testID={testIds.parent.wordsInput}
            value={word}
            onChangeText={setWord}
            placeholder="למשל: סַבְתָּא רוּתִי"
            style={styles.input}
            returnKeyType="next"
            blurOnSubmit={false}
          />
        </View>
        <View style={styles.emojiCol}>
          <TalkiText weight="bold" style={styles.label}>
            אימוג׳י
          </TalkiText>
          <TextInput
            value={emoji}
            onChangeText={setEmoji}
            maxLength={4}
            style={styles.input}
            returnKeyType="done"
            onSubmitEditing={save}
          />
        </View>
      </View>
      <PhotoPicker photo={photo} onPicked={setPhoto} />
      <TalkiButton testID={testIds.parent.wordsSave} label="הוספת מילה" onPress={save} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  wordCol: { flex: 1, minWidth: 0 },
  emojiCol: { width: 88 },
  label: { marginBlockStart: 8 },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: v3.borderSoft,
    borderRadius: radii.btn,
    paddingInline: 12,
    backgroundColor: v3.surface,
    color: v3.textPrimary,
  },
});
