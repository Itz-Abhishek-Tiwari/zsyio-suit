import type { NextConfig } from "next";

const storageHost = (() => {
  try {
    return process.env.STORAGE_PROVIDER_URL ? new URL(process.env.STORAGE_PROVIDER_URL).hostname : null;
  } catch {
    return null;
  }
})();

const isDev = process.env.NODE_ENV !== "production";

// Next injects inline bootstrap scripts, so 'unsafe-inline' is required without a nonce setup.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https: wss: ws:",
  "media-src 'self' blob: https:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
  transpilePackages: [
    "@zsyio/database",
    "@zsyio/types",
    "@zsyio/validators",
    "@zsyio/auth",
    "@zsyio/ui",
  ],
  serverExternalPackages: ["@prisma/client", "xlsx"],
  experimental: {
    optimizePackageImports: [
      "@zsyio/ui",
      "lucide-react",
      "framer-motion",
      "@radix-ui/react-avatar",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-popover",
      "@radix-ui/react-select",
      "@radix-ui/react-tabs",
    ],
  },
  images: {
    remotePatterns: storageHost ? [{ protocol: "https", hostname: storageHost }] : [],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals ?? []), "@prisma/client", "xlsx"];
    }
    return config;
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: csp },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
