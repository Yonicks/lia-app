import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { categoryIcons, uiIcons } from '@/design-system/assets';
import { categoryTheme } from '@/design-system/categoryTheme';
import {
  TalkiButton,
  TalkiCard,
  TalkiHeading,
  TalkiIconButton,
  TalkiImageCard,
  TalkiPill,
  TalkiProgress,
  TalkiScreen,
  TalkiText,
} from '@/design-system/components';
import { colors } from '@/design-system/theme/colors';
import { GameHeader, ParentGate, RewardOverlay, ToastHost, TopBar } from '@/components/shell';
import { LandscapeSideNav } from '@/design-system/landscape';
import { testIds } from '@/testing/testIds';

/**
 * Developer-only component gallery — deliberately unreachable from any
 * child-facing navigation (phase-05-plan.md "The gallery is a test surface,
 * not documentation"). Renders every design-system primitive and shell
 * component in every documented state so `toHaveScreenshot()` has something
 * to baseline per group, at all ten viewports, and so a reviewer can see the
 * whole system on one screen.
 *
 * Not gated behind __DEV__/Platform.OS — like audio-lab.tsx, Tier 2 exercises
 * it through the real exported web bundle, so it must actually render there.
 * Its "developer-only" property comes entirely from no navigation ever
 * linking to it.
 */
export default function Gallery() {
  const [musicOn, setMusicOn] = useState(false);
  const [parentGateOpen, setParentGateOpen] = useState(false);
  const [rewardOpen, setRewardOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  return (
    <TalkiScreen testID={testIds.gallery.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <Section id="typography" title="Typography">
          <TalkiHeading level={1}>כותרת ראשית — Rubik 800</TalkiHeading>
          <TalkiHeading level={2} weight="black">
            כותרת משנה — Rubik 900
          </TalkiHeading>
          <TalkiHeading level={3} weight="medium">
            כותרת שלישית — Rubik 500
          </TalkiHeading>
          <TalkiText weight="regular">גוף טקסט רגיל — Assistant 400.</TalkiText>
          <TalkiText weight="semibold">גוף טקסט מודגש למחצה — Assistant 600.</TalkiText>
          <TalkiText weight="bold">גוף טקסט מודגש — Assistant 700.</TalkiText>
          <TalkiText weight="extrabold">גוף טקסט מודגש מאוד — Assistant 800.</TalkiText>

          <View
            testID={testIds.gallery.typography.rtlSample}
            style={{ flexDirection: 'row', marginTop: 12 }}
          >
            <TalkiText testID={testIds.gallery.typography.rtlFirstChar} weight="extrabold" color={colors.v3.pink500}>
              ש
            </TalkiText>
            <TalkiText testID={testIds.gallery.typography.rtlRest}>לום עולם</TalkiText>
          </View>

          <TalkiText testID={testIds.gallery.typography.fontProbeBody} weight="regular" style={{ marginTop: 8 }}>
            Assistant_400Regular probe
          </TalkiText>
          <TalkiHeading testID={testIds.gallery.typography.fontProbeHeading} level={3}>
            Rubik_700Bold probe
          </TalkiHeading>
        </Section>

        <Section id="buttons" title="Buttons">
          <View style={styles.row}>
            <TalkiButton testID={testIds.gallery.buttons.primary} label="ראשי" variant="primary" onPress={() => {}} />
            <TalkiButton
              testID={testIds.gallery.buttons.secondary}
              label="משני"
              variant="secondary"
              onPress={() => {}}
            />
            <TalkiButton testID={testIds.gallery.buttons.ghost} label="שקוף" variant="ghost" onPress={() => {}} />
            <TalkiButton testID={testIds.gallery.buttons.disabled} label="מושבת" disabled onPress={() => {}} />
          </View>
          <View style={styles.row}>
            <TalkiIconButton
              testID={testIds.gallery.buttons.icon}
              icon={uiIcons.speaker}
              accessibilityLabel="השמעה"
              onPress={() => {}}
            />
          </View>
        </Section>

        <Section id="cards" title="Cards">
          <View style={styles.row}>
            <TalkiCard testID={testIds.gallery.cards.plain} style={{ width: 160 }}>
              <TalkiText>כרטיס סטטי</TalkiText>
            </TalkiCard>
            <TalkiCard testID={testIds.gallery.cards.pressable} onPress={() => {}} style={{ width: 160 }}>
              <TalkiText>כרטיס לחיץ</TalkiText>
            </TalkiCard>
          </View>
          <View style={styles.grid}>
            {(Object.keys(categoryIcons) as (keyof typeof categoryIcons)[]).map((id) => (
              <TalkiImageCard
                key={id}
                testID={testIds.gallery.cards.image(id)}
                title={id}
                icon={categoryIcons[id]}
                gradientFrom={categoryTheme[id].gradientFrom}
                gradientTo={categoryTheme[id].gradientTo}
                progress={0.6}
                onPress={() => {}}
              />
            ))}
          </View>
        </Section>

        <Section id="progress" title="Progress">
          <TalkiProgress testID={testIds.gallery.progress.bar(0)} value={0} />
          <TalkiProgress testID={testIds.gallery.progress.bar(45)} value={0.45} />
          <TalkiProgress testID={testIds.gallery.progress.bar(100)} value={1} />
          <TalkiPill testID={testIds.gallery.progress.pill} label="12/26" />
        </Section>

        <Section id="shell" title="Shell">
          <TopBar
            testID={testIds.gallery.shell.topBar}
            points={128}
            musicOn={musicOn}
            onToggleMusic={() => setMusicOn((v) => !v)}
          />
          <View style={{ height: 12 }} />
          <GameHeader
            testID={testIds.gallery.shell.gameHeader}
            title="משחק זיכרון"
            progress={0.4}
            onBack={() => {}}
          />
          <View style={{ height: 12 }} />
          <LandscapeSideNav
            testID={testIds.gallery.shell.sideNav}
            label="משחקים"
            direction="forward"
            onPress={() => {}}
          />
          <View style={styles.row}>
            <TalkiButton
              testID={testIds.gallery.shell.parentGateOpenButton}
              label="פתח מסך הורים"
              variant="secondary"
              onPress={() => setParentGateOpen(true)}
            />
            <TalkiButton
              testID={testIds.gallery.shell.rewardOpenButton}
              label="פתח מסך פרס"
              variant="secondary"
              onPress={() => setRewardOpen(true)}
            />
            <TalkiButton
              testID={testIds.gallery.shell.toastShowButton}
              label="הצג הודעה"
              variant="secondary"
              onPress={() => setToastMessage('גיבוי נשמר')}
            />
          </View>
          <ParentGate
            testID={testIds.gallery.shell.parentGate}
            visible={parentGateOpen}
            question="7 × 4 = ?"
            onConfirm={() => setParentGateOpen(false)}
            onCancel={() => setParentGateOpen(false)}
          />
          <RewardOverlay
            testID={testIds.gallery.shell.rewardOverlay}
            visible={rewardOpen}
            title="כל הכבוד!"
            message="סיימת את הקטגוריה"
            onDismiss={() => setRewardOpen(false)}
          />
          <ToastHost
            testID={testIds.gallery.shell.toastHost}
            message={toastMessage}
            onHide={() => setToastMessage(null)}
          />
        </Section>

        <Section id="colors" title="Colors">
          <TalkiHeading level={3}>V2</TalkiHeading>
          <View style={styles.grid}>
            {Object.entries(colors.v2).map(([name, hex]) => (
              <Swatch key={name} name={name} hex={hex} />
            ))}
          </View>
          <TalkiHeading level={3} style={{ marginTop: 12 }}>
            V3
          </TalkiHeading>
          <View style={styles.grid}>
            {Object.entries(colors.v3).map(([name, hex]) => (
              <Swatch key={name} name={name} hex={hex} />
            ))}
          </View>
          <TalkiHeading level={3} style={{ marginTop: 12 }}>
            Category
          </TalkiHeading>
          <View style={styles.grid}>
            {Object.entries(colors.category).map(([name, pair]) => (
              <Swatch key={name} name={name} hex={pair.from} />
            ))}
          </View>
        </Section>
      </ScrollView>
    </TalkiScreen>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <View testID={testIds.gallery.group(id)} style={styles.section}>
      <TalkiHeading level={2}>{title}</TalkiHeading>
      {children}
    </View>
  );
}

function Swatch({ name, hex }: { name: string; hex: string }) {
  return (
    <View testID={testIds.gallery.colors.swatch(name)} style={styles.swatch}>
      <View style={[styles.swatchColor, { backgroundColor: hex }]} />
      <TalkiText style={{ fontSize: 11 }}>{name}</TalkiText>
      <TalkiText style={{ fontSize: 10 }} color={colors.v3.textMuted}>
        {hex}
      </TalkiText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 8,
    paddingBottom: 80,
  },
  section: {
    marginBottom: 28,
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  swatch: {
    width: 92,
    alignItems: 'center',
    gap: 2,
  },
  swatchColor: {
    width: 60,
    height: 60,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.v2.line,
  },
});
