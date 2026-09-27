import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ReduxProvider } from "@/store/provider";
import { ThemeProvider, Toaster } from "@zsyio/ui";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Zsyio Pulse - Sales CRM",
  description: "Manage your sales pipeline, leads, and client conversion in Zsyio",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`h-full antialiased ${plusJakarta.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-full bg-background text-foreground font-sans">
        <ThemeProvider attribute={["class", "data-theme"]} defaultTheme="light" enableSystem>
          <ReduxProvider>
            {children}
            <Toaster />
          </ReduxProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
