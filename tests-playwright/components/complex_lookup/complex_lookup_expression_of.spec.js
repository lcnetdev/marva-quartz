// @ts-check
import { test, expect } from '@playwright/test';

test('Add an expression Of to monograph record', async ({ page }) => {
  await page.goto('http://localhost:5555/marva/');

  await page.getByText('Click Here').click();
  await page.getByRole('button', { name: 'Monograph', exact: true }).nth(1).click();
  await page.locator('[id="edit_lc\\:RT\\:bf2\\:Monograph\\:Work_id_loc_gov_ontologies_bibframe_expressionOf__expression_of_\\[search_for_a_hub\\]"]').getByRole('textbox').click();
  await page.locator('[id="edit_lc\\:RT\\:bf2\\:Monograph\\:Work_id_loc_gov_ontologies_bibframe_expressionOf__expression_of_\\[search_for_a_hub\\]"]').getByRole('textbox').fill('Woolf, Virginia, 1882-1941. To the lighthouse');
  await expect(page.getByRole('listbox')).toBeVisible();
  await expect(page.getByRole('listbox')).toContainText('Woolf, Virginia, 1882-1941. To the lighthouse (Auth) [RDA]');

  await page.getByRole('dialog').getByRole('listbox').click();
  await page.getByRole('dialog').getByRole('listbox').press('ArrowDown');
  await expect(page.getByRole('listbox')).toContainText('Woolf, Virginia, 1882-1941. To the lighthouse (Auth) [RDA]');
  await expect(page.getByRole('dialog')).toContainText('Identifiers: no2017122683 ; oca10985804');
  await page.locator('summary').filter({ hasText: 'Extra Details' }).click();
  await expect(page.getByRole('dialog')).toContainText('1001 $aWoolf, Virginia,$d1882-1941.$tTo the lighthouse');
  await page.getByRole('button', { name: 'Add [Shift+Enter]' }).click();
  await page.getByText('bf:Work').click();
  await expect(page.getByText('bf:expressionOf').first()).toBeVisible();
  await expect(page.getByText('bf:Hub').first()).toBeVisible();
  await expect(page.getByText('1001 $aWoolf, Virginia,$d1882')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Woolf, Virginia, 1882-1941.' })).toBeVisible();




});
