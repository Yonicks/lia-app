import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { TalkiText } from '@/design-system/components';
import { v3 } from '@/design-system/theme/colors';
import { useLandscapeLayout } from '@/design-system/responsive/useLandscapeLayout';

import { landscapeTokens } from './tokens';

export interface LandscapeTitleProps {
  title: string;
  subtitle?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Hub title treatment (Games / Practice) — large Hebrew heading with an
 * optional subtitle pill. Size comes from landscape tokens + uiScale.
 */
export function LandscapeTitle({ title, subtitle, testID, style }: LandscapeTitleProps) {
  const layout = useLandscapeLayout();
  const tokens = landscapeTokens(layout.deviceClass, layout.uiScale);

  return (
    <View testID={testID} style={[styles.wrap, style]}>
      <TalkiText
        weight="extrabold"
        color={v3.purple800}
        align="center"
        style={[styles.title, { fontSize: tokens.titleSize }]}
      >
        {title}
      </TalkiText>
      {subtitle ? (
        <View style={styles.subPill}>
          <TalkiText weight="semibold" color={v3.textPrimary} align="center" style={{ fontSize: tokens.subtitleSize }}>
            {subtitle}
          </TalkiText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 4,
    paddingBlock: 2,
  },
  title: {
    textShadowColor: 'rgba(255,255,255,0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  subPill: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 999,
    paddingInline: 12,
    paddingBlock: 4,
  },
});
