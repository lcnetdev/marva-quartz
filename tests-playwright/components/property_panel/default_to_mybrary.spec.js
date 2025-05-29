// @ts-check
// Tests that we are able to add a default component to my library
import { test, expect } from '@playwright/test';

test('AdminMetadata is present where appropriate.', async ({ page }) => {
  await page.goto('http://localhost:5555/bfe2/quartz/');

  await page.getByText('Click Here').click();

});