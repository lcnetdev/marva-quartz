// @ts-check
// Tests that we are able to add a default component to my library
import { test, expect } from '@playwright/test';

import { preferences } from './marva_prefs_component_library.json'


test('Can add a default component to my component library.', async ({ page }) => {
    // await page.goto('http://localhost:5555/marva/');

    // let prefs = JSON.stringify(preferences)
    // // Update the preferences for this test
    // await page.evaluate(prefs => localStorage.setItem("marva-preferences", prefs), prefs)
    // await page.reload();

    // // The test steps
    // await page.getByText('Click Here').click();
    // await page.getByRole('button', { name: 'Monograph', exact: true }).nth(1).click();
    // await page.locator('summary').filter({ hasText: 'library_add Defaults:' }).locator('span').nth(3).click();

    // // this has to be before the thing that triggers the dialogs
    // page.on('dialog', dialog => {
    //     console.log("Is this thing on?", dialog.message());
    //     dialog.accept();
    // }); // this doesn't work in Chromium, gut does work in Firefox

    // await page.getByRole('listitem').filter({ hasText: 'At headadd' }).getByRole('button').click();

    // await page.locator('summary').filter({ hasText: 'library_add Library: Instance' }).click();
    // await expect(page.locator('#app')).toContainText('At head [D]');

});

