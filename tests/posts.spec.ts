import { test, expect } from '@playwright/test';

// Generate unique values for each test run (include random to avoid parallel test collisions)
const uniqueEmail = () => `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
const uniqueTitle = () => `Test Post ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

test.describe('Posts - Public', () => {
  test('should show posts page as home', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Published Posts' })).toBeVisible();
  });

  test('should show search input', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByPlaceholder('Search posts...')).toBeVisible();
  });

  test('should show empty state when no published posts', async ({ page }) => {
    await page.goto('/');

    // Either shows posts or empty message
    const postsOrEmpty = page.locator('.posts-list, .posts-empty');
    await expect(postsOrEmpty).toBeVisible();
  });
});

test.describe('Posts - Authenticated', () => {
  let userEmail: string;

  test.beforeEach(async ({ page }) => {
    // Register a fresh user for each test
    userEmail = uniqueEmail();

    await page.goto('/register');
    await page.getByLabel('Email').fill(userEmail);
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Register' }).click();

    // Wait for redirect and ensure user is logged in
    await expect(page).toHaveURL('/', { timeout: 10000 });
    await expect(page.getByText(userEmail)).toBeVisible({ timeout: 5000 });
  });

  test('should show My Posts link when authenticated', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'My Posts' })).toBeVisible();
  });

  test('should show Create Post link when authenticated', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Create Post' })).toBeVisible();
  });

  test('should navigate to create post page', async ({ page }) => {
    await page.getByRole('link', { name: 'Create Post' }).click();

    await expect(page).toHaveURL('/posts/new');
    await expect(page.getByRole('heading', { name: 'Create Post' })).toBeVisible();
  });

  test('should show create post form', async ({ page }) => {
    await page.goto('/posts/new');

    await expect(page.getByLabel('Title')).toBeVisible();
    await expect(page.getByLabel('Content')).toBeVisible();
    await expect(page.getByLabel('Status')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Post' })).toBeVisible();
  });

  test('should create a draft post', async ({ page }) => {
    const title = uniqueTitle();

    await page.goto('/posts/new');

    await page.getByLabel('Title').fill(title);
    await page.getByLabel('Content').fill('This is the content of my test post.');
    // Status defaults to draft

    await page.getByRole('button', { name: 'Create Post' }).click();

    // Should redirect to my posts
    await expect(page).toHaveURL('/my-posts');

    // Should show the new post
    await expect(page.getByText(title)).toBeVisible();
    await expect(page.getByText('draft')).toBeVisible();
  });

  test('should create a published post', async ({ page }) => {
    const title = uniqueTitle();

    await page.goto('/posts/new');

    await page.getByLabel('Title').fill(title);
    await page.getByLabel('Content').fill('This is a published post.');
    await page.getByLabel('Status').selectOption('published');

    await page.getByRole('button', { name: 'Create Post' }).click();

    // Should redirect to my posts
    await expect(page).toHaveURL('/my-posts');

    // Should show the new post with published status badge
    await expect(page.getByText(title)).toBeVisible();
    await expect(page.locator('.post-status-published')).toBeVisible();
  });

  test('should show my posts page', async ({ page }) => {
    await page.goto('/my-posts');

    await expect(page.getByRole('heading', { name: 'My Posts' })).toBeVisible();
    // Create Post button is in the header section
    await expect(page.locator('.posts-header').getByText('Create Post')).toBeVisible();
  });

  test('should show empty state in my posts when no posts', async ({ page }) => {
    await page.goto('/my-posts');

    await expect(page.locator('.posts-empty')).toBeVisible();
  });

  test('should show edit and delete buttons on my posts', async ({ page }) => {
    const title = uniqueTitle();

    // Create a post first
    await page.goto('/posts/new');
    await page.getByLabel('Title').fill(title);
    await page.getByRole('button', { name: 'Create Post' }).click();

    await expect(page).toHaveURL('/my-posts');

    // Should show edit and delete buttons
    await expect(page.getByRole('button', { name: 'Edit' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Delete' })).toBeVisible();
  });

  test('should navigate to edit post page', async ({ page }) => {
    const title = uniqueTitle();

    // Create a post first
    await page.goto('/posts/new');
    await page.getByLabel('Title').fill(title);
    await page.getByRole('button', { name: 'Create Post' }).click();

    await expect(page).toHaveURL('/my-posts');

    // Click edit
    await page.getByRole('button', { name: 'Edit' }).click();

    // Should be on edit page with form populated
    await expect(page).toHaveURL(/\/posts\/.*\/edit/);
    await expect(page.getByRole('heading', { name: 'Edit Post' })).toBeVisible();
    await expect(page.getByLabel('Title')).toHaveValue(title);
  });

  test('should update a post', async ({ page }) => {
    const timestamp = Date.now();
    const originalTitle = `Original Post ${timestamp}`;
    const updatedTitle = `Changed Title ${timestamp}`;

    // Create a post first
    await page.goto('/posts/new');
    await page.getByLabel('Title').fill(originalTitle);
    await page.getByRole('button', { name: 'Create Post' }).click();

    await expect(page).toHaveURL('/my-posts');

    // Click edit
    await page.getByRole('button', { name: 'Edit' }).click();

    // Update the title
    await page.getByLabel('Title').fill(updatedTitle);
    await page.getByRole('button', { name: 'Update Post' }).click();

    // Should redirect to my posts
    await expect(page).toHaveURL('/my-posts');

    // Should show the updated title (use exact match via heading)
    await expect(page.getByRole('heading', { name: updatedTitle })).toBeVisible();
    // Original title should not exist as a heading anymore
    await expect(page.getByRole('heading', { name: originalTitle })).not.toBeVisible();
  });

  test('should delete a post', async ({ page }) => {
    const title = uniqueTitle();

    // Create a post first
    await page.goto('/posts/new');
    await page.getByLabel('Title').fill(title);
    await page.getByRole('button', { name: 'Create Post' }).click();

    await expect(page).toHaveURL('/my-posts');
    const postHeading = page.getByRole('heading', { name: title });
    await expect(postHeading).toBeVisible();

    // Set up dialog handler BEFORE clicking delete (use once to auto-remove)
    page.once('dialog', async (dialog) => {
      await dialog.accept();
    });

    // Click delete and wait for network response
    await Promise.all([
      page.waitForResponse((resp) => resp.url().includes('/posts/') && resp.request().method() === 'DELETE'),
      page.getByRole('button', { name: 'Delete' }).click(),
    ]);

    // Wait for the post heading to be removed from DOM
    await expect(postHeading).toBeHidden({ timeout: 10000 });
  });

  test('should show published posts on public page', async ({ page }) => {
    const title = uniqueTitle();

    // Create a published post
    await page.goto('/posts/new');
    await page.getByLabel('Title').fill(title);
    await page.getByLabel('Status').selectOption('published');
    await page.getByRole('button', { name: 'Create Post' }).click();

    // Go to public posts page
    await page.goto('/');

    // Should show the published post
    await expect(page.getByText(title)).toBeVisible();
  });

  test('should NOT show draft posts on public page', async ({ page }) => {
    const title = uniqueTitle();

    // Create a draft post
    await page.goto('/posts/new');
    await page.getByLabel('Title').fill(title);
    // Status defaults to draft
    await page.getByRole('button', { name: 'Create Post' }).click();

    // Go to public posts page
    await page.goto('/');

    // Should NOT show the draft post
    await expect(page.getByText(title)).not.toBeVisible();
  });

  test('should search posts', async ({ page }) => {
    const searchableTitle = `Searchable ${uniqueTitle()}`;
    const otherTitle = `Other ${uniqueTitle()}`;

    // Create two published posts
    await page.goto('/posts/new');
    await page.getByLabel('Title').fill(searchableTitle);
    await page.getByLabel('Status').selectOption('published');
    await page.getByRole('button', { name: 'Create Post' }).click();

    await page.goto('/posts/new');
    await page.getByLabel('Title').fill(otherTitle);
    await page.getByLabel('Status').selectOption('published');
    await page.getByRole('button', { name: 'Create Post' }).click();

    // Go to public posts page and search
    await page.goto('/');
    await page.getByPlaceholder('Search posts...').fill('Searchable');
    await page.getByRole('button', { name: 'Search' }).click();

    // Should show searchable post
    await expect(page.getByText(searchableTitle)).toBeVisible();
    // Should NOT show other post (after search)
    await expect(page.getByText(otherTitle)).not.toBeVisible();
  });
});
