import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
    "../../packages/editor/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: {
          DEFAULT: "var(--foreground)",
          secondary: "var(--foreground-secondary)",
          tertiary: "var(--foreground-tertiary)",
          disabled: "var(--foreground-disabled)",
        },
        border: {
          DEFAULT: "var(--border)",
          strong: "var(--border-strong)",
          focus: "var(--border-focus)",
        },
        "surface-elevated": "var(--surface-elevated)",
        "surface-subtle": "var(--surface-subtle)",
        primary: {
          DEFAULT: "var(--primary)",
          hover: "var(--primary-hover)",
          light: "var(--primary-light)",
          foreground: "var(--primary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          hover: "var(--destructive-hover)",
          light: "var(--destructive-light)",
          foreground: "var(--destructive-foreground)",
        },
        success: {
          DEFAULT: "var(--success)",
          light: "var(--success-light)",
        },
        warning: {
          DEFAULT: "var(--warning)",
          light: "var(--warning-light)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        input: {
          DEFAULT: "var(--input)",
          border: "var(--input-border)",
        },
        ring: "var(--ring)",
        notion: {
          hover: "var(--notion-hover)",
          active: "var(--notion-active)",
          border: "var(--notion-border)",
          "border-strong": "var(--notion-border-strong)",
          gray: "var(--notion-gray)",
          "gray-fg": "var(--notion-gray-fg)",
          brown: "var(--notion-brown)",
          "brown-fg": "var(--notion-brown-fg)",
          orange: "var(--notion-orange)",
          "orange-fg": "var(--notion-orange-fg)",
          yellow: "var(--notion-yellow)",
          "yellow-fg": "var(--notion-yellow-fg)",
          green: "var(--notion-green)",
          "green-fg": "var(--notion-green-fg)",
          blue: "var(--notion-blue)",
          "blue-fg": "var(--notion-blue-fg)",
          purple: "var(--notion-purple)",
          "purple-fg": "var(--notion-purple-fg)",
          pink: "var(--notion-pink)",
          "pink-fg": "var(--notion-pink-fg)",
          red: "var(--notion-red)",
          "red-fg": "var(--notion-red-fg)",
        },
      },
      borderRadius: {
        DEFAULT: "var(--radius)",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        sans: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
    },
  },
  plugins: [],
};

export default config;
