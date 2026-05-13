const fs = require("fs");
const path = require("path");

const version = process.argv[2];

if (!version) {
  console.error("Usage: node update-version.js <version>");
  process.exit(1);
}

const tauriConfPath = path.join(
  __dirname,
  "..",
  "src-tauri",
  "tauri.conf.json",
);
const cargoTomlPath = path.join(__dirname, "..", "src-tauri", "Cargo.toml");

// Update tauri.conf.json
let content = fs.readFileSync(tauriConfPath, "utf-8");
content = content.replace(/"version": "[^"]*"/, `"version": "${version}"`);
fs.writeFileSync(tauriConfPath, content);
console.log(`Updated tauri.conf.json version: ${version}`);

// Update Cargo.toml
content = fs.readFileSync(cargoTomlPath, "utf-8");
content = content.replace(/version = "[^"]*"/, `version = "${version}"`);
fs.writeFileSync(cargoTomlPath, content);
console.log(`Updated Cargo.toml version: ${version}`);
