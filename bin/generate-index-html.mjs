#!/usr/bin/env node

// generate-index-html.mjs
// Reads public/vite/.vite/manifest.json and generates public/index.html
// for the SPA controller. Runs in the Docker build stage after npm run build.

import { readFileSync, writeFileSync } from "fs";

const manifestPath = "public/vite/.vite/manifest.json";
const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));

const entry = manifest["entrypoints/application.ts"];
if (!entry) {
  console.error("ERROR: entrypoints/application.ts not found in manifest");
  process.exit(1);
}

const jsFile = "/vite/" + entry.file;
const cssFiles = (entry.css || []).map((f) => "/vite/" + f);

let html = '<!DOCTYPE html>\n<html lang="en">\n<head>\n';
html += '  <meta charset="utf-8">\n';
html += '  <meta name="viewport" content="width=device-width,initial-scale=1">\n';
html += '  <title>Boardgame Night</title>\n';
cssFiles.forEach((f) => {
  html += '  <link rel="stylesheet" href="' + f + '">\n';
});
html += '</head>\n<body>\n';
html += '  <div id="app"></div>\n';
html += '  <script type="module" crossorigin src="' + jsFile + '"></script>\n';
html += '</body>\n</html>\n';

writeFileSync("public/index.html", html);
console.log("Generated public/index.html from manifest");
