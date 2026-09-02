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
        &quot;סבתא רותי&quot;, הכלב של השכנים, הבובה האהובה — המילים שהכי מדברות אליה.
      </TalkiText>
      <TalkiText weight="bold" style={styles.label}>
        המילה
      </TalkiText>
      <TextInput
        testID={testIds.parent.wordsInput}
        value={word}
        onChangeText={setWord}
        placeholder="למשל: סַבְתָּא רוּתִי"
        style={styles.input}
      />
      <TalkiText weight="bold" style={styles.label}>
        אימוג׳י
      </TalkiText>
      <TextInput value={emoji} onChangeText={setEmoji} maxLength={4} style={styles.input} />
      <PhotoPicker photo={photo} onPicked={setPhoto} />
      <TalkiButton testID={testIds.parent.wordsSave} label="הוספת מילה" onPress={save} />
    </View>
  );
}

const styles = StyleSheet.create({
  label: { marginBlockStart: 10 },
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
