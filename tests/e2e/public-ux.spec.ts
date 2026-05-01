import { expect, test } from "@playwright/test";

test.describe("public UX", () => {
  test("health endpoint responds", async ({ request }) => {
    const response = await request.get("/api/health");

    expect(response.ok()).toBe(true);
    await expect(response).toBeOK();
    const json = await response.json();
    expect(json.ok).toBe(true);
  });

  test("manifest is available for installable app shell", async ({ request }) => {
    const response = await request.get("/manifest.json");

    await expect(response).toBeOK();
    const manifest = await response.json();
    expect(manifest.name ?? manifest.short_name).toBeTruthy();
  });

  test("root redirects signed-out users to sign-in", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("sign-in and sign-up pages are reachable", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page).toHaveURL(/\/sign-in/);
    await expect(page.locator("body")).toBeVisible();
    await page.waitForLoadState("networkidle");

    await page.goto("/sign-up");
    await expect(page).toHaveURL(/\/sign-up/);
    await expect(page.locator("body")).toBeVisible();
    await page.waitForLoadState("networkidle");
  });

  test("desks route is protected for signed-out requests", async ({ request }) => {
    const response = await request.get("/desks", { maxRedirects: 0 });

    expect([302, 307, 308]).toContain(response.status());
    expect(response.headers()["location"]).toContain("sign-in");
  });

  test("chat stream is protected for signed-out requests", async ({ request }) => {
    const response = await request.post("/api/chat/stream", {
      maxRedirects: 0,
      data: { text: "" },
    });

    expect([302, 307, 308]).toContain(response.status());
    expect(response.headers()["location"]).toContain("sign-in");
  });
});
