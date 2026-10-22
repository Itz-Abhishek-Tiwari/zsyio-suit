import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const rootEnvExample = path.join(rootDir, ".env.example");
const rootEnvLocal = path.join(rootDir, ".env.local");
const rootEnv = path.join(rootDir, ".env");

// Targets to link to the root env file
const targets = [
  path.join(rootDir, "apps/recruit/.env.local"),
  path.join(rootDir, "apps/landing/.env.local"),
  path.join(rootDir, "apps/pms/.env.local"),
  path.join(rootDir, "apps/notes/.env.local"),
  path.join(rootDir, "apps/hrms/.env.local"),
  path.join(rootDir, "apps/admin/.env.local"),
  path.join(rootDir, "apps/sales/.env.local"),
  path.join(rootDir, "packages/database/.env.local"),
  path.join(rootDir, "packages/database/.env"),
];

// Cloud projects receive their own environment from Vercel. Do not create
// placeholder files or link local development credentials into cloud builds.
if (process.env.VERCEL === "1") {
  console.log("Using the Vercel project's configured environment.");
  process.exit(0);
}

console.log("🔧 Configuring unified single-source .env across monorepo...");

// 1. Ensure root .env.local exists
let sourceEnv = null;
if (fs.existsSync(rootEnvLocal)) {
  sourceEnv = rootEnvLocal;
} else if (fs.existsSync(rootEnv)) {
  sourceEnv = rootEnv;
} else if (fs.existsSync(rootEnvExample)) {
  console.log("ℹ️  Creating root .env.local from .env.example");
  fs.copyFileSync(rootEnvExample, rootEnvLocal);
  sourceEnv = rootEnvLocal;
} else {
  console.error("❌ Error: .env.example not found in root!");
  process.exit(1);
}

// 2. Link all target workspaces to the single root env file via relative symlinks
for (const target of targets) {
  const dir = path.dirname(target);
  if (!fs.existsSync(dir)) continue;

  const relativeSource = path.relative(dir, sourceEnv);

  try {
    // If target exists and is a symlink pointing to the right source, we're good
    if (fs.existsSync(target) || fs.lstatSync(target).isSymbolicLink?.()) {
      const stats = fs.lstatSync(target);
      if (stats.isSymbolicLink()) {
        const currentLink = fs.readlinkSync(target);
        if (currentLink === relativeSource) {
          console.log(`🔗 Already linked: ${path.relative(rootDir, target)} -> ${relativeSource}`);
          continue;
        }
      }
      // Remove existing file or outdated symlink
      fs.unlinkSync(target);
    }
  } catch {
    // File may not exist yet, continue to create symlink
  }

  try {
    fs.symlinkSync(relativeSource, target, "file");
    console.log(`🔗 Created symlink: ${path.relative(rootDir, target)} -> ${relativeSource}`);
  } catch (symlinkErr) {
    // Fallback to copy on systems that restrict symlinks
    console.warn(`⚠️  Symlink creation failed (${symlinkErr.message}), falling back to file copy.`);
    fs.copyFileSync(sourceEnv, target);
    console.log(`📋 Copied env: ${path.relative(rootDir, target)}`);
  }
}

console.log("✨ Single-source environment configured! Editing root .env.local will now update all apps & packages automatically.");
