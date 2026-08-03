# Pre-Deploy Polish: Design Verification + E2E Testing

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Verify calendar view matches Pencil design and establish E2E test coverage for all critical data flows.

**Architecture:** Two independent workstreams — (1) visual diff of calendar code vs Pencil design, fix discrepancies; (2) Playwright E2E tests covering the full CRUD + social flow on the web app.

**Tech Stack:** Pencil MCP tools (design verification), Playwright (E2E browser tests), Jest + @testing-library/react-native (unit/store tests)

---

## File Structure

### Design Verification
- Modify: `app/(app)/calendar/index.tsx` — fix any visual discrepancies vs Pencil design

### E2E Tests
- Create: `e2e/setup.ts` — Playwright config, base URL, dev login helper
- Create: `e2e/post-crud.spec.ts` — create → view → edit → delete post flow
- Create: `e2e/social.spec.ts` — like, comment, follow flow
- Create: `e2e/collections.spec.ts` — create collection, add/remove posts
- Create: `e2e/navigation.spec.ts` — tab nav, screen transitions, deep links
- Create: `playwright.config.ts` — Playwright project config

### Store Unit Tests
- Create: `src/stores/__tests__/postStore.test.ts` — CRUD operations in mock mode
- Create: `src/stores/__tests__/socialStore.test.ts` — likes, comments, follows in mock mode
- Create: `src/stores/__tests__/collectionStore.test.ts` — collection operations in mock mode

---

## Task 1: Calendar View Design Verification

**Files:**
- Read: `pencil-new.pen` (Calendar View screen via Pencil MCP tools)
- Modify: `app/(app)/calendar/index.tsx`

- [ ] **Step 1: Get Pencil design screenshot and details**

Use Pencil MCP `batch_get` to find the Calendar View frame, then `get_screenshot` to capture it. Document all design specs (sizes, colors, spacing, fonts).

- [ ] **Step 2: Take web screenshot of current implementation**

Start dev server, navigate to calendar screen, capture screenshot with Playwright CLI.

- [ ] **Step 3: Compare and document discrepancies**

Create a diff list: design spec vs actual implementation. Check:
- Header layout (back button, month nav, today button sizes/colors)
- Weekday row (day labels, Sunday/Saturday colors)
- Calendar grid (cell height 46px, today indicator, selected state, post dots)
- Entries section (thumbnail 56x56, info layout, empty state)
- Spacing, padding, font sizes, border radius values

- [ ] **Step 4: Fix discrepancies in calendar code**

Apply fixes to `app/(app)/calendar/index.tsx` to match Pencil design exactly.

- [ ] **Step 5: Re-screenshot and verify match**

Take another screenshot after fixes, confirm visual match with Pencil design.

- [ ] **Step 6: Commit**

```bash
git add app/(app)/calendar/index.tsx
git commit -m "fix: align calendar view with Pencil design specs"
```

---

## Task 2: Install Playwright + Setup E2E Infrastructure

**Files:**
- Create: `playwright.config.ts`
- Create: `e2e/setup.ts`
- Modify: `package.json` (add playwright deps + scripts)

- [ ] **Step 1: Install Playwright**

```bash
npm install -D @playwright/test
npx playwright install chromium
```

- [ ] **Step 2: Create Playwright config**

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:8081',
    viewport: { width: 390, height: 844 },
    colorScheme: 'dark',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npx expo start --web --port 8081 --clear',
    port: 8081,
    reuseExistingServer: true,
    timeout: 60000,
  },
});
```

- [ ] **Step 3: Create E2E setup with dev login helper**

```typescript
// e2e/setup.ts
import { Page } from '@playwright/test';

export async function devLogin(page: Page) {
  await page.goto('/');
  // Wait for sign-in screen
  await page.waitForSelector('text=Food Diary');
  // Click dev login button (full text: "이메일로 로그인 (개발용)")
  await page.getByText('이메일로 로그인', { exact: false }).click();
  // Wait for home screen (use tab bar text since testIDs added later)
  await page.waitForURL('**/home', { timeout: 15000 });
}

export const TEST_TIMEOUT = 30000;
```

- [ ] **Step 4: Add test scripts to package.json**

Add to scripts:
```json
"test:e2e": "npx playwright test",
"test:e2e:ui": "npx playwright test --ui"
```

- [ ] **Step 5: Verify setup runs**

```bash
npx playwright test --list
```
Expected: Lists test files (empty for now, no errors)

- [ ] **Step 6: Commit**

```bash
# Add Playwright artifacts to .gitignore
echo -e "\n# Playwright\ntest-results/\nplaywright-report/" >> .gitignore
git add playwright.config.ts e2e/setup.ts package.json package-lock.json .gitignore
git commit -m "chore: add Playwright E2E test infrastructure"
```

---

## Task 3: E2E Test — Post CRUD Flow

**Files:**
- Create: `e2e/post-crud.spec.ts`
- Modify: `app/(app)/(tabs)/home/index.tsx` (add data-testid if needed)
- Modify: `app/(app)/post/create.tsx` (add data-testid if needed)
- Modify: `app/(app)/post/[postId]/index.tsx` (add data-testid if needed)
- Modify: `app/(app)/post/[postId]/edit.tsx` (add data-testid if needed)

- [ ] **Step 1: Add data-testid attributes to key elements**

Add `testID` props (React Native) to these elements across screens:
- Home: feed container, food cards, sort button, FAB/create button
- Create: photo picker, star rating, comment input, submit button
- Detail: hero image, rating display, comment section, delete button, edit button
- Edit: rating input, comment input, menu_name input, save button

- [ ] **Step 2: Write post creation test**

```typescript
// e2e/post-crud.spec.ts
import { test, expect } from '@playwright/test';
import { devLogin } from './setup';

test.describe('Post CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await devLogin(page);
  });

  test('create a new post with photo and rating', async ({ page }) => {
    // Navigate to create
    // Pick photo (mock/test image)
    // Set rating
    // Add comment
    // Submit
    // Verify appears in home feed
  });

  test('view post detail', async ({ page }) => {
    // Click first post in feed
    // Verify detail screen shows image, rating, comments
  });

  test('edit post', async ({ page }) => {
    // Navigate to post detail
    // Click edit
    // Change rating/comment
    // Save
    // Verify changes reflected
  });

  test('delete post', async ({ page }) => {
    // Navigate to post detail
    // Click delete
    // Confirm
    // Verify removed from feed
  });
});
```

- [ ] **Step 3: Run tests and iterate until passing**

```bash
npx playwright test e2e/post-crud.spec.ts --headed
```

- [ ] **Step 4: Commit**

```bash
git add e2e/post-crud.spec.ts app/
git commit -m "test: add E2E tests for post CRUD flow"
```

---

## Task 4: E2E Test — Social Interactions

**Files:**
- Create: `e2e/social.spec.ts`
- Modify: `app/(app)/post/[postId]/index.tsx` (add data-testid if needed)
- Modify: `app/(app)/notifications/index.tsx` (add data-testid if needed)

- [ ] **Step 1: Add data-testid to social elements**

- Like button + count
- Comment input + list + reply button
- Notification items
- Follow/unfollow button on user profile

- [ ] **Step 2: Write social interaction tests**

```typescript
// e2e/social.spec.ts
test.describe('Social', () => {
  test('toggle like on post', async ({ page }) => {
    // Navigate to post detail
    // Click like, verify count increments
    // Click again, verify count decrements
  });

  test('add and delete comment', async ({ page }) => {
    // Navigate to post detail
    // Type comment, submit
    // Verify comment appears
    // Delete comment
    // Verify removed
  });

  test('view notifications', async ({ page }) => {
    // Navigate to notifications tab
    // Verify notification list renders
    // Tap notification, verify navigation
  });
});
```

- [ ] **Step 3: Run tests and iterate**

```bash
npx playwright test e2e/social.spec.ts --headed
```

- [ ] **Step 4: Commit**

```bash
git add e2e/social.spec.ts app/
git commit -m "test: add E2E tests for social interactions"
```

---

## Task 5: E2E Test — Navigation + Collections

**Files:**
- Create: `e2e/navigation.spec.ts`
- Create: `e2e/collections.spec.ts`

- [ ] **Step 1: Write navigation tests**

```typescript
// e2e/navigation.spec.ts
test.describe('Navigation', () => {
  test('tab bar navigation', async ({ page }) => {
    // Click each tab (home, map, camera, profile)
    // Verify correct screen loads
  });

  test('navigate to feature screens', async ({ page }) => {
    // Calendar, Statistics, Collections, Search, Settings
    // Verify each renders correctly
  });
});
```

- [ ] **Step 2: Write collections tests**

```typescript
// e2e/collections.spec.ts
test.describe('Collections', () => {
  test('create and view collection', async ({ page }) => {
    // Navigate to collections
    // Create new collection
    // Verify it appears
  });

  test('delete collection', async ({ page }) => {
    // Delete collection
    // Verify removed
  });
});
```

- [ ] **Step 3: Run all tests and iterate**

```bash
npx playwright test --headed
```

- [ ] **Step 4: Commit**

```bash
git add e2e/
git commit -m "test: add E2E tests for navigation and collections"
```

---

## Task 6: Store Unit Tests (Mock Mode)

**Files:**
- Create: `src/stores/__tests__/postStore.test.ts`
- Create: `src/stores/__tests__/socialStore.test.ts`
- Create: `src/stores/__tests__/collectionStore.test.ts`

- [ ] **Step 1: Write postStore tests**

```typescript
// src/stores/__tests__/postStore.test.ts
import { usePostStore } from '../postStore';

describe('postStore (mock mode)', () => {
  beforeEach(() => usePostStore.getState().loadPosts());

  test('loads mock posts', () => {
    expect(usePostStore.getState().posts.length).toBeGreaterThan(0);
  });

  test('adds a post', () => {
    const before = usePostStore.getState().posts.length;
    usePostStore.getState().addPost({ /* minimal post data */ });
    expect(usePostStore.getState().posts.length).toBe(before + 1);
  });

  test('deletes a post', () => {
    const postId = usePostStore.getState().posts[0].id;
    usePostStore.getState().deletePost(postId);
    expect(usePostStore.getState().posts.find(p => p.id === postId)).toBeUndefined();
  });

  test('toggles like', () => {
    const postId = usePostStore.getState().posts[0].id;
    const before = usePostStore.getState().posts[0]._count?.likes ?? 0;
    usePostStore.getState().toggleLike(postId);
    const after = usePostStore.getState().posts.find(p => p.id === postId)?._count?.likes ?? 0;
    expect(after).toBe(before + 1);
  });
});
```

- [ ] **Step 2: Write socialStore tests**

Test: toggleFollow, markNotificationRead, markAllRead, loadNotifications

- [ ] **Step 3: Write collectionStore tests**

Test: addCollection, removeCollection, addPostToCollection, removePostFromCollection

- [ ] **Step 4: Run all unit tests**

```bash
npm test
```
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add src/stores/__tests__/
git commit -m "test: add unit tests for stores (mock mode)"
```

---

## Task Summary

| Task | Type | Independence |
|------|------|-------------|
| 1. Calendar design verification | Design | Independent |
| 2. Playwright setup | Infra | Independent |
| 3. Post CRUD E2E | Test | Depends on Task 2 |
| 4. Social E2E | Test | Depends on Task 2 |
| 5. Navigation + Collections E2E | Test | Depends on Task 2 |
| 6. Store unit tests | Test | Independent |

**Parallelization:** Tasks 1, 2, 6 can run in parallel. Tasks 3, 4, 5 each depend on Task 2 but are independent of each other (parallelizable after Task 2).
