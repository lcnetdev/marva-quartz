// @ts-check
import { test, expect } from '@playwright/test';
import fs from 'fs';
const authFile = 'tests-playwright/.auth/user.json';

// try to delete the auth file if it exists
try {
  if (fs.existsSync(authFile)) {
    fs.unlinkSync(authFile);
  }
}
catch (err) { 
  console.error(err);
}

test('Log in / turn on MARC + XML View', async ({ page }) => {
  await page.goto('http://localhost:5555/marva/');

  await page.getByRole('textbox', { name: 'User Name' }).click();
  await page.getByRole('textbox', { name: 'User Name' }).fill('TestUser');
  await page.getByRole('textbox', { name: 'Cataloging Code' }).click();
  await page.getByRole('textbox', { name: 'Cataloging Code' }).fill('TestCode');
  await page.getByRole('button', { name: 'Done' }).click();

  
  await expect(page.getByText('View', { exact: true })).toBeVisible();
  await page.getByText('View', { exact: true }).click();
  await expect(page.getByText('Preview XML')).toBeVisible();
  await page.getByText('Preview XML').click();
  await page.getByText('View', { exact: true }).click();
  await expect(page.getByText('donePreview XML')).toBeVisible();
  await page.getByText('Your Records').click();
  await page.getByText('View', { exact: true }).click();
  await page.getByText('Preview MARC').click();
  await page.getByText('View', { exact: true }).click();
  await expect(page.locator('#nav-holder')).toContainText('donePreview MARC');
  await page.getByText('Your Records').click();
  await page.getByText('View', { exact: true }).click();
  await page.getByText('Preview OPAC').click();

  await page.context().storageState({ path: authFile });

});
