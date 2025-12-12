#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const serviceName = process.argv[2];

if (!serviceName) {
  console.error("Usage: node scripts/create-dist-entry.js <service-name>");
  process.exit(1);
}

const relativeEntry = path.join("backend", "services", serviceName, "src", "index.js");
const distDir = path.resolve(process.cwd(), "dist");
const targetEntry = path.join(distDir, relativeEntry);

if (!fs.existsSync(distDir)) {
  console.error(`[dist-entry] dist directory not found: ${distDir}`);
  process.exit(1);
}

if (!fs.existsSync(targetEntry)) {
  console.error(`[dist-entry] compiled entry not found: ${targetEntry}`);
  process.exit(1);
}

const stubPath = path.join(distDir, "index.js");
const stubContent = `module.exports = require(\"./${relativeEntry.replace(/\\/g, "/")}\");\n`;

fs.writeFileSync(stubPath, stubContent, { encoding: "utf8" });
console.log(`[dist-entry] wrote ${stubPath} -> ${relativeEntry}`);
