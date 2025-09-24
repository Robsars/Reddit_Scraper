import { test, expect } from '@playwright/test'

test('landing → dashboard search → save → collections', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Reddit Explorer' })).toBeVisible()

  await page.goto('/dashboard')
  await page.getByRole('button', { name: 'Search' }).click()
  await expect(page.getByText('[Mock]')).toBeVisible()

  // click first Save
  const firstSave = page.getByRole('button', { name: 'Save' }).first()
  await firstSave.click()

  await page.goto('/collections')
  await expect(page.getByText('Default')).toBeVisible()
})

