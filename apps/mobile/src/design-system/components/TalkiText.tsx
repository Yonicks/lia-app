import type { ComponentProps } from 'react';
import { StyleSheet, Text } from 'react-native';

import { isRTL } from '../rtl/logical';
import { v3 } from '../theme/colors';
import { fontFamily } from '../theme/typography';

export type TalkiTextWeight = 'regular' | 'semibold' | 'bold' | 'extrabold';
export type TalkiLogicalAlign = 'start' | 'end' | 'center';

/** RN's `TextStyle.textAlign` only has the physical values `left`/`right`
 *  (no `start`/`end` — a real RN limitation), so every logical `align` prop
 *  in the design system funnels through this instead of a component
 *  inlining `isRTL() ? 'right' : 'left'` itself, which is exactly the kind
 *  of one-off `design-system/rtl/logical.ts` exists to prevent. */
export function resolveLogicalAlign(align: TalkiLogicalAlign): 'left' | 'right' | 'center' {
  if (align === 'center') return 'center';
  const rtl = isRTL();
  if (align === 'start') return rtl ? 'right' : 'left';
  return rtl ? 'left' : 'right';
}

export interface TalkiTextProps extends ComponentProps<typeof Text> {
  weight?: TalkiTextWeight;
  color?: string;
  /** Defaults to 'start', matching Hebrew's reading direction. */
  align?: TalkiLogicalAlign;
}

/** index.html body font family — Assistant. Every body-copy string in the
 *  app renders through this, never a bare `<Text>`, so a font-family change
 *  is a one-file edit. */
export function TalkiText({ weight = 'regular', color = v3.textPrimary, align = 'start', style, ...rest }: TalkiTextProps) {
  return (
    <Text
      {...rest}
      style={[styles.base, { fontFamily: fontFamily.body[weight], color, textAlign: resolveLogicalAlign(align) }, style]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    fontSize: 15,
    lineHeight: 21,
  },
});
