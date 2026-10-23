// Génère les icônes PNG de la PWA à partir de scripts/icon.svg (utilise Playwright/Chromium).
// Usage : node scripts/generer-icones.mjs
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { execSync } from "node:child_process";

const require = createRequire(import.meta.url);
let pw;
try { pw = require("playwright"); } catch { pw = require(execSync("npm root -g").toString().trim() + "/playwright"); }

const svg = readFileSync(new URL("./icon.svg", import.meta.url), "utf8");
const tailles = [
  ["public/icons/icon-192.png", 192, 0],
  ["public/icons/icon-512.png", 512, 0],
  ["public/icons/apple-touch-icon.png", 180, 0],
  ["public/icons/icon-maskable-512.png", 512, 0.1],
  ["public/favicon.png", 64, 0],
];
const browser = await pw.chromium.launch();
const page = await browser.newPage();
for (const [chemin, t, marge] of tailles) {
  await page.setViewportSize({ width: t, height: t });
  const inner = Math.round(t * (1 - 2 * marge));
  await page.setContent(`<html><body style="margin:0;background:#2b5f99;display:flex;align-items:center;justify-content:center;width:${t}px;height:${t}px">
    <div style="width:${inner}px;height:${inner}px">${svg.replace("<svg ", `<svg width="${inner}" height="${inner}" `)}</div></body></html>`);
  await page.screenshot({ path: chemin, omitBackground: false });
  console.log("✓", chemin);
}
await browser.close();
