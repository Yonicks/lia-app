import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import { testIds } from '../../src/testing/testIds';
import { RESET_CONFIRM_TEXT, RESET_DELETES_TEXT, RESET_KEEPS_TEXT } from '../../src/domain/parent/progressReset';
import { auditReachability, auditTouchTargets, captureMatrix, openApp } from './_helpers';

const FIXTURE = readFileSync(resolve(__dirname, '../../../../docs/migration/fixtures/legacy-backup-v1.json'), 'utf8');

async function holdParent(page: Page, ms = 950): Promise<void> {
  const btn = page.getByTestId(testIds.parent.button);
  await expect(btn).toBeVisible();
  const box = await btn.boundingBox();
  expect(box).toBeTruthy();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(ms);
  await page.mouse.up();
}

async function unlockGate(page: Page): Promise<void> {
  const text = await page.getByTestId(testIds.parent.gateQuestion).innerText();
  const m = text.match(/(\d+)\s*×\s*(\d+)/);
  expect(m).toBeTruthy();
  const product = String(Number(m![1]) * Number(m![2]));
  for (const d of product) {
    await page.getByTestId(testIds.parent.gateKey(d)).click();
  }
  await page.getByTestId(testIds.parent.gateOk).click();
  await expect(page.getByTestId(testIds.parent.tab('settings'))).toBeVisible();
}

test.describe('Phase 12 parent centre', () => {
  test('hold opens the gate; short tap toasts; wrong stays locked; tabs and reset; leaving re-locks', async ({
    page,
  }) => {
    await openApp(page);
    await expect(page.getByTestId(testIds.home.root)).toBeVisible();

    await page.getByTestId(testIds.parent.button).click();
    await expect(page.getByTestId(testIds.parent.toast)).toBeVisible();
    await expect(page.getByTestId(testIds.parent.gateQuestion)).toHaveCount(0);

    const btn = page.getByTestId(testIds.parent.button);
    const box = await btn.boundingBox();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.down();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2 + 140, { steps: 8 });
    await page.waitForTimeout(950);
    await page.mouse.up();
    await expect(page.getByTestId(testIds.parent.gateQuestion)).toHaveCount(0);

    await holdParent(page);
    await expect(page.getByTestId(testIds.parent.gateQuestion)).toBeVisible();
    await captureMatrix(page, '12', 'parent-gate');

    await page.getByTestId(testIds.parent.gateKey('0')).click();
    await page.getByTestId(testIds.parent.gateOk).click();
    await expect(page.getByTestId(testIds.parent.gateQuestion)).toBeVisible();
    await expect(page.getByTestId(testIds.parent.tab('settings'))).toHaveCount(0);

    await unlockGate(page);
    await expect(page.getByTestId(testIds.parent.settingsRate(0.85))).toBeVisible();
    await captureMatrix(page, '12', 'parent-settings');

    await expect(page.getByTestId(testIds.parent.settingsLastBackup)).toContainText('עוד לא גובה');
    await expect(page.getByTestId(testIds.parent.settingsImport)).toContainText('החלפה מוחקת הכול קודם');

    await page.getByTestId(testIds.parent.settingsRate(0.6)).click();
    await page.getByTestId(testIds.parent.settingsMusicVol(0.25)).click();
    await page.getByTestId(testIds.parent.settingsNiqqud).click();

    await page.getByTestId(testIds.parent.settingsReset).click();
    await expect(page.getByTestId(testIds.parent.settingsResetConfirm)).toBeVisible();
    await expect(page.locator('body')).toContainText(RESET_CONFIRM_TEXT);
    await expect(page.locator('body')).toContainText(RESET_DELETES_TEXT);
    await expect(page.locator('body')).toContainText(RESET_KEEPS_TEXT);
    await captureMatrix(page, '12', 'parent-reset-confirm');

    await page.getByTestId(testIds.parent.tab('record')).click();
    await expect(page.getByTestId(testIds.parent.recordCategory)).toBeVisible();
    await expect(page.getByTestId(testIds.parent.recordWord(0))).toBeVisible();
    await captureMatrix(page, '12', 'parent-record');

    await page.getByTestId(testIds.parent.tab('words')).click();
    await expect(page.getByTestId(testIds.parent.wordsInput)).toBeVisible();
    await captureMatrix(page, '12', 'parent-words');

    await page.getByTestId(testIds.parent.tab('report')).click();
    await expect(page.getByTestId(testIds.parent.reportCategory('animals'))).toBeVisible();
    await captureMatrix(page, '12', 'parent-report');

    await page.getByTestId(testIds.parent.tab('method')).click();
    await expect(page.getByText('על מה מבוססים משחקי הדיבור')).toBeVisible();
    await captureMatrix(page, '12', 'parent-method');

    await page.getByTestId(testIds.parent.tab('settings')).click();
    await page.waitForFunction(() => Boolean((window as unknown as { __talkiStorageE2E?: unknown }).__talkiStorageE2E));
    const stored = await page.evaluate(async () => {
      const bridge = (window as unknown as { __talkiStorageE2E: { get<T>(key: string): Promise<T | null> } })
        .__talkiStorageE2E;
      return bridge.get<{ rate: number; musicVol: number; niqqud: boolean }>('lia:settings');
    });
    expect(stored?.rate).toBe(0.6);
    expect(stored?.musicVol).toBe(0.25);
    expect(stored?.niqqud).toBe(false);
    await expect(page.getByText('מדיניות פרטיות')).toBeVisible();

    await page.evaluate((json) => {
      (window as unknown as { __talkiBackupJson?: string }).__talkiBackupJson = json;
    }, FIXTURE);
    await page.getByTestId(testIds.parent.settingsImportMerge).click();

    await page.getByTestId(testIds.parent.gateBack).click();
    await expect(page.getByTestId(testIds.home.root)).toBeVisible();

    await holdParent(page);
    await expect(page.getByTestId(testIds.parent.gateQuestion)).toBeVisible();
    await expect(page.getByTestId(testIds.parent.tab('settings'))).toHaveCount(0);

    const touch = (await auditTouchTargets(page)).filter((v) => v.testId.startsWith('parent-'));
    expect(touch, JSON.stringify(touch)).toHaveLength(0);
    const reach = (await auditReachability(page)).filter((v) => v.testId.startsWith('parent-'));
    expect(reach, JSON.stringify(reach)).toHaveLength(0);
  });
});
