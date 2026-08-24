#!/usr/bin/env node

// generate-index-html.mjs
// Generates public/index.html for the SPA controller by taking the real Vite
// source template (app/frontend/index.html) and swapping its dev entry script
// for the hashed production assets read from public/vite/.vite/manifest.json.
//
// Using the source template as-is is what keeps the production HTML in sync with
// dev: the pre-paint theme script, font <link>s, <title>, meta tags, and — most
// importantly — <div id="root"> (which main.tsx mounts on) all come straight
// from the template. Hand-writing the HTML here previously drifted from the
// template and shipped <div id="app">, so getElementById("root") returned null
// and React threw error #299 at createRoot. Runs in the Docker build stage
// after `npm run build`.

import { readFileSync, writeFileSync } from "fs";

const templatePath = "app/frontend/index.html";
const manifestPath = "public/vite/.vite/manifest.json";
const devScript = '<script type="module" src="/entrypoints/main.tsx"></script>';

const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));

const entry = manifest["entrypoints/main.tsx"];
if (!entry) {
  console.error("ERROR: entrypoints/main.tsx not found in manifest");
  process.exit(1);
}

const jsFile = "/vite/" + entry.file;
const cssFiles = (entry.css || []).map((f) => "/vite/" + f);

let html = readFileSync(templatePath, "utf-8");

if (!html.includes(devScript)) {
  console.error(
    "ERROR: dev entry script not found in " +
      templatePath +
      " — expected: " +
      devScript,
  );
  process.exit(1);
}

// Inject the built CSS <link>s before </head> so styles load ahead of paint.
if (cssFiles.length > 0) {
  const links = cssFiles
    .map((f) => '\t\t<link rel="stylesheet" href="' + f + '" />')
    .join("\n");
  html = html.replace("</head>", links + "\n\t</head>");
}

// Swap the dev entrypoint for the hashed, crossorigin production bundle.
const prodScript =
  '<script type="module" crossorigin src="' + jsFile + '"></script>';
html = html.replace(devScript, prodScript);

writeFileSync("public/index.html", html);
console.log("Generated public/index.html from " + templatePath + " + manifest");
