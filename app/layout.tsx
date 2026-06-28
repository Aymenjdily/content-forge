import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Content Forge — AI Content Platform",
    template: "%s | Content Forge",
  },
  description:
    "Content Forge helps creators and teams research, draft, optimize, and publish content at scale using AI.",
  keywords: [
    "AI content",
    "content creation",
    "content management",
    "publishing platform",
    "Content Forge",
  ],
  authors: [{ name: "Content Forge" }],
  creator: "Content Forge",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Content Forge",
    statusBarStyle: "default",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Content Forge",
    title: "Content Forge — AI Content Platform",
    description:
      "Create, manage, and publish content at scale with AI.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Content Forge — AI Content Platform",
    description:
      "Create, manage, and publish content at scale with AI.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function () {
                  try {
                    const stored = localStorage.getItem("content-forge-theme");
                    const theme = stored === "light" || stored === "dark" ? stored : "system";
                    const resolved = theme === "system"
                      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
                      : theme;
                    document.documentElement.classList.add(resolved);
                    document.documentElement.style.colorScheme = resolved;
                  } catch (e) {}
                })();
              `,
            }}
          />
        </head>
        <body className={`${geistSans.variable} ${geistMono.variable} min-h-full flex flex-col antialiased`}>
          <ThemeProvider>{children}</ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
