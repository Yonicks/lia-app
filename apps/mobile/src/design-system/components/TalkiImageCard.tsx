import { Image, Pressable, StyleSheet, View, type ImageSourcePropType } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { radii } from '../theme/radii';
import { shadowCard } from '../theme/shadows';
import { v2 } from '../theme/colors';
import { TalkiText } from './TalkiText';

export interface TalkiImageCardProps {
  title: string;
  icon: ImageSourcePropType;
  gradientFrom: string;
  gradientTo: string;
  onPress?: () => void;
  testID?: string;
  progress?: number;
}

/** index.html `.cat-card` with its `.hero-chip` — a category/game card whose
 *  identity comes from a 155deg two-stop gradient chip plus a real Talki
 *  icon, never an emoji (phase-05-plan.md work item 5). */
export function TalkiImageCard({ title, icon, gradientFrom, gradientTo, onPress, testID, progress }: TalkiImageCardProps) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.card, shadowCard, pressed && styles.pressed]}
    >
      <LinearGradient
        colors={[gradientFrom, gradientTo]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={styles.chip}
      >
        <Image source={icon} style={styles.icon} resizeMode="contain" />
      </LinearGradient>
      <TalkiText weight="extrabold" style={styles.title}>
        {title}
      </TalkiText>
      {progress !== undefined ? (
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.round(Math.max(0, Math.min(1, progress)) * 100)}%` }]} />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 3,
    borderColor: v2.line,
    borderRadius: radii.card,
    backgroundColor: v2.paper,
    padding: 18,
    minWidth: 150,
  },
  pressed: {
    transform: [{ translateY: 4 }],
    shadowOpacity: 0,
    elevation: 0,
  },
  chip: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  icon: {
    width: '76%',
    height: '76%',
  },
  title: {
    fontSize: 17,
  },
  track: {
    height: 9,
    borderRadius: 999,
    backgroundColor: v2.cream,
    borderWidth: 1,
    borderColor: v2.line,
    overflow: 'hidden',
    marginTop: 8,
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: v2.sun,
  },
});
