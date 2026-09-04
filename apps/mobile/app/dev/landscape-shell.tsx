import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { categoryIcons, homeAssets, landscapeBackgrounds } from '@/design-system/assets';
import {
  LandscapeActivityCard,
  LandscapeActivityGrid,
  LandscapeCategoryCard,
  LandscapeCategoryStrip,
  LandscapeHeroPanel,
  LandscapePageIndicator,
  LandscapeSideNav,
  LandscapeTitle,
  LandscapeTopBar,
  LandscapeWorldShell,
} from '@/design-system/landscape';
import { TalkiText } from '@/design-system/components';
import { v3 } from '@/design-system/theme/colors';
import { testIds } from '@/testing/testIds';

type Frame = 'home' | 'games' | 'practice';

const FIXTURE_CATEGORIES = [
  { id: 'food', title: 'אוכל', icon: categoryIcons.food },
  { id: 'animals', title: 'חיות', icon: categoryIcons.animals },
  { id: 'home', title: 'בית', icon: categoryIcons.home },
  { id: 'colors', title: 'צבעים', icon: categoryIcons.colors },
  { id: 'body', title: 'הגוף', icon: categoryIcons.body },
  { id: 'family', title: 'משפחה', icon: categoryIcons.family },
  { id: 'actions', title: 'פעולות', icon: categoryIcons.actions },
  { id: 'outside', title: 'בחוץ', icon: categoryIcons.outside },
] as const;

const FIXTURE_ACTIVITIES = [
  'כרטיס א',
  'כרטיס ב',
  'כרטיס ג',
  'כרטיס ד',
  'כרטיס ה',
  'כרטיס ו',
] as const;

/**
 * Phase 18 visual verification fixture — NOT a product screen.
 * Proves LandscapeWorldShell can represent Home / Games / Practice
 * compositions with registered production backgrounds and labeled neutral
 * activity cards. Never embeds docs/design/landscape/reference/*.png.
 */
export default function LandscapeShellFixture() {
  const [frame, setFrame] = useState<Frame>('home');
  const [musicOn, setMusicOn] = useState(true);
  const [page, setPage] = useState(0);

  return (
    <View style={styles.root} testID={testIds.landscapeShell.root}>
      <View style={styles.switcher}>
        {(['home', 'games', 'practice'] as const).map((name) => (
          <Pressable
            key={name}
            testID={testIds.landscapeShell.switcher(name)}
            accessibilityRole="button"
            accessibilityLabel={`מסגרת ${name}`}
            accessibilityState={{ selected: frame === name }}
            onPress={() => setFrame(name)}
            style={[styles.switchBtn, frame === name && styles.switchBtnActive]}
          >
            <TalkiText weight="bold" color={frame === name ? '#fff' : v3.purple700}>
              {name}
            </TalkiText>
          </Pressable>
        ))}
      </View>

      {frame === 'home' ? <HomeFrame musicOn={musicOn} onToggleMusic={() => setMusicOn((v) => !v)} /> : null}
      {frame === 'games' ? (
        <GamesFrame musicOn={musicOn} onToggleMusic={() => setMusicOn((v) => !v)} page={page} onPage={setPage} />
      ) : null}
      {frame === 'practice' ? (
        <PracticeFrame musicOn={musicOn} onToggleMusic={() => setMusicOn((v) => !v)} />
      ) : null}
    </View>
  );
}

function HomeFrame({ musicOn, onToggleMusic }: { musicOn: boolean; onToggleMusic: () => void }) {
  return (
    <LandscapeWorldShell
      testID={testIds.landscapeShell.frame('home')}
      variant="home"
      world="home"
      backgroundSource={landscapeBackgrounds.home}
      topBar={
        <LandscapeTopBar
          testID={testIds.landscapeShell.topBar('home')}
          points={92}
          musicOn={musicOn}
          onToggleMusic={onToggleMusic}
          showLogo
        />
      }
      sideNavStart={
        <LandscapeSideNav
          testID={testIds.landscapeShell.sideStart('home')}
          label="תרגול דיבור"
          direction="backward"
        />
      }
      sideNavEnd={
        <LandscapeSideNav
          testID={testIds.landscapeShell.sideEnd('home')}
          label="משחקים"
          direction="forward"
        />
      }
    >
      <View style={styles.homeBody}>
        <LandscapeHeroPanel
          testID={testIds.landscapeShell.hero}
          eyebrow="ממשיכים עם"
          title="רגשות"
          subtitle="עוד מילים לכוכב הבא"
          progress={0.8}
          progressLabel="8/10"
          ctaLabel="המשך ללמוד"
          mascot={homeAssets.heroStar}
        />
        <LandscapeCategoryStrip testID={testIds.landscapeShell.strip}>
          {FIXTURE_CATEGORIES.map((c) => (
            <LandscapeCategoryCard key={c.id} title={c.title} image={c.icon} />
          ))}
        </LandscapeCategoryStrip>
      </View>
    </LandscapeWorldShell>
  );
}

function GamesFrame({
  musicOn,
  onToggleMusic,
  page,
  onPage,
}: {
  musicOn: boolean;
  onToggleMusic: () => void;
  page: number;
  onPage: (i: number) => void;
}) {
  return (
    <LandscapeWorldShell
      testID={testIds.landscapeShell.frame('games')}
      variant="games"
      world="games"
      backgroundSource={landscapeBackgrounds.games}
      topBar={
        <LandscapeTopBar
          testID={testIds.landscapeShell.topBar('games')}
          points={92}
          musicOn={musicOn}
          onToggleMusic={onToggleMusic}
          showLogo
        />
      }
      titleSlot={
        <LandscapeTitle
          testID={testIds.landscapeShell.title('games')}
          title="משחקים"
          subtitle="בואו נשחק, נחשוב ונלמד ביחד"
        />
      }
      sideNavStart={
        <LandscapeSideNav testID={testIds.landscapeShell.sideStart('games')} label="בית" direction="backward" />
      }
      sideNavEnd={
        <LandscapeSideNav testID={testIds.landscapeShell.sideEnd('games')} label="משחקים" direction="forward" />
      }
      auxiliary={
        <LandscapePageIndicator
          testID={testIds.landscapeShell.pageIndicator}
          pageCount={2}
          activeIndex={page}
          onSelect={onPage}
        />
      }
    >
      <LandscapeActivityGrid testID={testIds.landscapeShell.grid('games')}>
        {FIXTURE_ACTIVITIES.map((title) => (
          <LandscapeActivityCard key={title} title={title} footerVariant="pill" />
        ))}
      </LandscapeActivityGrid>
    </LandscapeWorldShell>
  );
}

function PracticeFrame({ musicOn, onToggleMusic }: { musicOn: boolean; onToggleMusic: () => void }) {
  return (
    <LandscapeWorldShell
      testID={testIds.landscapeShell.frame('practice')}
      variant="practice"
      world="practice"
      backgroundSource={landscapeBackgrounds.practice}
      topBar={
        <LandscapeTopBar
          testID={testIds.landscapeShell.topBar('practice')}
          points={92}
          musicOn={musicOn}
          onToggleMusic={onToggleMusic}
          showLogo
        />
      }
      titleSlot={
        <LandscapeTitle
          testID={testIds.landscapeShell.title('practice')}
          title="תרגול דיבור"
          subtitle="בואו נתרגל לדבר, להבין ולבטא מילים ומשפטים"
        />
      }
      sideNavStart={
        <LandscapeSideNav
          testID={testIds.landscapeShell.sideStart('practice')}
          label="בית"
          direction="backward"
        />
      }
      sideNavEnd={
        <LandscapeSideNav
          testID={testIds.landscapeShell.sideEnd('practice')}
          label="משחקים"
          direction="forward"
        />
      }
    >
      <LandscapeActivityGrid testID={testIds.landscapeShell.grid('practice')}>
        {FIXTURE_ACTIVITIES.map((title) => (
          <LandscapeActivityCard key={title} title={title} footerVariant="banner" />
        ))}
      </LandscapeActivityGrid>
    </LandscapeWorldShell>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  switcher: {
    position: 'absolute',
    bottom: 4,
    end: 4,
    zIndex: 20,
    flexDirection: 'row',
    gap: 4,
  },
  switchBtn: {
    minWidth: 48,
    minHeight: 48,
    paddingInline: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: v3.purple200,
  },
  switchBtnActive: {
    backgroundColor: v3.purple600,
  },
  homeBody: {
    flex: 1,
    minHeight: 0,
    justifyContent: 'space-between',
    gap: 8,
  },
});
