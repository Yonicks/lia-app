import { Tabs } from 'expo-router';

import { BottomNavigation, type NavRoute } from '@/components/shell';

const ROUTE_TO_NAME: Record<NavRoute, string> = {
  home: 'index',
  games: 'games',
  stickers: 'rewards',
};

const NAME_TO_ROUTE: Record<string, NavRoute> = {
  index: 'home',
  games: 'games',
  rewards: 'stickers',
};

/**
 * Real Expo Router tab navigation for the three main destinations
 * (phase-07-plan.md "Native navigation, not a `view` string"), rendered
 * with the design system's own `BottomNavigation` rather than the default
 * tab bar chrome — this app has one bespoke bottom nav, not a second,
 * differently-styled one bolted on by the navigator.
 */
export default function TabsLayout() {
  return (
    <Tabs
      detachInactiveScreens
      screenOptions={{
        headerShown: false,
        freezeOnBlur: true,
        lazy: true,
      }}
      tabBar={({ state, navigation }) => {
        const activeName = state.routes[state.index]?.name ?? 'index';
        const active = NAME_TO_ROUTE[activeName] ?? 'home';
        return (
          <BottomNavigation
            testID="tabs-bottom-nav"
            active={active}
            onNavigate={(route) => {
              const name = ROUTE_TO_NAME[route];
              if (name !== activeName) navigation.navigate(name);
            }}
          />
        );
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="games" />
      <Tabs.Screen name="rewards" />
    </Tabs>
  );
}
