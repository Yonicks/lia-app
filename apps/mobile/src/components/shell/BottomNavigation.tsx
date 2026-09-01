import { Image, Pressable, StyleSheet, View } from 'react-native';

import { navIcons } from '@/design-system/assets';
import { TalkiText } from '@/design-system/components';
import { shadowFloating } from '@/design-system/theme/shadows';
import { v2, v3 } from '@/design-system/theme/colors';

export type NavRoute = 'home' | 'games' | 'stickers';

export interface BottomNavigationProps {
  active: NavRoute;
  onNavigate: (route: NavRoute) => void;
  testID?: string;
}

/** index.html 1344-1351 (`bottomNav`/`bn-item`) — 3 fixed destinations.
 *  Labels transcribed verbatim, including the legacy comment that the
 *  rewards screen keeps its internal "stickers" route id while only its
 *  label reads "פרסים". Each item is a 30x30 real icon plus a label,
 *  comfortably over the 48x48 floor once padding is added. */
const ITEMS: { route: NavRoute; icon: (typeof navIcons)[keyof typeof navIcons]; label: string }[] = [
  { route: 'home', icon: navIcons.home, label: 'בית' },
  { route: 'games', icon: navIcons.games, label: 'משחקים' },
  { route: 'stickers', icon: navIcons.stickers, label: 'פרסים' },
];

export function BottomNavigation({ active, onNavigate, testID }: BottomNavigationProps) {
  return (
    <View testID={testID} style={[styles.bar, shadowFloating]} accessibilityRole="tablist">
      {ITEMS.map((item) => {
        const isActive = item.route === active;
        return (
          <Pressable
            key={item.route}
            testID={`bottom-nav-${item.route}`}
            onPress={() => onNavigate(item.route)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            style={styles.item}
          >
            <Image source={item.icon} style={styles.icon} resizeMode="contain" />
            <TalkiText weight={isActive ? 'bold' : 'semibold'} color={isActive ? v3.purple600 : v3.textSecondary}>
              {item.label}
            </TalkiText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: v2.paper,
    borderTopWidth: 1,
    borderTopColor: v3.borderSoft,
    paddingBlock: 8,
  },
  item: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  icon: {
    width: 30,
    height: 30,
  },
});
