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


test('Delete a literal', async ({ page }) => {
    await page.goto('http://localhost:5555/marva/');

    // Update the preferences for this test
    let prefs = JSON.stringify(preferences)
    await page.evaluate(prefs => localStorage.setItem("marva-preferences", prefs), prefs)
    await page.reload();

    await page.getByText('Click Here').click();
    await page.getByRole('button', { name: 'Monograph', exact: true }).nth(1).click();

    await page.locator('[id="edit_lc:RT:bf2:Monograph:Work_id_loc_gov_ontologies_bibframe_title__title_information"]').getByRole('textbox').first().click();
    await page.locator('[id="edit_lc:RT:bf2:Monograph:Work_id_loc_gov_ontologies_bibframe_title__title_information"]').getByRole('textbox').first().fill('test');
    await page.locator('[id="edit_lc:RT:bf2:Monograph:Work_id_loc_gov_ontologies_bibframe_title__title_information"]').getByRole('textbox').nth(1).click();
    await page.locator('[id="edit_lc:RT:bf2:Monograph:Work_id_loc_gov_ontologies_bibframe_title__title_information"]').getByRole('textbox').nth(1).fill('part');
    await page.getByText('bf:Work').click();
    await expect(page.locator('#app')).toContainText('<bf:mainTitle>test</bf:mainTitle><bf:partNumber>part</bf:partNumber>');
    await page.locator('[id="edit_lc:RT:bf2:Monograph:Work_id_loc_gov_ontologies_bibframe_title__title_information"]').getByRole('textbox').nth(1).click();
    await page.locator('[id="edit_lc:RT:bf2:Monograph:Work_id_loc_gov_ontologies_bibframe_title__title_information"]').getByRole('textbox').nth(1).press('Shift+Home');
    await page.locator('[id="edit_lc:RT:bf2:Monograph:Work_id_loc_gov_ontologies_bibframe_title__title_information"]').getByRole('textbox').nth(1).fill('');
    await expect(page.locator('#app')).toContainText('<bf:Title><bf:mainTitle>test</bf:mainTitle></bf:Title>');
});
