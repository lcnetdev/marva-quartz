// @ts-check
// Tests that we are able to add a default component to my library
import { test, expect } from '@playwright/test';

import { preferences } from './marva_prefs_component_library.json'


test('Can add a default component to my component library.', async ({ page }) => {
      test.slow();

    await page.goto('http://localhost:5555/bfe2/quartz/');

    let prefs = JSON.stringify(preferences)
    // Update the preferences for this test
    await page.evaluate(prefs => localStorage.setItem("marva-preferences", prefs), prefs)
    await page.reload();

    // The test steps
    await page.getByText('Click Here').click();
    await page.getByRole('button', { name: 'Monograph', exact: true }).nth(1).click();
    await page.locator('summary').filter({ hasText: 'library_add Defaults:' }).locator('span').nth(3).click();

    // prompt doesnt work very well in playwright in chrome, so just overwrite the prompt function with what would happen
    await page.evaluate(() => window.prompt = function(){return "At head [D]"});

    await page.getByRole('listitem').filter({ hasText: 'At headadd' }).getByRole('button').click();

    await page.getByText('Library: Instance').click();

    await expect(page.getByRole('link', { name: 'At head [D]' })).toBeVisible();

});

