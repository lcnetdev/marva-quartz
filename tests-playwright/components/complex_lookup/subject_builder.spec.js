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
    await expect(page.getByRole('dialog')).toContainText('Dogs');
    await page.getByText('Dogs', { exact: true }).first().click();
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
    await page.locator('div').filter({ hasText: /^Dogs\(Auth Hd\) public$/ }).locator('span').nth(1).click();
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
    await page.getByText('Dogs', { exact: true }).first().click();
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

// CYAC

// Hubs

// Check XML and MARC correct for
// Geo--sub
// name--sub
//      name (direct order)--sub
// hub--sub

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
    await page.locator('div').filter({ hasText: /^Dogs\(Auth Hd\) public$/ }).locator('span').nth(1).click();
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
    await page.locator('div').filter({ hasText: /^Dogs\(Auth Hd\) public$/ }).locator('span').nth(1).click();
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