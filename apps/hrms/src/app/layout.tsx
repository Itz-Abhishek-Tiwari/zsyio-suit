import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ReduxProvider } from "@/store/provider";
import { ThemeProvider, Toaster } from "@zsyio/ui";
import { TimeZoneProvider } from "@/context/TimeZoneContext";
import { getActiveBranding } from "@plugins/branding/registry";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500", "600"],
});

const branding = getActiveBranding();

export const metadata: Metadata = {
  title: `${branding.displayName} HRMS - Timesheet, Attendance & Breaks`,
  description: "Human Resource Management System for tracking work sessions, breaks, and daily attendance.",
  icons: { icon: branding.logo.favicon },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`h-full antialiased ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-full bg-background text-foreground font-sans">
        <ThemeProvider attribute={["class", "data-theme"]} defaultTheme="light" enableSystem>
          <ReduxProvider>
            <TimeZoneProvider>
              {children}
              <Toaster />
            </TimeZoneProvider>
          </ReduxProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
