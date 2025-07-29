// @ts-check
// Testss for the Subject builder
import { test, expect } from '@playwright/test';
import { preferences } from '../../configs/subjectBuilderConfig.json'

/**
 * Preferences sets panel display:
 * xml: true
 * marc: true
 * marc html: true
 */


test('Find simple heading "Dogs" with correct XML and MARC', async ({ page }) => {
    await page.goto('http://localhost:5555/bfe2/quartz/');

    // Update the preferences for this test
    let prefs = JSON.stringify(preferences)
    await page.evaluate(prefs => localStorage.setItem("marva-preferences", prefs), prefs)
    await page.reload();

    await page.getByText('Click Here').click();
    await page.getByRole('button', { name: 'Monograph', exact: true }).nth(1).click();
    await page.locator('form').filter({ hasText: 'Search LCSH/LCNAF' }).getByRole('textbox').click();
    await page.locator('form').filter({ hasText: 'Search LCSH/LCNAFbolt' }).getByRole('textbox').fill('d');
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).fill('dogs');
    // await page.getByText('Dogs', { exact: true }).first().click();
    await page.locator('div').filter({ hasText: /^Dogs \(Auth Hd\) public$/ }).locator('span').nth(1).click();
    await expect(page.getByText('sh85038796')).toBeVisible();

    await page.getByRole('button', { name: 'Add [SHIFT+Enter]' }).click();
    await page.getByText('bf:Work').click();
    await expect(page.locator('.child-elements > div > div > div:nth-child(2)').first()).toBeVisible();
    await expect(page.locator('#app')).toContainText('http://id.loc.gov/authorities/subjects/sh85038796');
    await page.locator('.splitpanes__pane.edit-main-splitpane-xml').click({
        button: 'middle'
    });
    await expect(page.locator('#app')).toContainText('150 $aDogs');
    await expect(page.locator('#app')).toContainText('650 0 $a Dogs $0 http://id.loc.gov/authorities/subjects/sh85038796');
});


test('Build heading "Dogs--History" with correct XML and MARC', async ({ page }) => {
    // in Firefox this test is very inconsistent. It usually passes, but sometimes fails as different points
    await page.goto('http://localhost:5555/bfe2/quartz/');

    // Update the preferences for this test
    let prefs = JSON.stringify(preferences)
    await page.evaluate(prefs => localStorage.setItem("marva-preferences", prefs), prefs)
    await page.reload();

    await page.getByText('Click Here').click();
    await page.getByRole('button', { name: 'Monograph', exact: true }).nth(1).click();

    await page.locator('div').filter({ hasText: /^Search LCSH\/LCNAF$/ }).nth(2).click();
    await page.locator('form').filter({ hasText: 'Search LCSH/LCNAFbolt' }).getByRole('textbox').fill('d');
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).fill('dogs');
    await page.locator('div').filter({ hasText: /^Dogs \(Auth Hd\) public$/ }).locator('span').nth(1).click();
    await expect(page.getByRole('heading')).toContainText('sh85038796');
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).click();
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).fill('Dogs--history');
    await page.getByText('History', { exact: true }).first().click();
    await expect(page.getByRole('heading')).toContainText('sh99005024');
    await page.getByRole('button', { name: 'Add [SHIFT+Enter]' }).click();
    await page.getByText('bf:Work').click();
    await expect(page.locator('#app')).toContainText('150 $aDogs');
    await expect(page.locator('#app')).toContainText('180 $xHistory');
    await expect(page.locator('#app')).toContainText('Dogs--History');
    await expect(page.locator('#app')).toContainText('http://id.loc.gov/authorities/subjects/sh85038796');
    await expect(page.locator('#app')).toContainText('http://id.loc.gov/authorities/subjects/sh99005024');
    await expect(page.locator('#app')).toContainText('650 0 $a Dogs $x History');
});

// look for complex subjects
test('select a complex heading with correct XML and MARC', async ({ page }) => {
    await page.goto('http://localhost:5555/bfe2/quartz/');

    // Update the preferences for this test
    let prefs = JSON.stringify(preferences)
    await page.evaluate(prefs => localStorage.setItem("marva-preferences", prefs), prefs)
    await page.reload();

    await page.getByText('Click Here').click();
    await page.getByRole('button', { name: 'Monograph', exact: true }).nth(1).click();

    await page.locator('div').filter({ hasText: /^Search LCSH\/LCNAF$/ }).nth(2).click();
    await page.locator('form').filter({ hasText: 'Search LCSH/LCNAFbolt' }).getByRole('textbox').fill('u');
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).fill('dogs');
    await page.getByText('Dogs--Abnormalities', { exact: true }).click();
    await expect(page.getByRole('heading')).toContainText('sh2007005769');
    await page.getByRole('button', { name: 'Add [SHIFT+Enter]' }).click();
    await page.getByText('bf:Work').click();
    await expect(page.locator('#app')).toContainText('Dogs‑‑Abnormalities');
    await expect(page.locator('#app')).toContainText('150 $aDogs$xAbnormalities');
    await expect(page.locator('#app')).toContainText('http://id.loc.gov/authorities/subjects/sh2007005769');
    await expect(page.locator('#app')).toContainText('650 0 $a Dogs $x Abnormalities $0 http://id.loc.gov/authorities/subjects/sh2007005769');
});

test('add subdivision to a complex heading with correct XML and MARC', async ({ page }) => {
    await page.goto('http://localhost:5555/bfe2/quartz/');

    // Update the preferences for this test
    let prefs = JSON.stringify(preferences)
    await page.evaluate(prefs => localStorage.setItem("marva-preferences", prefs), prefs)
    await page.reload();

    await page.getByText('Click Here').click();
    await page.getByRole('button', { name: 'Monograph', exact: true }).nth(1).click();

    await page.locator('form').filter({ hasText: 'Search LCSH/LCNAF' }).getByRole('textbox').click();
    await page.locator('form').filter({ hasText: 'Search LCSH/LCNAFbolt' }).getByRole('textbox').fill('w');
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).fill('whales');
    await page.getByText('Whales--Anatomy').click();
    await expect(page.getByRole('heading')).toContainText('sh85146353');
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).click();
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).fill('Whales‑‑Anatomy--history');
    await page.getByText('History', { exact: true }).first().click();
    await expect(page.getByRole('heading')).toContainText('sh99005024');
    await page.getByRole('button', { name: 'Add [SHIFT+Enter]' }).click();
    await page.getByText('bf:Work').click();
    await expect(page.locator('#app')).toContainText('Whales--Anatomy--History');
    await expect(page.locator('#app')).toContainText('150 $aWhales');
    await expect(page.locator('#app')).toContainText('180 $xAnatomy');
    await expect(page.locator('#app')).toContainText('180 $xHistory');
    await expect(page.locator('#app')).toContainText('http://id.loc.gov/authorities/subjects/sh85146352');
    await expect(page.locator('#app')).toContainText('http://id.loc.gov/authorities/subjects/sh99002319');
    await expect(page.locator('#app')).toContainText('http://id.loc.gov/authorities/subjects/sh99005024');
    await expect(page.locator('#app')).toContainText('650 0 $a Whales $x Anatomy $x History');
});

test('Write the entire string before validation', async ({ page }) => {
    await page.goto('http://localhost:5555/bfe2/quartz/');

    // Update the preferences for this test
    let prefs = JSON.stringify(preferences)
    await page.evaluate(prefs => localStorage.setItem("marva-preferences", prefs), prefs)
    await page.reload();

    await page.getByText('Click Here').click();
    await page.getByRole('button', { name: 'Monograph', exact: true }).nth(1).click();

    await page.locator('form').filter({ hasText: 'Search LCSH/LCNAF' }).getByRole('textbox').click();
    await page.locator('form').filter({ hasText: 'Search LCSH/LCNAFbolt' }).getByRole('textbox').fill('d');
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).fill('dogs--portugal--porto--history');
    await page.getByText('History', { exact: true }).first().click();
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).click();
    // playwright plugin does not work well with the mouse
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).press('ControlOrMeta+ArrowLeft');
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).press('ControlOrMeta+ArrowLeft');
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).press('ControlOrMeta+ArrowLeft');
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).press('ControlOrMeta+ArrowLeft');
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).press('ControlOrMeta+ArrowLeft');
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).press('ControlOrMeta+ArrowLeft');
    // await page.getByText('Dogs', { exact: true }).first().click();
    await page.locator('div').filter({ hasText: /^Dogs \(Auth Hd\) public$/ }).locator('span').nth(1).click();
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).press('ControlOrMeta+ArrowLeft');
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).press('ControlOrMeta+ArrowLeft');
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).press('Alt+ControlOrMeta+3');
    await page.getByText('Portugal--Porto', { exact: true }).click();
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).click();
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).press('Alt+ControlOrMeta+3');  // clicking doesn't work for some reason
    await page.getByRole('button', { name: 'Add [SHIFT+Enter]' }).click();
    await page.getByText('bf:Work').click();
    await expect(page.locator('#app')).toContainText('Dogs--Portugal--Porto--History');
    await expect(page.locator('#app')).toContainText('150 $aDogs');
    await expect(page.locator('#app')).toContainText('181 $zPortugal$zPorto');
    await expect(page.locator('#app')).toContainText('180 $xHistory');
    await expect(page.locator('#app')).toContainText('http://id.loc.gov/authorities/subjects/sh85038796');
    await expect(page.locator('#app')).toContainText('http://id.loc.gov/authorities/names/n50006403-781');
    await expect(page.locator('#app')).toContainText('http://id.loc.gov/authorities/subjects/sh99005024');
    await expect(page.locator('#app')).toContainText('650 0 $a Dogs $z Portugal $z Porto $x History');
});

test('Validate string as each piece is written', async ({ page }) => {
    await page.goto('http://localhost:5555/bfe2/quartz/');

    // Update the preferences for this test
    let prefs = JSON.stringify(preferences)
    await page.evaluate(prefs => localStorage.setItem("marva-preferences", prefs), prefs)
    await page.reload();

    await page.getByText('Click Here').click();
    await page.getByRole('button', { name: 'Monograph', exact: true }).nth(1).click();

    await page.locator('form').filter({ hasText: 'Search LCSH/LCNAF' }).getByRole('textbox').click();
    await page.locator('form').filter({ hasText: 'Search LCSH/LCNAFbolt' }).getByRole('textbox').fill('d');
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).fill('dogs');
    await page.getByText('Dogs', { exact: true }).first().click();
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).press('Alt+ControlOrMeta+3');  // clicking doesn't work for some reason
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).fill('Dogs--portugal‑‑porto');
    await page.getByText('Portugal--Porto', { exact: true }).click();
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).press('Alt+ControlOrMeta+1');  // clicking doesn't work for some reason
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).fill('Dogs--Portugal‑‑Porto--history');
    await page.getByText('History', { exact: true }).first().click();
    await page.getByRole('button', { name: 'Add [SHIFT+Enter]' }).click();
    await page.getByText('bf:Work').click();
    await expect(page.locator('#app')).toContainText('Dogs--Portugal--Porto--History');
    await expect(page.locator('#app')).toContainText('150 $aDogs');
    await expect(page.locator('#app')).toContainText('180 $xHistory');
    await expect(page.locator('#app')).toContainText('181 $zPortugal$zPorto');
    await expect(page.locator('#app')).toContainText('http://id.loc.gov/authorities/subjects/sh85038796');
    await expect(page.locator('#app')).toContainText('http://id.loc.gov/authorities/names/n50006403-781');
    await expect(page.locator('#app')).toContainText('http://id.loc.gov/authorities/subjects/sh99005024');
    await expect(page.locator('#app')).toContainText('650 0 $a Dogs $z Portugal $z Porto $x History');
});

// Look for complex subdivisions
test('add complex subdivision, type whole thing and then select the subdivision', async ({ page }) => {
    await page.goto('http://localhost:5555/bfe2/quartz/');

    // Update the preferences for this test
    let prefs = JSON.stringify(preferences)
    await page.evaluate(prefs => localStorage.setItem("marva-preferences", prefs), prefs)
    await page.reload();

    await page.getByText('Click Here').click();
    await page.getByRole('button', { name: 'Monograph', exact: true }).nth(1).click();

    await page.locator('form').filter({ hasText: 'Search LCSH/LCNAF' }).getByRole('textbox').click();
    await page.locator('form').filter({ hasText: 'Search LCSH/LCNAFbolt' }).getByRole('textbox').fill('d');
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).fill('dogs');
    await page.getByText('Dogs', { exact: true }).first().click();
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).fill('Dogs--history--20th');
    await page.getByText('History--20th century').click();
    await expect(page.getByRole('heading')).toContainText('sh2002006165');
    await page.getByRole('button', { name: 'Add [SHIFT+Enter]' }).click();
    await page.getByText('bf:Work').click();
    await expect(page.locator('#app')).toContainText('Dogs--History--20th century');
    await expect(page.locator('#app')).toContainText('150 $aDogs');
    await expect(page.locator('#app')).toContainText('180 $xHistory');
    await expect(page.locator('#app')).toContainText('182 $y20th century');
    await expect(page.locator('#app')).toContainText('650 0 $a Dogs $x History $y 20th century');
});

test('add complex subdivision, type first part of subdivision and then select the whole subdivision', async ({ page }) => {
    await page.goto('http://localhost:5555/bfe2/quartz/');

    // Update the preferences for this test
    let prefs = JSON.stringify(preferences)
    await page.evaluate(prefs => localStorage.setItem("marva-preferences", prefs), prefs)
    await page.reload();

    await page.getByText('Click Here').click();
    await page.getByRole('button', { name: 'Monograph', exact: true }).nth(1).click();

    await page.locator('form').filter({ hasText: 'Search LCSH/LCNAF' }).getByRole('textbox').click();
    await page.locator('form').filter({ hasText: 'Search LCSH/LCNAFbolt' }).getByRole('textbox').fill('d');
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).fill('dogs');
    await page.getByText('Dogs', { exact: true }).first().click();
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).fill('Dogs--history');
    await page.getByText('History--20th century').click();
    await expect(page.getByRole('heading')).toContainText('sh2002006165');
    await page.getByRole('button', { name: 'Add [SHIFT+Enter]' }).click();
    await page.getByText('bf:Work').click();
    await expect(page.locator('#app')).toContainText('Dogs--History--20th century');
    await expect(page.locator('#app')).toContainText('150 $aDogs');
    await expect(page.locator('#app')).toContainText('180 $xHistory');
    await expect(page.locator('#app')).toContainText('182 $y20th century');
    await expect(page.locator('#app')).toContainText('650 0 $a Dogs $x History $y 20th century');
});

// Test headings with Hierarchical Geographic
test('Build heading "Dogs--geo", but the geo headings is typed before selecting "Hierarchical Geo" with correct XML and MARC', async ({ page }) => {
    await page.goto('http://localhost:5555/bfe2/quartz/');

    // Update the preferences for this test
    let prefs = JSON.stringify(preferences)
    await page.evaluate(prefs => localStorage.setItem("marva-preferences", prefs), prefs)
    await page.reload();

    await page.getByText('Click Here').click();
    await page.getByRole('button', { name: 'Monograph', exact: true }).nth(1).click();

    await page.locator('form').filter({ hasText: 'Search LCSH/LCNAF' }).getByRole('textbox').click();
    await page.locator('form').filter({ hasText: 'Search LCSH/LCNAFbolt' }).getByRole('textbox').fill('d');
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).fill('dogs');
    await page.getByText('Dogs', { exact: true }).first().click();
    await expect(page.getByRole('heading')).toContainText('sh85038796');
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).click();
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).fill('Dogs--portugal--porto');
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).press('Alt+ControlOrMeta+3');  // clicking doesn't work for some reason
    await page.getByText('Portugal--Porto', { exact: true }).click();
    await expect(page.getByRole('heading')).toContainText('n50006403-781');
    await page.getByRole('button', { name: 'Add [SHIFT+Enter]' }).click();
    await page.getByText('bf:Work').click();
    await expect(page.locator('#app')).toContainText('Dogs--Portugal--Porto');
    await expect(page.locator('#app')).toContainText('150 $aDogs');
    await expect(page.locator('#app')).toContainText('181 $zPortugal$zPorto');
    await expect(page.locator('#app')).toContainText('http://id.loc.gov/authorities/subjects/sh85038796');
    await expect(page.locator('#app')).toContainText('http://id.loc.gov/authorities/names/n50006403-781');
    await expect(page.locator('#app')).toContainText('650 0 $a Dogs $z Portugal $z Porto');
});


test('Build heading "Dogs--geo", but the geo headings is typed after selecting "Hierarchical Geo" with correct XML and MARC', async ({ page }) => {
    await page.goto('http://localhost:5555/bfe2/quartz/');

    // Update the preferences for this test
    let prefs = JSON.stringify(preferences)
    await page.evaluate(prefs => localStorage.setItem("marva-preferences", prefs), prefs)
    await page.reload();

    await page.getByText('Click Here').click();
    await page.getByRole('button', { name: 'Monograph', exact: true }).nth(1).click();

    await page.locator('form').filter({ hasText: 'Search LCSH/LCNAF' }).getByRole('textbox').click();
    await page.locator('form').filter({ hasText: 'Search LCSH/LCNAFbolt' }).getByRole('textbox').fill('d');
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).fill('dogs');
    await page.getByText('Dogs', { exact: true }).first().click();
    await expect(page.getByRole('heading')).toContainText('sh85038796');
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).press('Alt+ControlOrMeta+3');  // clicking doesn't work for some reason
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).fill('Dogs--portugal‑‑porto');
    await page.getByText('Portugal--Porto', { exact: true }).click();
    await expect(page.getByRole('heading')).toContainText('n50006403-781');
    await page.getByRole('button', { name: 'Add [SHIFT+Enter]' }).click();
    await page.getByText('bf:Work').click();
    await expect(page.locator('#app')).toContainText('Dogs--Portugal--Porto');
    await expect(page.locator('#app')).toContainText('150 $aDogs');
    await expect(page.locator('#app')).toContainText('181 $zPortugal$zPorto');
    await expect(page.locator('#app')).toContainText('http://id.loc.gov/authorities/subjects/sh85038796');
    await expect(page.locator('#app')).toContainText('http://id.loc.gov/authorities/names/n50006403-781');
    await expect(page.locator('#app')).toContainText('650 0 $a Dogs $z Portugal $z Porto');
});

test('Build heading "Dogs--geo", but the first part of the geo heading is selected from LCSH and then swap to Hierarchical before finishing the heading with correct XML and MARC', async ({ page }) => {
    await page.goto('http://localhost:5555/bfe2/quartz/');

    // Update the preferences for this test
    let prefs = JSON.stringify(preferences)
    await page.evaluate(prefs => localStorage.setItem("marva-preferences", prefs), prefs)
    await page.reload();

    await page.getByText('Click Here').click();
    await page.getByRole('button', { name: 'Monograph', exact: true }).nth(1).click();

    await page.locator('form').filter({ hasText: 'Search LCSH/LCNAF' }).getByRole('textbox').click();
    await page.locator('form').filter({ hasText: 'Search LCSH/LCNAFbolt' }).getByRole('textbox').fill('d');
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).fill('dogs');
    await page.locator('div').filter({ hasText: /^Dogs \(Auth Hd\) public$/ }).locator('span').nth(1).click();
    await expect(page.getByRole('heading')).toContainText('sh85038796');
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).click();
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).fill('Dogs--portugal');
    await page.getByText('Portugal', { exact: true }).first().click();
    await expect(page.getByRole('heading')).toContainText('n80049716-781');
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).press('Alt+ControlOrMeta+3');  // clicking doesn't work for some reason

    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).fill('Dogs--Portugal‑‑porto');
    await page.getByText('Portugal--Porto', { exact: true }).click();
    await expect(page.getByRole('heading')).toContainText('n50006403-781');
    await page.getByRole('button', { name: 'Add [SHIFT+Enter]' }).click();
    await page.getByText('bf:Work').click();
    await expect(page.locator('#app')).toContainText('Dogs--Portugal--Porto');
    await expect(page.locator('#app')).toContainText('150 $aDogs');
    await expect(page.locator('#app')).toContainText('181 $zPortugal$zPorto');
    await expect(page.locator('#app')).toContainText('http://id.loc.gov/authorities/subjects/sh85038796');
    await expect(page.locator('#app')).toContainText('http://id.loc.gov/authorities/names/n50006403-781');
    await expect(page.locator('#app')).toContainText('650 0 $a Dogs $z Portugal $z Porto');
});

test('Build heading "Dogs--geo", but the first part of the geo heading is selected from LCSH and finish the heading before swapping to Hierarchical with correct XML and MARC', async ({ page }) => {
    await page.goto('http://localhost:5555/bfe2/quartz/');

    // Update the preferences for this test
    let prefs = JSON.stringify(preferences)
    await page.evaluate(prefs => localStorage.setItem("marva-preferences", prefs), prefs)
    await page.reload();

    await page.getByText('Click Here').click();
    await page.getByRole('button', { name: 'Monograph', exact: true }).nth(1).click();

    await page.locator('form').filter({ hasText: 'Search LCSH/LCNAF' }).getByRole('textbox').click();
    await page.locator('form').filter({ hasText: 'Search LCSH/LCNAFbolt' }).getByRole('textbox').fill('d');
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).fill('dogs');
    await page.locator('div').filter({ hasText: /^Dogs \(Auth Hd\) public$/ }).locator('span').nth(1).click();
    await expect(page.getByRole('heading')).toContainText('sh85038796');
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).click();
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).fill('Dogs--portugal');
    await page.getByText('Portugal', { exact: true }).first().click();
    await expect(page.getByRole('heading')).toContainText('n80049716-781');

    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).fill('Dogs--Portugal--porto');
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).press('Alt+ControlOrMeta+3');  // clicking doesn't work for some reason

    await page.getByText('Portugal--Porto', { exact: true }).click();
    await expect(page.getByRole('heading')).toContainText('n50006403-781');
    await page.getByRole('button', { name: 'Add [SHIFT+Enter]' }).click();
    await page.getByText('bf:Work').click();
    await expect(page.locator('#app')).toContainText('Dogs--Portugal--Porto');
    await expect(page.locator('#app')).toContainText('150 $aDogs');
    await expect(page.locator('#app')).toContainText('181 $zPortugal$zPorto');
    await expect(page.locator('#app')).toContainText('http://id.loc.gov/authorities/subjects/sh85038796');
    await expect(page.locator('#app')).toContainText('http://id.loc.gov/authorities/names/n50006403-781');
    await expect(page.locator('#app')).toContainText('650 0 $a Dogs $z Portugal $z Porto');
});

// CYAC
test('Add a CYAC heading, it has the correct XML', async ({ page }) => {
    await page.goto('http://localhost:5555/bfe2/quartz/');

    // Update the preferences for this test
    let prefs = JSON.stringify(preferences)
    await page.evaluate(prefs => localStorage.setItem("marva-preferences", prefs), prefs)
    await page.reload();

    await page.getByText('Click Here').click();
    await page.getByRole('button', { name: 'Monograph', exact: true }).nth(1).click();

    await page.locator('form').filter({ hasText: 'Search LCSH/LCNAF' }).getByRole('textbox').click();
    await page.locator('form').filter({ hasText: 'Search LCSH/LCNAFbolt' }).getByRole('textbox').fill('9');
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).fill('pigs');
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).press('Alt+ControlOrMeta+2');
    await page.getByText('Pigs', { exact: true }).first().click();
    await expect(page.getByRole('heading')).toContainText('Pigs');
    await expect(page.getByRole('heading')).toContainText('sj96006230');
    await page.getByRole('button', { name: 'Add [SHIFT+Enter]' }).click();
    await page.getByText('bf:Work').click();
    await expect(page.locator('#app')).toContainText('Pigs');
    await expect(page.locator('#app')).toContainText('150 $aPigs');
    await expect(page.locator('#app')).toContainText('http://id.loc.gov/authorities/childrensSubjects/sj96006230');
});

// Hubs
test('Add a HUB heading, it has the correct XML', async ({ page }) => {
    await page.goto('http://localhost:5555/bfe2/quartz/');

    // Update the preferences for this test
    let prefs = JSON.stringify(preferences)
    await page.evaluate(prefs => localStorage.setItem("marva-preferences", prefs), prefs)
    await page.reload();

    await page.getByText('Click Here').click();
    await page.getByRole('button', { name: 'Monograph', exact: true }).nth(1).click();

    await page.locator('form').filter({ hasText: 'Search LCSH/LCNAF' }).getByRole('textbox').click();
    await page.locator('form').filter({ hasText: 'Search LCSH/LCNAFbolt' }).getByRole('textbox').fill('e');
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).fill('euripides. medea');
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).press('Alt+ControlOrMeta+4');
    await expect(page.getByRole('dialog')).toContainText('Euripides. Medea (Auth) [RDA]');
    await page.getByText('Euripides. Medea (Auth) [RDA]').first().click();
    await expect(page.getByRole('heading')).toContainText('Euripides. Medea');
    await expect(page.getByRole('heading')).toContainText('7b8475be-4aeb-83dc-7bf7-18a0dc7eae58');
    await expect(page.getByRole('dialog')).toContainText('Identifiers: nr2002000714 ; oca05666133');
    await page.getByRole('button', { name: 'Add [SHIFT+Enter]' }).click();
    await page.getByText('bf:Work').click();
    await expect(page.locator('#app')).toContainText('Euripides. Medea');
    await expect(page.locator('#app')).toContainText('1000 $aEuripides.$tMedea');
    await expect(page.locator('#app')).toContainText('http://id.loc.gov/resources/hubs/7b8475be-4aeb-83dc-7bf7-18a0dc7eae58');
});

test('Add a HUB heading wita subdivision, it has the correct XML', async ({ page }) => {
    await page.goto('http://localhost:5555/bfe2/quartz/');

    // Update the preferences for this test
    let prefs = JSON.stringify(preferences)
    await page.evaluate(prefs => localStorage.setItem("marva-preferences", prefs), prefs)
    await page.reload();

    await page.getByText('Click Here').click();
    await page.getByRole('button', { name: 'Monograph', exact: true }).nth(1).click();

    await page.locator('form').filter({ hasText: 'Search LCSH/LCNAF' }).getByRole('textbox').click();
    await page.locator('form').filter({ hasText: 'Search LCSH/LCNAFbolt' }).getByRole('textbox').fill('e');
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).fill('euripides. medea');
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).click();
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).press('Alt+ControlOrMeta+4');
    await page.getByText('Euripides. Medea (Auth)').first().click();
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).press('Alt+ControlOrMeta+1');
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).fill('Euripides. Medea--interviews');
    await page.getByText('Interviews', { exact: true }).first().click();
    await expect(page.getByRole('dialog')).toContainText('GenreForm');
    await expect(page.getByRole('heading')).toContainText('sh99001682');
    await page.getByRole('button', { name: 'Add [SHIFT+Enter]' }).click();
    await page.getByText('bf:Work').click();
    await expect(page.locator('#app')).toContainText('Euripides. Medea--Interviews');
    await expect(page.locator('#app')).toContainText('Euripides. Medea');
    await expect(page.locator('#app')).toContainText('1000 $aEuripides.$tMedea');
    await expect(page.locator('#app')).toContainText('Interviews');
    await expect(page.locator('#app')).toContainText('185 $vInterviews');
    await expect(page.locator('#app')).toContainText('http://id.loc.gov/authorities/subjects/sh99001682');
    await expect(page.locator('#app')).toContainText('http://id.loc.gov/resources/hubs/7b8475be-4aeb-83dc-7bf7-18a0dc7eae58');
});


test('Add a literal and set type Topic, it has the correct XML', async ({ page }) => {
    await page.goto('http://localhost:5555/bfe2/quartz/');

    // Update the preferences for this test
    let prefs = JSON.stringify(preferences)
    await page.evaluate(prefs => localStorage.setItem("marva-preferences", prefs), prefs)
    await page.reload();

    await page.getByText('Click Here').click();
    await page.getByRole('button', { name: 'Monograph', exact: true }).nth(1).click();

    await page.locator('form').filter({ hasText: 'Search LCSH/LCNAF' }).getByRole('textbox').click();
    await page.locator('form').filter({ hasText: 'Search LCSH/LCNAFbolt' }).getByRole('textbox').fill('l');
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).fill('literal');
    await page.getByText('literal [Literal]').click();
    await page.getByText('Topic / Heading ($a $x)').click();
    await page.getByRole('button', { name: 'Add [SHIFT+Enter]' }).click();
    await page.getByText('bf:Work').click();
    await expect(page.locator('#app')).toContainText('madsrdf:Topic');
    await expect(page.locator('#app')).toContainText('rdfs:label');
    await expect(page.locator('#app')).toContainText('literal');
});

test('Add a literal and set type Genre, it has the correct XML', async ({ page }) => {
    await page.goto('http://localhost:5555/bfe2/quartz/');

    // Update the preferences for this test
    let prefs = JSON.stringify(preferences)
    await page.evaluate(prefs => localStorage.setItem("marva-preferences", prefs), prefs)
    await page.reload();

    await page.getByText('Click Here').click();
    await page.getByRole('button', { name: 'Monograph', exact: true }).nth(1).click();

    await page.locator('form').filter({ hasText: 'Search LCSH/LCNAF' }).getByRole('textbox').click();
    await page.locator('form').filter({ hasText: 'Search LCSH/LCNAFbolt' }).getByRole('textbox').fill('l');
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).fill('literal');
    await page.getByText('literal [Literal]').click();
    await page.getByText('Genre ($v)').click();
    await page.getByRole('button', { name: 'Add [SHIFT+Enter]' }).click();
    await page.getByText('bf:Work').click();
    await expect(page.locator('#app')).toContainText('<madsrdf:GenreFormxmlns:madsrdf="http://www.loc.gov/mads/rdf/v1#">');
    await expect(page.locator('#app')).toContainText('<rdfs:labelxmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#">');
    await expect(page.locator('#app')).toContainText('literal');
});

test('Add a literal and set type Geographic, it has the correct XML', async ({ page }) => {
    await page.goto('http://localhost:5555/bfe2/quartz/');

    // Update the preferences for this test
    let prefs = JSON.stringify(preferences)
    await page.evaluate(prefs => localStorage.setItem("marva-preferences", prefs), prefs)
    await page.reload();

    await page.getByText('Click Here').click();
    await page.getByRole('button', { name: 'Monograph', exact: true }).nth(1).click();

    await page.locator('form').filter({ hasText: 'Search LCSH/LCNAF' }).getByRole('textbox').click();
    await page.locator('form').filter({ hasText: 'Search LCSH/LCNAFbolt' }).getByRole('textbox').fill('l');
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).fill('literal');
    await page.getByText('literal [Literal]').click();
    await page.getByText('Geographic ($z)').click();
    await page.getByRole('button', { name: 'Add [SHIFT+Enter]' }).click();
    await page.getByText('bf:Work').click();
    await expect(page.locator('#app')).toContainText('<madsrdf:Geographicxmlns:madsrdf="http://www.loc.gov/mads/rdf/v1#">');
    await expect(page.locator('#app')).toContainText('<rdfs:labelxmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#">');
    await expect(page.locator('#app')).toContainText('literal');
});

test('Add a literal and set type Temporal, it has the correct XML', async ({ page }) => {
    await page.goto('http://localhost:5555/bfe2/quartz/');

    // Update the preferences for this test
    let prefs = JSON.stringify(preferences)
    await page.evaluate(prefs => localStorage.setItem("marva-preferences", prefs), prefs)
    await page.reload();

    await page.getByText('Click Here').click();
    await page.getByRole('button', { name: 'Monograph', exact: true }).nth(1).click();

    await page.locator('form').filter({ hasText: 'Search LCSH/LCNAF' }).getByRole('textbox').click();
    await page.locator('form').filter({ hasText: 'Search LCSH/LCNAFbolt' }).getByRole('textbox').fill('l');
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).fill('literal');
    await page.getByText('literal [Literal]').click();
    await page.getByText('Chronological ($y)').click();
    await page.getByRole('button', { name: 'Add [SHIFT+Enter]' }).click();
    await page.getByText('bf:Work').click();
    await expect(page.locator('#app')).toContainText('<madsrdf:Temporalxmlns:madsrdf="http://www.loc.gov/mads/rdf/v1#">');
    await expect(page.locator('#app')).toContainText('<rdfs:labelxmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#">');
    await expect(page.locator('#app')).toContainText('literal');
});

test('Add a Dogs with literal topic sub it has the correct XML', async ({ page }) => {
    await page.goto('http://localhost:5555/bfe2/quartz/');

    // Update the preferences for this test
    let prefs = JSON.stringify(preferences)
    await page.evaluate(prefs => localStorage.setItem("marva-preferences", prefs), prefs)
    await page.reload();

    await page.getByText('Click Here').click();
    await page.getByRole('button', { name: 'Monograph', exact: true }).nth(1).click();

    await page.locator('form').filter({ hasText: 'Search LCSH/LCNAF' }).getByRole('textbox').click();
    await page.locator('form').filter({ hasText: 'Search LCSH/LCNAFbolt' }).getByRole('textbox').fill('d');
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).fill('dogs');
    await page.locator('div').filter({ hasText: /^Dogs \(Auth Hd\) public$/ }).locator('span').nth(1).dblclick();
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).fill('Dogs--literal');
    await page.getByText('literal [Literal]').click();
    await page.getByText('Topic / Heading ($a $x)').click();
    await page.getByRole('button', { name: 'Add [SHIFT+Enter]' }).click();
    await page.getByText('bf:Work').click();
    await expect(page.locator('#app')).toContainText('<madsrdf:ComplexSubjectxmlns:madsrdf="http://www.loc.gov/mads/rdf/v1#">');
    await expect(page.locator('#app')).toContainText('Dogs--literal');
    await expect(page.locator('#app')).toContainText('<madsrdf:componentListrdf:parseType="Collection">');
    await expect(page.locator('#app')).toContainText('<madsrdf:Topicrdf:about="http://id.loc.gov/authorities/subjects/sh85038796">');
    await expect(page.locator('#app')).toContainText('<madsrdf:Topic>');
    await expect(page.locator('#app')).toContainText('literal');
});

test('Add a Dogs with literal temporal sub it has the correct XML', async ({ page }) => {
    await page.goto('http://localhost:5555/bfe2/quartz/');

    // Update the preferences for this test
    let prefs = JSON.stringify(preferences)
    await page.evaluate(prefs => localStorage.setItem("marva-preferences", prefs), prefs)
    await page.reload();

    await page.getByText('Click Here').click();
    await page.getByRole('button', { name: 'Monograph', exact: true }).nth(1).click();

    await page.locator('form').filter({ hasText: 'Search LCSH/LCNAF' }).getByRole('textbox').click();
    await page.locator('form').filter({ hasText: 'Search LCSH/LCNAFbolt' }).getByRole('textbox').fill('d');
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).fill('dogs');
    await page.getByText('Dogs', { exact: true }).first().click();
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).fill('Dogs--literal');
    await page.getByText('literal [Literal]').click();
    await page.getByText('Chronological ($y)').click();
    await page.getByRole('button', { name: 'Add [SHIFT+Enter]' }).click();
    await page.getByText('bf:Work').click();
    await expect(page.locator('#app')).toContainText('<madsrdf:ComplexSubjectxmlns:madsrdf="http://www.loc.gov/mads/rdf/v1#">');
    await expect(page.locator('#app')).toContainText('Dogs--literal');
    await expect(page.locator('#app')).toContainText('<madsrdf:componentListrdf:parseType="Collection">');
    await expect(page.locator('#app')).toContainText('<madsrdf:Topicrdf:about="http://id.loc.gov/authorities/subjects/sh85038796">');
    await expect(page.locator('#app')).toContainText('150 $aDogs');
    await expect(page.locator('#app')).toContainText('<madsrdf:Temporal>');
    await expect(page.locator('#app')).toContainText('literal');
});


test('Add a Geo with subdiv (complex) and check it has the correct XML', async ({ page }) => {
    await page.goto('http://localhost:5555/bfe2/quartz/');

    // Update the preferences for this test
    let prefs = JSON.stringify(preferences)
    await page.evaluate(prefs => localStorage.setItem("marva-preferences", prefs), prefs)
    await page.reload();

    await page.getByText('Click Here').click();
    await page.getByRole('button', { name: 'Monograph', exact: true }).nth(1).click();

    await page.locator('form').filter({ hasText: 'Search LCSH/LCNAF' }).getByRole('textbox').click();
    await page.locator('form').filter({ hasText: 'Search LCSH/LCNAFbolt' }).getByRole('textbox').fill('s');
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).fill('spain');
    await page.getByText('Spain', { exact: true }).first().click();
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).fill('Spain--history');
    await page.getByText('Spain--History', { exact: true }).click();
    await page.getByRole('button', { name: 'Add [SHIFT+Enter]' }).click();
    await page.getByText('bf:Work').click();
    await expect(page.locator('#app')).toContainText('<bf:subject><madsrdf:Topicxmlns:madsrdf="http://www.loc.gov/mads/rdf/v1#"rdf:about="http://id.loc.gov/authorities/subjects/sh85126069"><madsrdf:isMemberOfMADSSchemerdf:resource="http://id.loc.gov/authorities/subjects" /><madsrdf:authoritativeLabel>Spain‑‑History</madsrdf:authoritativeLabel><rdfs:labelxmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#">Spain‑‑History</rdfs:label><bflc:marcKeyxmlns:bflc="http://id.loc.gov/ontologies/bflc/">151 0$aSpain$xHistory</bflc:marcKey><bf:source><bf:Sourcerdf:about="http://id.loc.gov/vocabulary/subjectSchemes/lcsh"><rdfs:labelxmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#">Library of Congress subject headings</rdfs:label></bf:Source></bf:source></madsrdf:Topic></bf:subject>');
});

test('Add a Geo with subdiv (simple) and check it has the correct XML', async ({ page }) => {
    await page.goto('http://localhost:5555/bfe2/quartz/');

    // Update the preferences for this test
    let prefs = JSON.stringify(preferences)
    await page.evaluate(prefs => localStorage.setItem("marva-preferences", prefs), prefs)
    await page.reload();

    await page.getByText('Click Here').click();
    await page.getByRole('button', { name: 'Monograph', exact: true }).nth(1).click();

    await page.locator('form').filter({ hasText: 'Search LCSH/LCNAF' }).getByRole('textbox').click();
    await page.locator('form').filter({ hasText: 'Search LCSH/LCNAFbolt' }).getByRole('textbox').fill('s');
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).fill('spain');
    await page.getByText('Spain', { exact: true }).first().click();
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).fill('Spain--travel');
    await page.getByText('Travel', { exact: true }).first().click();
    await page.getByRole('button', { name: 'Add [SHIFT+Enter]' }).click();
    await page.getByText('bf:Work').click();
    await expect(page.locator('#app')).toContainText('<bf:subject><madsrdf:ComplexSubjectxmlns:madsrdf="http://www.loc.gov/mads/rdf/v1#"><madsrdf:isMemberOfMADSSchemerdf:resource="http://id.loc.gov/authorities/subjects" /><madsrdf:authoritativeLabel>Spain--Travel</madsrdf:authoritativeLabel><rdfs:labelxmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#">Spain--Travel</rdfs:label><madsrdf:componentListrdf:parseType="Collection"><madsrdf:Geographicrdf:about="http://id.loc.gov/authorities/names/n79006971"><madsrdf:authoritativeLabel>Spain</madsrdf:authoritativeLabel><bflc:marcKeyxmlns:bflc="http://id.loc.gov/ontologies/bflc/">151 $aSpain</bflc:marcKey></madsrdf:Geographic><madsrdf:Topicrdf:about="http://id.loc.gov/authorities/subjects/sh99005039"><madsrdf:authoritativeLabel>Travel</madsrdf:authoritativeLabel><bflc:marcKeyxmlns:bflc="http://id.loc.gov/ontologies/bflc/">180 $xTravel</bflc:marcKey></madsrdf:Topic></madsrdf:componentList><bf:source><bf:Sourcerdf:about="http://id.loc.gov/vocabulary/subjectSchemes/lcsh"><rdfs:labelxmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#">Library of Congress subject headings</rdfs:label></bf:Source></bf:source></madsrdf:ComplexSubject></bf:subject>');
});


test('Add a name with subdiv (simple) and check it has the correct XML', async ({ page }) => {
    await page.goto('http://localhost:5555/bfe2/quartz/');

    // Update the preferences for this test
    let prefs = JSON.stringify(preferences)
    await page.evaluate(prefs => localStorage.setItem("marva-preferences", prefs), prefs)
    await page.reload();

    await page.getByText('Click Here').click();
    await page.getByRole('button', { name: 'Monograph', exact: true }).nth(1).click();

    await page.locator('form').filter({ hasText: 'Search LCSH/LCNAF' }).getByRole('textbox').click();
    await page.locator('form').filter({ hasText: 'Search LCSH/LCNAFbolt' }).getByRole('textbox').fill('t');
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).fill('twain, mark');
    await page.getByText('Twain, Mark, 1835-1910', { exact: true }).click();
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).fill('Twain, Mark, 1835‑1910--interviews');
    await page.getByText('Interviews', { exact: true }).first().click();
    await page.getByRole('button', { name: 'Add [SHIFT+Enter]' }).click();
    await page.getByText('bf:Work').click();
    await expect(page.locator('#app')).toContainText('<bf:subject><madsrdf:ComplexSubjectxmlns:madsrdf="http://www.loc.gov/mads/rdf/v1#"><madsrdf:isMemberOfMADSSchemerdf:resource="http://id.loc.gov/authorities/subjects" /><madsrdf:authoritativeLabel>Twain, Mark, 1835-1910--Interviews</madsrdf:authoritativeLabel><rdfs:labelxmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#">Twain, Mark, 1835-1910--Interviews</rdfs:label><madsrdf:componentListrdf:parseType="Collection"><madsrdf:PersonalNamerdf:about="http://id.loc.gov/authorities/names/n79021164"><madsrdf:authoritativeLabel>Twain, Mark, 1835-1910</madsrdf:authoritativeLabel><bflc:marcKeyxmlns:bflc="http://id.loc.gov/ontologies/bflc/">1001 $aTwain, Mark,$d1835-1910</bflc:marcKey></madsrdf:PersonalName><madsrdf:GenreFormrdf:about="http://id.loc.gov/authorities/subjects/sh99001682"><madsrdf:authoritativeLabel>Interviews</madsrdf:authoritativeLabel><bflc:marcKeyxmlns:bflc="http://id.loc.gov/ontologies/bflc/">185 $vInterviews</bflc:marcKey></madsrdf:GenreForm></madsrdf:componentList><bf:source><bf:Sourcerdf:about="http://id.loc.gov/vocabulary/subjectSchemes/lcsh"><rdfs:labelxmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#">Library of Congress subject headings</rdfs:label></bf:Source></bf:source></madsrdf:ComplexSubject></bf:subject>');
});

// jurisdiction
test('Add a Jurisdiction and check it has the correct XML', async ({ page }) => {
    await page.goto('http://localhost:5555/bfe2/quartz/');

    // Update the preferences for this test
    let prefs = JSON.stringify(preferences)
    await page.evaluate(prefs => localStorage.setItem("marva-preferences", prefs), prefs)
    await page.reload();

    await page.getByText('Click Here').click();
    await page.getByRole('button', { name: 'Monograph', exact: true }).nth(1).click();

    await page.locator('form').filter({ hasText: 'Search LCSH/LCNAF' }).getByRole('textbox').click();
    await page.locator('form').filter({ hasText: 'Search LCSH/LCNAFbolt' }).getByRole('textbox').fill('Kenya. Horticultural Crops Development Authority');
    await page.getByText('Kenya. Horticultural Crops Development Authority [LCNAF]').click();
    await page.getByRole('button', { name: 'Add [SHIFT+Enter]' }).click();
    await page.getByText('bf:Work').click();
    await expect(page.locator('#app')).toContainText('<bf:subject><bf:Jursidictionrdf:about="http://id.loc.gov/authorities/names/n94900835"><madsrdf:isMemberOfMADSSchemexmlns:madsrdf="http://www.loc.gov/mads/rdf/v1#"rdf:resource="http://id.loc.gov/authorities/subjects" /><madsrdf:authoritativeLabelxmlns:madsrdf="http://www.loc.gov/mads/rdf/v1#">Kenya. Horticultural Crops Development Authority</madsrdf:authoritativeLabel><rdfs:labelxmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#">Kenya. Horticultural Crops Development Authority</rdfs:label><bflc:marcKeyxmlns:bflc="http://id.loc.gov/ontologies/bflc/">11010$aKenya.$bHorticultural Crops Development Authority</bflc:marcKey><bf:source><bf:Sourcerdf:about="http://id.loc.gov/vocabulary/subjectSchemes/lcsh"><rdfs:labelxmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#">Library of Congress subject headings</rdfs:label></bf:Source></bf:source></bf:Jursidiction></bf:subject>');
});


test('Able to add an edited subject', async ({ page }) => {
    await page.goto('http://localhost:5555/bfe2/quartz/');

    // Update the preferences for this test
    let prefs = JSON.stringify(preferences)
    await page.evaluate(prefs => localStorage.setItem("marva-preferences", prefs), prefs)
    await page.reload();

    await page.getByRole('row', { name: 'Schooling under control Load' }).getByRole('button').click();
    await page.getByRole('link', { name: 'Public schools--Austria--History--18th century', exact: true }).click();
    await expect(page.getByRole('dialog')).toContainText('Add [SHIFT+Enter]');
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).click();
    await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).fill('Public schools--Austria--History--18th century--congresses');
    await page.getByText('Congresses', { exact: true }).nth(1).click();
    await expect(page.getByRole('dialog')).toContainText('Add [SHIFT+Enter]');
    await page.getByRole('button', { name: 'Add [SHIFT+Enter]' }).click();
    await page.getByText('bf:Work').click();
    await expect(page.locator('#app')).toContainText('<madsrdf:authoritativeLabel>Public schools--Austria--History--18th century--Congresses</madsrdf:authoritativeLabel>');
    await expect(page.locator('#app')).toContainText('<madsrdf:Topicrdf:about="http://id.loc.gov/authorities/subjects/sh85108801">');
    await expect(page.locator('#app')).toContainText('<bflc:marcKeyxmlns:bflc="http://id.loc.gov/ontologies/bflc/">150  $aPublic schools</bflc:marcKey>');
    await expect(page.locator('#app')).toContainText('<madsrdf:GenreFormrdf:about="http://id.loc.gov/authorities/subjects/sh99001533">');
    await expect(page.locator('#app')).toContainText('<madsrdf:authoritativeLabel>Congresses</madsrdf:authoritativeLabel>');
    await expect(page.locator('#app')).toContainText('bflc:marcKeyxmlns:bflc="http://id.loc.gov/ontologies/bflc/">185  $vCongresses</bflc:marcKey>');
});


test('Correct USE appears for a Complex Heading', async ({ page }) => {
    await page.goto('http://localhost:5555/bfe2/quartz/');

    // Update the preferences for this test
    let prefs = JSON.stringify(preferences)
    await page.evaluate(prefs => localStorage.setItem("marva-preferences", prefs), prefs)
    await page.reload();

    await page.getByText('Click Here').click();
    await page.getByRole('button', { name: 'Monograph', exact: true }).nth(1).click();
    await page.locator('form').filter({ hasText: 'Search LCSH/LCNAF' }).getByRole('textbox').click();
    await page.locator('form').filter({ hasText: 'Search LCSH/LCNAFbolt' }).getByRole('textbox').fill('Agriculture--Technological innovations');
    await expect(page.getByRole('dialog')).toContainText('Agriculture--Technological innovations (USE Agricultural innovations)', {timeout: 60000});
    await page.getByText('Agriculture--Technological innovations (USE Agricultural innovations)').click();
    await page.getByRole('button', { name: 'Add [SHIFT+Enter]' }).click();
    await page.getByText('bf:Work').click();
    await expect(page.locator('#app')).toContainText('Agricultural innovations');
    await expect(page.locator('#app')).toContainText('150 $aAgricultural innovations');
    await expect(page.locator('#app')).toContainText('rdf:about="http://id.loc.gov/authorities/subjects/sh85002334"');
});