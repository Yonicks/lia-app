import type { ComponentProps } from 'react';
import { Text } from 'react-native';

import { resolveLogicalAlign, type TalkiLogicalAlign } from './TalkiText';
import { v3 } from '../theme/colors';
import { fontFamily } from '../theme/typography';

export type TalkiHeadingLevel = 1 | 2 | 3;
export type TalkiHeadingWeight = 'medium' | 'bold' | 'extrabold' | 'black';

export interface TalkiHeadingProps extends ComponentProps<typeof Text> {
  level?: TalkiHeadingLevel;
  weight?: TalkiHeadingWeight;
  color?: string;
  align?: TalkiLogicalAlign;
}

const SIZE_BY_LEVEL: Record<TalkiHeadingLevel, { fontSize: number; lineHeight: number }> = {
  1: { fontSize: 28, lineHeight: 34 },
  2: { fontSize: 22, lineHeight: 28 },
  3: { fontSize: 18, lineHeight: 24 },
};

/** index.html h1/h2/h3/.display heading font family — Rubik. */
export function TalkiHeading({
  level = 2,
  weight = 'bold',
  color = v3.textHeading,
  align = 'start',
  style,
  ...rest
}: TalkiHeadingProps) {
  return (
    <Text
      {...rest}
      accessibilityRole="header"
      style={[
        SIZE_BY_LEVEL[level],
        { fontFamily: fontFamily.heading[weight], color, textAlign: resolveLogicalAlign(align) },
        style,
      ]}
    />
  );
}
