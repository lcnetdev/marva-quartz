// @ts-check
// Tests that we are able to add a default component to my library
import { test, expect } from '@playwright/test';

import * as jsonData from "@/../../tests-playwright/components/property_panel/marva_prefs_component_library.json"

//https://medium.com/@semihkasimoglu/leveraging-localstorage-and-sessionstorage-in-playwright-tests-with-typescript-949a4d0dee68

test('Can add a default component to my component library.', async ({ page }) => {
    await page.goto('http://localhost:5555/bfe2/quartz/');

    let storage = await page.evaluate(() => window.localStorage);
    // console.log("storage: ", storage)
    await page.evaluate(setPreference)

    await page.getByText('Click Here').click();
    await page.getByRole('button', { name: 'Monograph', exact: true }).nth(1).click();
    await page.locator('summary').filter({ hasText: 'library_add Defaults:' }).locator('span').nth(3).click();
    await page.getByRole('listitem').filter({ hasText: 'At headadd' }).getByRole('button').click();
    page.on('dialog', dialog => dialog.accept());
    await expect(page.locator('#app')).toContainText('At head [D]');


});

function setPreference(){
    console.log("data: ", jsonData)
    localStorage.setItem("marva-preferences", JSON.stringify(jsonData))
}