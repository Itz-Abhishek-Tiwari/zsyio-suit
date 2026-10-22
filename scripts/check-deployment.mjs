import { parseEnv } from "node:util";
import { readFileSync } from "node:fs";

// Check the selected environment without logging credentials. Local secrets are
// intentionally not loaded: run this against the intended deployment environment.
const args = process.argv.slice(2);
if (args.length > 1 || (args.length === 1 && !args[0].startsWith("--env-file="))) {
  console.error("Usage: pnpm deploy:check [--env-file=/path/to/production.env]");
  process.exit(1);
}
const env = args[0]
  ? { ...parseEnv(readFileSync(args[0].slice(11), "utf8")), ...process.env }
  : process.env;
const errors = [];
const placeholder = /\[[^\]]+\]|your[-_]|change[-_]?me|example\.com/i;
const localHost = (host) => /^(localhost|127\..*|0\.0\.0\.0|\[::1\])$/.test(host);

function checkUrl(key, protocols) {
  try {
    const value = env[key];
    if (!value || placeholder.test(value)) throw new Error();
    const url = new URL(value);
    if (!protocols.includes(url.protocol) || localHost(url.hostname)) throw new Error();
    return url;
  } catch {
    errors.push(`${key}: set a production URL (${protocols.join(" or ")}), without placeholders or localhost`);
  }
}

checkUrl("DATABASE_URL", ["postgres:", "postgresql:"]);
if (!env.AUTH_SECRET || env.AUTH_SECRET.length < 32 || placeholder.test(env.AUTH_SECRET)) {
  errors.push("AUTH_SECRET: configure a shared secret of at least 32 characters across all six projects");
}
const urls = ["PMS", "NOTES", "HRMS", "ADMIN", "SALES", "RECRUIT"].map((app) =>
  checkUrl(`NEXT_PUBLIC_${app}_URL`, ["https:"]),
);
checkUrl("NEXT_PUBLIC_APP_URL", ["https:"]);
if (urls.every(Boolean) && new Set(urls.map((url) => url.origin)).size !== 6) {
  errors.push("Each app needs a distinct HTTPS origin in the subdomain deployment model");
}
if (env.COOKIE_DOMAIN) {
  const domain = env.COOKIE_DOMAIN.replace(/^\./, "").toLowerCase();
  if (domain === "vercel.app" || domain.endsWith(".vercel.app") || !domain.includes(".")) {
    errors.push("COOKIE_DOMAIN: shared sign-in requires a custom parent domain");
  } else if (urls.some((url) => url && url.hostname !== domain && !url.hostname.endsWith(`.${domain}`))) {
    errors.push("COOKIE_DOMAIN: every app hostname must belong to the configured parent domain");
  }
}

if (errors.length) {
  console.error(`Deployment preflight failed:\n${errors.map((error) => `- ${error}`).join("\n")}`);
  process.exitCode = 1;
} else {
  console.log("Deployment environment checks passed for all six independently deployed apps.");
  if (!env.COOKIE_DOMAIN) console.log("COOKIE_DOMAIN is unset: sign-in sessions will be scoped to each app hostname.");
}
