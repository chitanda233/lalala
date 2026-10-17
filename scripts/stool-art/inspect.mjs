import { chromium } from "@playwright/test";
const browser = await chromium.launch({
  executablePath:
    process.env.LALALA_CHROME ||
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
const page = await browser.newPage({
  viewport: { width: 1100, height: 1100 },
  deviceScaleFactor: 1,
});
const prototype = process.argv.includes("--prototype");
await page.goto(
  `http://127.0.0.1:4175/scripts/stool-art/preview.html${prototype ? "?prototype" : ""}`,
);
await page.waitForFunction(() => window.previewReady);
await page.evaluate(() =>
  Promise.all(
    [...document.querySelectorAll("image")].map(
      (image) =>
        new Promise((resolve) => {
          const img = new Image();
          img.onload = resolve;
          img.onerror = resolve;
          img.src = image.getAttribute("href");
        }),
    ),
  ),
);
await page.screenshot({
  path: new URL(
    prototype ? "prototype.png" : "contact-sheet.png",
    import.meta.url,
  ).pathname,
  fullPage: true,
});
await browser.close();
