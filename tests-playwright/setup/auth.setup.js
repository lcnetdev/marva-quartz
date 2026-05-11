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

// Build a fake JWT for testing (header.payload.signature)
// The payload has a far-future expiry so it won't expire during tests
function buildFakeJwt() {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = btoa(JSON.stringify({
    sub: 'testuser@example.com',
    name: 'TestUser',
    email: 'testuser@example.com',
    exp: Math.floor(Date.now() / 1000) + 86400 // 24 hours from now
  }))
  const signature = 'fakesignature'
  return `${header}.${payload}.${signature}`
}

test('Log in / turn on MARC + XML View', async ({ page }) => {
  // Inject SSO auth state into localStorage before navigating
  await page.addInitScript(() => {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    const payload = btoa(JSON.stringify({
      sub: 'testuser@example.com',
      name: 'TestUser',
      email: 'testuser@example.com',
      exp: Math.floor(Date.now() / 1000) + 86400
    }))
    const fakeJwt = `${header}.${payload}.fakesignature`

    window.localStorage.setItem('marva_jwt', fakeJwt)
    window.localStorage.setItem('marva-catInitals', 'TestUser')
    window.localStorage.setItem('marva-catCode', 'TestCode')
    window.localStorage.setItem('marva-SSOFirstTimeChecked', 'true')
  })

  await page.goto('http://localhost:5555/marva/');

  await expect(page.getByText('View', { exact: true })).toBeVisible();
  await page.getByText('View', { exact: true }).click();
  await expect(page.getByText('Preview XML')).toBeVisible();
  await page.getByText('Preview XML').click();
  await page.getByText('View', { exact: true }).click();
  await expect(page.getByText('donePreview XML')).toBeVisible();
  await page.getByText('Records', { exact: true }).click();
  await page.getByText('View', { exact: true }).click();
  await page.getByText('Preview MARC').click();
  await page.getByText('View', { exact: true }).click();
  await expect(page.locator('#nav-holder')).toContainText('donePreview MARC');
  await page.getByText('Records', { exact: true }).click();
  await page.getByText('View', { exact: true }).click();
  await page.getByText('Preview OPAC').click();

  await page.context().storageState({ path: authFile });

});
