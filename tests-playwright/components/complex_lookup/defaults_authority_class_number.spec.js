// @ts-check
// That adding defaults after load a class number from an authority's details
import { test, expect } from '@playwright/test';

test('Load a class number from a NAR', async ({ page }) => {
  await page.goto('http://localhost:5555/bfe2/quartz/');

  await page.getByText('Click Here').click();
  page.once('dialog', dialog => {
    console.log(`Dialog message: ${dialog.message()}`);
    dialog.dismiss().catch(() => {});
  });
  await page.getByRole('group').getByRole('button', { name: 'Monograph', exact: true }).click();
  await page.locator('form').filter({ hasText: 'Search LCSH/LCNAF' }).getByRole('textbox').click();
  await page.locator('form').filter({ hasText: 'Search LCSH/LCNAFbolt' }).getByRole('textbox').fill('d');
  await page.getByRole('textbox', { name: 'Enter Subject Headings Here' }).fill('dogs');
  await page.locator('div').filter({ hasText: /^Dogs \(Auth Hd\) public$/ }).locator('span').first().click();
  await page.getByRole('listitem').filter({ hasText: 'QL737.C22add' }).getByRole('button').click();
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page.locator('div').filter({ hasText: /^Classification numberClassWeb Search: QL737\.C22ClassWeb Browse: QL737\.C22$/ }).getByRole('textbox')).toHaveValue('QL737.C22');
  await page.locator('div').filter({ hasText: /^Classification numberClassWeb Search: QL737\.C22ClassWeb Browse: QL737\.C22$/ }).getByRole('textbox').click();
  await page.getByRole('button', { name: 'bolt' }).click();
  await page.getByRole('button', { name: 'Insert Default Values' }).click();
  await expect(page.locator('[id="edit_lc\\:RT\\:bf2\\:Monograph\\:Work_id_loc_gov_ontologies_bibframe_classification__classification_numbers"]')).toContainText('United States, Library of Congress');
  await expect(page.locator('[id="edit_lc\\:RT\\:bf2\\:Monograph\\:Work_id_loc_gov_ontologies_bibframe_classification__classification_numbers"]')).toContainText('used by assignerx');

});