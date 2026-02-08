// @ts-check
// Check Loading a class number from a NAR then saving from the shelflisting tool
import { test, expect } from '@playwright/test';

// test('Prevent adding multiple values in a simple lookup that is not repeatable', async ({ page }) => {
//   await page.goto('http://localhost:5555/marva/');

//   await page.getByText('Click Here').click();
//   await page.getByRole('button', { name: 'Monograph', exact: true }).nth(1).click();

//   await page.locator('form').filter({ hasText: 'Encoding level' }).getByRole('textbox').click();
//   await page.locator('form').filter({ hasText: 'Encoding level' }).getByRole('textbox').click();
//   await page.getByRole('textbox', { name: '(press spacebar to see all' }).fill('f');
//   await page.getByRole('textbox', { name: '(press spacebar to see all' }).press('Enter');
//   await page.locator('form').filter({ hasText: 'Encoding levelf' }).getByRole('textbox').fill('f');
//   page.once('dialog', dialog => {

//     expect(dialog.message()).toContain('field is not repeatable')
//     dialog.dismiss().catch(() => {});
//   });
//   await page.locator('form').filter({ hasText: 'Encoding levelf' }).getByRole('textbox').press('Enter');
//   await expect(page.locator('[id="edit_lc:RT:bf2:Monograph:Instance_id_loc_gov_ontologies_bibframe_adminmetadata"]')).toContainText('Encoding levelf');
// });