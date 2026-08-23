import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../../..");

async function main() {
  const { seedZsyio } = await import(path.join(rootDir, "scripts/seed-zsyio.ts"));
  await seedZsyio();
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
