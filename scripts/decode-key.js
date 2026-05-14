// scripts/decode-key.js - Decode Base64 signing key to file
import { writeFileSync } from "node:fs";

const encodedKey = process.argv[2];
const outputPath = process.argv[3] || "signing_key.pem";

if (!encodedKey || encodedKey === "undefined" || encodedKey.trim() === "") {
  process.exit(1);
}

try {
  const decodedKey = Buffer.from(encodedKey, "base64").toString("utf-8");

  if (!decodedKey.includes("-----BEGIN PRIVATE KEY-----")) {
    process.exit(1);
  }

  writeFileSync(outputPath, decodedKey);
} catch (_error) {
  process.exit(1);
}
