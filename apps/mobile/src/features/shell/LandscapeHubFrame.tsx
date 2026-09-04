import type { ReactNode } from 'react';

import { landscapeBackgrounds } from '@/design-system/assets';
import { LandscapeSideNav, LandscapeTopBar, LandscapeWorldShell } from '@/design-system/landscape';
import {
  gamesMenuHref,
  homeHref,
  practiceMenuHref,
  rewardsHref,
} from '@/domain/navigation/routes';
import { useGuardedPush } from '@/hooks/useGuardedPush';
import { useGuardedReplace } from '@/hooks/useGuardedReplace';
import { testIds } from '@/testing/testIds';

export type HubId = 'home' | 'games' | 'practice';

export interface LandscapeHubFrameProps {
  hub: HubId;
  points: number;
  musicOn: boolean;
  onToggleMusic: () => void;
  onBrandLongPress?: () => void;
  onBrandShortPress?: () => void;
  children: ReactNode;
  testID?: string;
}

const SIDE_NAV: Record<
  HubId,
  {
    start: { label: string; href: typeof homeHref | typeof practiceMenuHref | typeof gamesMenuHref };
    end: { label: string; href: typeof homeHref | typeof practiceMenuHref | typeof gamesMenuHref };
  }
> = {
  home: {
    start: { label: 'תרגול דיבור', href: practiceMenuHref },
    end: { label: 'משחקים', href: gamesMenuHref },
  },
  games: {
    start: { label: 'בית', href: homeHref },
    end: { label: 'תרגול דיבור', href: practiceMenuHref },
  },
  practice: {
    start: { label: 'בית', href: homeHref },
    end: { label: 'משחקים', href: gamesMenuHref },
  },
};

/**
 * Shared landscape chrome for Home / Games / Practice hubs — Phase 18 shell
 * wired to Phase 19 replace-based hub switching. Inner hub content stays
 * unchanged (Phases 20–22 own visual redesign).
 */
export function LandscapeHubFrame({
  hub,
  points,
  musicOn,
  onToggleMusic,
  onBrandLongPress,
  onBrandShortPress,
  children,
  testID,
}: LandscapeHubFrameProps) {
  const replace = useGuardedReplace();
  const push = useGuardedPush();
  const sides = SIDE_NAV[hub];

  return (
    <LandscapeWorldShell
      variant={hub}
      world={hub}
      backgroundSource={landscapeBackgrounds[hub]}
      testID={testID}
      topBar={
        <LandscapeTopBar
          testID="landscape-hub-topbar"
          pointsTestID={testIds.nav.rewards}
          points={points}
          musicOn={musicOn}
          onToggleMusic={onToggleMusic}
          onBrandLongPress={onBrandLongPress}
          onBrandShortPress={onBrandShortPress}
          onPointsPress={() => push(rewardsHref)}
          showLogo
        />
      }
      sideNavStart={
        <LandscapeSideNav
          testID={testIds.nav.sideStart}
          label={sides.start.label}
          direction="backward"
          onPress={() => replace(sides.start.href)}
        />
      }
      sideNavEnd={
        <LandscapeSideNav
          testID={testIds.nav.sideEnd}
          label={sides.end.label}
          direction="forward"
          onPress={() => replace(sides.end.href)}
        />
      }
    >
      {children}
    </LandscapeWorldShell>
  );
}
