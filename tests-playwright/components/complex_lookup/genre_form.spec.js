// @ts-check
// Check Loading a class number from a NAR then saving from the shelflisting tool
import { test, expect } from '@playwright/test';
import { preferences } from '../../configs/subjectBuilderConfig.json'

test('Add GenreForm term', async ({ page }) => {
    await page.goto('http://localhost:5555/marva/');

    // Update the preferences for this test
    let prefs = JSON.stringify(preferences)
    await page.evaluate(prefs => localStorage.setItem("marva-preferences", prefs), prefs)
    await page.reload();

    await page.getByText('Click Here').click();
    await page.getByRole('button', { name: 'Monograph', exact: true }).nth(1).click();

    await page.locator('form').filter({ hasText: 'Search LCGFT' }).getByRole('textbox').click();
    await page.locator('form').filter({ hasText: 'Search LCGFTbolt' }).getByRole('textbox').fill('n');
    await page.getByRole('dialog').getByRole('textbox').nth(1).fill('novels');
    await page.getByRole('listbox').selectOption('http://id.loc.gov/authorities/genreForms/gf2015026020');
    await expect(page.getByRole('heading')).toContainText('bookmark Novelsgf2015026020');
    await page.getByRole('button', { name: 'Add [Shift+Enter]' }).click();
    await page.getByText('bf:Work').click();
    await expect(page.locator('#app')).toContainText('<rdfs:labelxmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#">Novels</rdfs:label><bflc:marcKeyxmlns:bflc="http://id.loc.gov/ontologies/bflc/">155 $aNovels</bflc:marcKey><bf:source><bf:Sourcerdf:about="http://id.loc.gov/authorities/genreForms/collection_LCGFT_General"><rdfs:labelxmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#">Library of Congress genre/form terms for library and archival materials</rdfs:label></bf:Source></bf:source>');
});