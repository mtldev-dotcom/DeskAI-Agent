import { test } from "@playwright/test";

test.describe("authenticated UX flow", () => {
  test.skip("sign up, provision workspace, create desk, and send chat", async () => {
    // Enable when DATABASE_URL points at a disposable test database.
    // Target coverage:
    // 1. Sign up/sign in as a test user.
    // 2. Land on /desks with workspace provisioned.
    // 3. Create a Desk through the UI.
    // 4. Open the Desk detail page.
    // 5. Send an agent message.
    // 6. Assert user bubble, assistant output, and execution card behavior.
  });
});
