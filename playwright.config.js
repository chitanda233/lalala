import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./qa",
  timeout: 30000,
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4173",
    viewport: { width: 1440, height: 1000 },
    launchOptions: {
      executablePath:
        process.env.LALALA_CHROME ||
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    },
  },
  webServer: {
    command: "node server.mjs",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: true,
  },
});
