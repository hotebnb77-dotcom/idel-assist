// Assemble un fichier HTML unique (aperçu hors serveur). Usage : node apercu/assembler.mjs <sortie.html>
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
const dist = new URL("./dist/", import.meta.url);
const css = readdirSync(dist).filter((f) => f.endsWith(".css")).map((f) => readFileSync(new URL(f, dist), "utf8")).join("\n");
const js = readFileSync(new URL("app.js", dist), "utf8").replace(/<\/script/gi, "<\\/script");
// --fragment : sans <html>/<head>/<body> (pour un hébergeur qui ajoute lui-même le squelette).
const fragment = process.argv.includes("--fragment");
const corps = `<title>IDEL Assist</title>
<meta name="robots" content="noindex, nofollow">
<style>${css}</style>
<div id="root"></div><script>${js}</script>`;
const html = fragment ? corps : `<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#f4f7fb">
<title>IDEL Assist</title>
<style>${css}</style></head>
<body><div id="root"></div><script>${js}</script></body></html>`;
const sortie = process.argv.slice(2).find((a) => !a.startsWith("--")) ?? "apercu/dist/idel-assist-apercu.html";
writeFileSync(sortie, html);
console.log("Aperçu :", Math.round(html.length / 1024), "Ko");
