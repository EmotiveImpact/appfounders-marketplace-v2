import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display sign in page', async ({ page }) => {
    await page.click('text=Sign In')
    await expect(page).toHaveURL('/signin')
    await expect(page.locator('h1')).toContainText('Sign In')
  })

  test('should display sign up page', async ({ page }) => {
    await page.click('text=Sign Up')
    await expect(page).toHaveURL('/signup')
    await expect(page.locator('h1')).toContainText('Sign Up')
  })

  test('should show validation errors for invalid login', async ({ page }) => {
    await page.goto('/signin')
    
    // Try to submit empty form
    await page.click('button[type="submit"]')
    
    // Should show validation errors
    await expect(page.locator('text=Email is required')).toBeVisible()
    await expect(page.locator('text=Password is required')).toBeVisible()
  })

  test('should show validation errors for invalid signup', async ({ page }) => {
    await page.goto('/signup')
    
    // Fill invalid data
    await page.fill('input[name="email"]', 'invalid-email')
    await page.fill('input[name="password"]', '123')
    await page.fill('input[name="name"]', '')
    
    await page.click('button[type="submit"]')
    
    // Should show validation errors
    await expect(page.locator('text=Invalid email')).toBeVisible()
    await expect(page.locator('text=Password must be at least')).toBeVisible()
    await expect(page.locator('text=Name is required')).toBeVisible()
  })

  test('should navigate to marketplace from home page', async ({ page }) => {
    await page.click('text=Browse Marketplace')
    await expect(page).toHaveURL('/marketplace')
    await expect(page.locator('h1')).toContainText('Marketplace')
  })

  test('should redirect to signin when accessing protected route', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/.*signin.*/)
  })

  test('should display forgot password page', async ({ page }) => {
    await page.goto('/signin')
    await page.click('text=Forgot Password')
    await expect(page).toHaveURL('/forgot-password')
    await expect(page.locator('h1')).toContainText('Reset Password')
  })

  test('should validate forgot password form', async ({ page }) => {
    await page.goto('/forgot-password')
    
    // Try to submit empty form
    await page.click('button[type="submit"]')
    await expect(page.locator('text=Email is required')).toBeVisible()
    
    // Try invalid email
    await page.fill('input[name="email"]', 'invalid-email')
    await page.click('button[type="submit"]')
    await expect(page.locator('text=Invalid email')).toBeVisible()
  })

  test('should display social login options', async ({ page }) => {
    await page.goto('/signin')
    
    // Check for social login buttons
    await expect(page.locator('text=Continue with Google')).toBeVisible()
    await expect(page.locator('text=Continue with GitHub')).toBeVisible()
    await expect(page.locator('text=Continue with Apple')).toBeVisible()
  })

  test('should toggle between signin and signup', async ({ page }) => {
    await page.goto('/signin')
    
    // Go to signup
    await page.click('text=Don\'t have an account?')
    await expect(page).toHaveURL('/signup')
    
    // Go back to signin
    await page.click('text=Already have an account?')
    await expect(page).toHaveURL('/signin')
  })
})
