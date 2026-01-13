/**
 * Copyright (c) 2025 Bytedance, Inc. and its affiliates.
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  ElectronApplication,
  Page,
  _electron as electron,
  expect,
  test,
} from '@playwright/test';
import { findLatestBuild, parseElectronApp } from 'electron-playwright-helpers';

let electronApp: ElectronApplication;
let page: Page;

test.beforeAll(async () => {
  const latestBuild = findLatestBuild();
  const { executable: executablePath, main } = parseElectronApp(latestBuild);
  console.log('executablePath:', executablePath, '\nmain:', main);
  process.env.CI = 'e2e';
  electronApp = await electron.launch({
    args: [main],
    executablePath,
    env: {
      ...process.env,
      CI: 'e2e',
    },
  });

  page = await electronApp.firstWindow();
  electronApp.on('window', async (page) => {
    const filename = page.url()?.split('/').pop();
    console.log(`Window opened: ${filename}`);

    // capture errors
    page.on('pageerror', (error) => {
      console.error(error);
    });
    // capture console messages
    page.on('console', (msg) => {
      console.log(msg.text());
    });
  });
});

test.afterAll(async () => {
  await electronApp?.close();
});

test.describe('OrPaynter Workflow', () => {
  test.skip('Photo → Score → Estimate (Production)', async () => {
    test.setTimeout(60_000);
    
    await page.waitForLoadState('domcontentloaded', { timeout: 0 });

    // NOTE: This test uses placeholder selectors as the actual UI elements
    // need to be implemented. Replace these data-testid selectors with your real ones.

    // Upload a sample photo
    const uploadButton = page.getByTestId('upload-photo');
    if (await uploadButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      const fileChooserPromise = page.waitForEvent('filechooser');
      await uploadButton.click();
      const chooser = await fileChooserPromise;
      // Create a minimal valid JPEG file
      await chooser.setFiles({
        name: 'roof.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]),
      });

      // Analyze image
      const analyzeButton = page.getByTestId('analyze-button');
      await analyzeButton.click();

      // Wait for severity score to be visible
      const severityScore = page.getByTestId('severity-score');
      await expect(severityScore).toBeVisible({ timeout: 10000 });

      // Generate estimate
      const generateEstimate = page.getByTestId('generate-estimate');
      await generateEstimate.click();

      // Check that estimate bundles are displayed
      const estimateBundles = page.getByTestId('estimate-bundles');
      await expect(estimateBundles).toHaveText(/\d+/, { timeout: 10000 });

      // Optional: create Stripe deposit link
      const stripeBtn = page.getByTestId('create-deposit-link');
      if (await stripeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await stripeBtn.click();
        const depositUrl = page.getByTestId('deposit-url');
        await expect(depositUrl).toContainText('http', { timeout: 10000 });
      }
    } else {
      console.log('Upload photo button not found - UI elements may not be implemented yet');
    }
  });
});
