import { readFileSync } from "node:fs";

const msgPath = process.argv[2];
const msg = readFileSync(msgPath, "utf-8").trim();

// Remove comments
const lines = msg.split("\n").filter((line) => !line.trim().startsWith("#"));
const cleanMsg = lines.join("\n").trim();

if (!cleanMsg) {
  process.exit(0);
}

const noSpaceRegex =
  /([\u4e00-\u9fa5][a-zA-Z0-9])|([a-zA-Z0-9][\u4e00-\u9fa5])/;

if (noSpaceRegex.test(cleanMsg)) {
  console.error(
    "\x1b[31m%s\x1b[0m",
    "ERROR: Commit message must have a space between Chinese and English characters.",
  );
  // Show where the error is
  const match = cleanMsg.match(noSpaceRegex);
  if (match) {
    console.error("\x1b[33m%s\x1b[0m", `Found issue at: "...${match[0]}..."`);
  }
  process.exit(1);
}

process.exit(0);
