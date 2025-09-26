// @ts-check
import { test, expect } from '@playwright/test';

test('Basic NAF Search and Add Monograph Profile', async ({ page }) => {
  await page.goto('http://localhost:5555/bfe2/quartz/');

  await page.getByText('Click Here').click();
  await page.getByRole('button', { name: 'Monograph', exact: true }).nth(1).click();
  await page.locator('[id="edit_lc\\:RT\\:bf2\\:Monograph\\:Work_id_loc_gov_ontologies_bibframe_contribution__creator_of_work"] div').filter({ hasText: 'Select' }).getByRole('textbox').click();
  await page.locator('form').filter({ hasText: 'Search LCNAFbolt' }).getByRole('textbox').fill('s');
  await page.getByRole('dialog').getByRole('textbox').fill('smith, alan');
  await page.getByRole('listbox').selectOption('http://id.loc.gov/authorities/names/n94104979');
  await expect(page.getByRole('dialog')).toContainText('Smith, Alan, 1931-');
  await page.getByRole('button', { name: 'Add [Shift+Enter]' }).click();
  await expect(page.locator('[id="edit_lc\\:RT\\:bf2\\:Monograph\\:Work_id_loc_gov_ontologies_bibframe_contribution__creator_of_work"]')).toContainText('Smith, Alan, 1933-');


});

// test('get started link', async ({ page }) => {
//   await page.goto('https://playwright.dev/');

//   // Click the get started link.
//   await page.getByRole('link', { name: 'Get started' }).click();

//   // Expects page to have a heading with the name of Installation.
//   await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
// });
