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

test('has title', async ({ page }) => {
  await page.goto('http://localhost:5555/bfe2/quartz/');

  await page.getByRole('textbox', { name: 'User Name' }).click();
  await page.getByRole('textbox', { name: 'User Name' }).fill('TestUser');
  await page.getByRole('textbox', { name: 'Cataloging Code' }).click();
  await page.getByRole('textbox', { name: 'Cataloging Code' }).fill('TestCode');
  await page.getByRole('button', { name: 'Done' }).click();

  await page.context().storageState({ path: authFile });

});
