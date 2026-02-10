import { test, expect } from '@playwright/test';

// Generate unique email for each test run (include random to avoid parallel test collisions)
const uniqueEmail = () => `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;

test.describe('Authentication', () => {
  test('should show login page', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
  });

  test('should show register page', async ({ page }) => {
    await page.goto('/register');

    await expect(page.getByRole('heading', { name: 'Register' })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Register' })).toBeVisible();
  });

  test('should navigate from login to register', async ({ page }) => {
    await page.goto('/login');

    // Click the Register link in the auth footer (not the one in header)
    await page.locator('.auth-footer').getByRole('link', { name: 'Register' }).click();

    await expect(page).toHaveURL('/register');
  });

  test('should navigate from register to login', async ({ page }) => {
    await page.goto('/register');

    // Click the Login link in the auth footer (not the one in header)
    await page.locator('.auth-footer').getByRole('link', { name: 'Login' }).click();

    await expect(page).toHaveURL('/login');
  });

  test('should show validation error for short password', async ({ page }) => {
    await page.goto('/register');

    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('short');
    await page.getByRole('button', { name: 'Register' }).click();

    // HTML5 validation should prevent submission
    await expect(page.getByLabel('Password')).toBeFocused();
  });

  test('should register a new user', async ({ page }) => {
    const email = uniqueEmail();

    await page.goto('/register');

    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Register' }).click();

    // Should redirect to home and show user email in header
    await expect(page).toHaveURL('/', { timeout: 10000 });
    await expect(page.getByText(email)).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();
  });

  test('should show error for duplicate email registration', async ({ page }) => {
    // First, register with an email
    const email = uniqueEmail();

    await page.goto('/register');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Register' }).click();

    await expect(page).toHaveURL('/', { timeout: 10000 });

    // Logout
    await page.getByRole('button', { name: 'Logout' }).click();

    // Try to register again with the same email
    await page.goto('/register');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill('password456');
    await page.getByRole('button', { name: 'Register' }).click();

    // Should show error message
    await expect(page.getByText(/already registered|already exists/i)).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    // First, register a user
    const email = uniqueEmail();

    await page.goto('/register');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Register' }).click();

    await expect(page).toHaveURL('/', { timeout: 10000 });

    // Logout
    await page.getByRole('button', { name: 'Logout' }).click();

    // Now login
    await page.goto('/login');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Login' }).click();

    // Should redirect to home and show user email
    await expect(page).toHaveURL('/', { timeout: 10000 });
    await expect(page.getByText(email)).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Email').fill('nonexistent@example.com');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Login' }).click();

    // Should show error message
    await expect(page.getByText(/invalid|incorrect|not found/i)).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Register and login
    const email = uniqueEmail();

    await page.goto('/register');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Register' }).click();

    await expect(page).toHaveURL('/', { timeout: 10000 });

    // Logout
    await page.getByRole('button', { name: 'Logout' }).click();

    // Should show login/register links, not user email
    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Register' })).toBeVisible();
    await expect(page.getByText(email)).not.toBeVisible();
  });

  test('should redirect to login when accessing protected route', async ({ page }) => {
    await page.goto('/my-posts');

    // Should redirect to login
    await expect(page).toHaveURL('/login');
  });

  test('should redirect back after login', async ({ page }) => {
    // Register a user first
    const email = uniqueEmail();

    await page.goto('/register');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Register' }).click();
    await page.getByRole('button', { name: 'Logout' }).click();

    // Try to access protected route
    await page.goto('/my-posts');
    await expect(page).toHaveURL('/login');

    // Login
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Login' }).click();

    // Should redirect back to my-posts
    await expect(page).toHaveURL('/my-posts');
  });
});
