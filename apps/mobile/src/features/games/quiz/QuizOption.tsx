import { Image, Pressable, StyleSheet } from 'react-native';

import { TalkiText } from '@/design-system/components';
import { radii } from '@/design-system/theme/radii';
import { shadowSm } from '@/design-system/theme/shadows';
import { v3 } from '@/design-system/theme/colors';
import { plain } from '@/domain/vocabulary/niqqud';
import { wordImage } from '@/domain/vocabulary/wordImage';
import type { TalkiWord } from '@/domain/types';
import { testIds } from '@/testing/testIds';

export type QuizOptionFeedback = 'idle' | 'correct' | 'wrong';

export interface QuizOptionProps {
  word: TalkiWord;
  index: number;
  feedback: QuizOptionFeedback;
  onPress: () => void;
}

/**
 * index.html `.opt` (2575-2576) — picture only, no printed word. The
 * accessibility label is the plain form so a screen reader (and the
 * Playwright burst helper) can find the option that matches the prompt.
 */
export function QuizOption({ word, index, feedback, onPress }: QuizOptionProps) {
  const art = word.photo ? { uri: word.photo } : wordImage(word);
  const feedbackId =
    feedback === 'correct' ? testIds.quiz.optionCorrect : feedback === 'wrong' ? testIds.quiz.optionWrong : undefined;

  return (
    <Pressable
      testID={testIds.quiz.option(index)}
      accessibilityRole="button"
      accessibilityLabel={plain(word.word)}
      onPress={onPress}
      style={[styles.card, shadowSm, feedback === 'correct' && styles.correct, feedback === 'wrong' && styles.wrong]}
    >
      {feedbackId ? <TalkiText testID={feedbackId} style={styles.srOnly} /> : null}
      {art ? (
        <Image source={art} style={styles.art} resizeMode="contain" />
      ) : (
        <TalkiText style={styles.emoji}>{word.emoji}</TalkiText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexGrow: 1,
    flexBasis: 120,
    minWidth: 96,
    minHeight: 96,
    aspectRatio: 1,
    borderRadius: radii.card,
    backgroundColor: v3.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  correct: {
    borderColor: v3.green500,
  },
  wrong: {
    borderColor: v3.pink500,
  },
  art: {
    width: '72%',
    height: '72%',
  },
  emoji: {
    fontSize: 48,
  },
  srOnly: {
    position: 'absolute',
    width: 1,
    height: 1,
    overflow: 'hidden',
  },
});
