// @ts-check
// Check Loading a class number from a NAR then saving from the shelflisting tool
import { test, expect } from '@playwright/test';
import { preferences } from '../../configs/subjectBuilderConfig.json'

test('Add Latin Name', async ({ page }) => {
    await page.goto('http://localhost:5555/marva/');

    // Update the preferences for this test
    let prefs = JSON.stringify(preferences)
    await page.evaluate(prefs => localStorage.setItem("marva-preferences", prefs), prefs)
    await page.reload();

    await page.getByText('Click Here').click();
    await page.getByRole('button', { name: 'Monograph', exact: true }).nth(1).click();

    await page.locator('[id="edit_lc:RT:bf2:Monograph:Work_id_loc_gov_ontologies_bibframe_contribution__creator_of_work"] div').filter({ hasText: 'Select' }).getByRole('textbox').click();
    await page.locator('form').filter({ hasText: 'Search LCNAFbolt' }).getByRole('textbox').fill('t');
    await page.getByRole('dialog').getByRole('textbox').nth(1).fill('twain, david');
    await page.getByRole('listbox').selectOption('http://id.loc.gov/authorities/names/n82164069');
    await page.getByRole('button', { name: 'Add [Shift+Enter]' }).click();
    await page.locator('.child-elements > div > div > div > .caret').first().click();
    await expect(page.locator('#app')).toContainText('<rdf:typerdf:resource="http://www.loc.gov/mads/rdf/v1#PersonalName" /><rdfs:labelxmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#">Twain, David, 1929-</rdfs:label><bflc:marcKeyxmlns:bflc="http://id.loc.gov/ontologies/bflc/">10010$aTwain, David,$d1929-</bflc:marcKey>');
});

test('Add Non-Latin Name', async ({ page }) => {
    await page.goto('http://localhost:5555/marva/');

    // Update the preferences for this test
    let prefs = JSON.stringify(preferences)
    await page.evaluate(prefs => localStorage.setItem("marva-preferences", prefs), prefs)
    await page.reload();

    await page.getByRole('link', { name: 'Test Data' }).click();
    await page.getByRole('row', { name: 'Qānūn al-ijrāʼāt al-jazāʼīyah' }).getByRole('button').click();

    await page.locator('div').filter({ hasText: /^Select TypePersonFamilyCorporate bodyJurisdictionConferenceSearch LCNAF$/ }).getByRole('textbox').click();
    await page.locator('form').filter({ hasText: 'Search LCNAFbolt' }).getByRole('textbox').fill('ʻAqīl, ʻAqīl Ḥusayn');
    await page.getByRole('listbox').selectOption('http://id.loc.gov/authorities/names/n97907734');
    await page.getByRole('button', { name: 'Add [Shift+Enter]' }).click();
    await page.locator('.child-elements > div > div > div > .caret').first().click();
    await expect(page.locator('#app')).toContainText('<bf:agent><bf:Agentrdf:about="http://id.loc.gov/authorities/names/n97907734"><rdf:typerdf:resource="http://www.loc.gov/mads/rdf/v1#PersonalName" /><rdfs:labelxmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#">ʻAqīl, ʻAqīl Ḥusayn</rdfs:label><rdfs:labelxmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#"xml:lang="und-arab">عقيل، عقيل حسين</rdfs:label><bflc:marcKeyxmlns:bflc="http://id.loc.gov/ontologies/bflc/">1001 $aʻAqīl, ʻAqīl Ḥusayn</bflc:marcKey><bflc:marcKeyxmlns:bflc="http://id.loc.gov/ontologies/bflc/"xml:lang="und-arab">4001 $aعقيل، عقيل حسين$7(bcp47)und-arab</bflc:marcKey></bf:Agent></bf:agent>');

});