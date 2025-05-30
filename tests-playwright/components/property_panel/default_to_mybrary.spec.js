// @ts-check
// Tests that we are able to add a default component to my library
import { test, expect } from '@playwright/test';

// import jsonData from "@/../../tests-playwright/components/property_panel/marva_prefs_component_library.json"
import { preferences } from './marva_prefs_component_library.json'

//https://medium.com/@semihkasimoglu/leveraging-localstorage-and-sessionstorage-in-playwright-tests-with-typescript-949a4d0dee68
//https://adequatica.medium.com/simple-examples-of-using-playwright-evaluate-method-9b00d01cadc1

test('Can add a default component to my component library.', async ({ page }) => {
    await page.goto('http://localhost:5555/bfe2/quartz/');

    let prefs = JSON.stringify(preferences)
    // Update the preferences for this test
    console.log("preferences: ", prefs)
    await page.evaluate(prefs => localStorage.setItem("marva-preferences", prefs), prefs)

    await page.reload();

    await page.evaluate('window.localStorage');

    await page.getByText('Click Here').click();
    await page.getByRole('button', { name: 'Monograph', exact: true }).nth(1).click();
    await page.locator('summary').filter({ hasText: 'library_add Defaults:' }).locator('span').nth(3).click();
    await page.getByRole('listitem').filter({ hasText: 'At headadd' }).getByRole('button').click();
    page.on('dialog', dialog => dialog.accept());
    await expect(page.locator('#app')).toContainText('At head [D]');


});

