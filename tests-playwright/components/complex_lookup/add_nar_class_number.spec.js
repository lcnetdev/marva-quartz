// @ts-check
import { test, expect } from '@playwright/test';

test('Load a class number from a NAR', async ({ page }) => {
  await page.goto('http://localhost:5555/bfe2/quartz/');

  await page.getByText('Click Here').click();
  await page.getByRole('group').getByRole('button', { name: 'Monograph', exact: true }).click();
  page.once('dialog', dialog => {
    console.log(`Dialog message: ${dialog.message()}`);
    dialog.dismiss().catch(() => {});
  });
  await page.locator('[id="edit_lc\\:RT\\:bf2\\:Monograph\\:Work_id_loc_gov_ontologies_bibframe_contribution__creator_of_work"] form').filter({ hasText: 'Search LCNAF' }).getByRole('textbox').click();
  await page.locator('form').filter({ hasText: 'Search LCNAFbolt' }).getByRole('textbox').fill('t');
  await page.getByRole('dialog').getByRole('textbox').fill('twain, mark');
  await page.getByRole('listbox').selectOption('http://id.loc.gov/authorities/names/n79021164');
  await page.getByRole('button', { name: 'add', exact: true }).click();
  await page.getByRole('button', { name: 'x' }).click();
  await expect(page.locator('[id="edit_lc\\:RT\\:bf2\\:Monograph\\:Work_id_loc_gov_ontologies_bibframe_classification__classification_numbers"] div').filter({ hasText: 'Classification numberClassWeb' }).getByRole('textbox')).toHaveValue('PS1300-PS1348');
  await page.getByRole('button', { name: 'Shelf List Search' }).click();
  await page.getByRole('textbox', { name: 'Class' }).click();
  await page.getByRole('textbox', { name: 'Class' }).click();
  await page.getByRole('textbox', { name: 'Class' }).press('End');
  await page.getByRole('textbox', { name: 'Class' }).press('Shift+ArrowLeft');
  await page.getByRole('textbox', { name: 'Class' }).press('Shift+ArrowLeft');
  await page.getByRole('textbox', { name: 'Class' }).press('Shift+ArrowLeft');
  await page.getByRole('textbox', { name: 'Class' }).press('Shift+ArrowLeft');
  await page.getByRole('textbox', { name: 'Class' }).press('Shift+ArrowLeft');
  await page.getByRole('textbox', { name: 'Class' }).press('Shift+ArrowLeft');
  await page.getByRole('textbox', { name: 'Class' }).press('Shift+ArrowLeft');
  await page.getByRole('textbox', { name: 'Class' }).fill('PS1300');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.locator('div').filter({ hasText: /^Classification numberClassWeb Search: PS1300ClassWeb Browse: PS1300$/ }).getByRole('textbox')).toHaveValue('PS1300');

});