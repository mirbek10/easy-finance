import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  // Integration scenarios include network round trips to an isolated Neon branch.
  timeout: 180000,
  expect: { timeout: 15000 },
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
    launchOptions: { channel: "chrome" },
    screenshot: "only-on-failure",
  },
  reporter: "list",
});
