// @ts-check
// Check Loading a class number from a NAR then saving from the shelflisting tool
import { test, expect } from '@playwright/test';
import { preferences } from '../../configs/subjectBuilderConfig.json'

test('Add GeoCoverage', async ({ page }) => {
    await page.goto('http://localhost:5555/marva/');

    // Update the preferences for this test
    let prefs = JSON.stringify(preferences)
    await page.evaluate(prefs => localStorage.setItem("marva-preferences", prefs), prefs)
    await page.reload();

    await page.getByText('Click Here').click();
    await page.getByRole('button', { name: 'Monograph', exact: true }).nth(1).click();

    await page.locator('[id="edit_lc:RT:bf2:Monograph:Work_id_loc_gov_ontologies_bibframe_geographicCoverage__geographic_coverage"]').getByRole('textbox').click();
    await page.locator('[id="edit_lc:RT:bf2:Monograph:Work_id_loc_gov_ontologies_bibframe_geographicCoverage__geographic_coverage"]').getByRole('textbox').fill('s');
    await page.getByRole('dialog').getByRole('textbox').nth(1).fill('spain');
    await page.getByRole('listbox').selectOption('http://id.loc.gov/authorities/names/n79006971');
    await expect(page.getByRole('heading')).toContainText('map Spainn79006971');
    await page.getByRole('button', { name: 'Add [Shift+Enter]' }).click();
    await page.getByText('bf:Work').click();
    await expect(page.locator('#app')).toContainText('<rdfs:labelxmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#">Spain</rdfs:label><madsrdf:codexmlns:madsrdf="http://www.loc.gov/mads/rdf/v1#"rdf:datatype="http://id.loc.gov/datatypes/codes/gac">e-sp---</madsrdf:code><bflc:marcKeyxmlns:bflc="http://id.loc.gov/ontologies/bflc/">151 $aSpain</bflc:marcKey>');
});