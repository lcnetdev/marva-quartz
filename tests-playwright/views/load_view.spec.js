// @ts-check
// Tests to check that the profile loaded correctly
import { test, expect } from '@playwright/test';

test('AdminMetadata is present where appropriate.', async ({ page }) => {
  await page.goto('http://localhost:5555/marva/');

  await page.getByText('Click Here').click();

});