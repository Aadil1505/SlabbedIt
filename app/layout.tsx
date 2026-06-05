import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

// Geist Sans runs all the functional UI: body copy, control labels, values.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Departure Mono is the identity face: pixel/retro, used only where it carries
// the brand (wordmark, section headers, the on-slab label). Kept off small,
// dense panel text where a bitmap face turns rough.
const departureMono = localFont({
  src: "../public/fonts/DepartureMono-Regular.woff2",
  variable: "--font-departure",
  display: "swap",
  weight: "400",
});

const SITE_URL = "https://slabbedit.vercel.app";
const TITLE = "SlabbedIt: Preview your card in a PSA slab";
const DESCRIPTION =
  "Drop in a trading card, pick a grade and label, and get a photorealistic graded-slab render you can admire and share before you pay to submit it.";

// metadataBase makes the file-based opengraph-image.png / twitter-image.png
// (in app/) resolve to absolute URLs, which crawlers require.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s · SlabbedIt",
  },
  description: DESCRIPTION,
  applicationName: "SlabbedIt",
  keywords: [
    "PSA slab",
    "card grading preview",
    "graded card mockup",
    "Pokémon card slab",
    "TCG slab generator",
    "trading card grading",
    "slab previewer",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "SlabbedIt",
    url: SITE_URL,
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_US",
    images: [
      { url: "/og.png", width: 1200, height: 630, alt: "SlabbedIt" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#1a2030",
  colorScheme: "dark light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${departureMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-dvh flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {/* Header + studio form the viewport-height "app" region on desktop;
              the footer sits below the fold. flex-1 fills the gap on mobile. */}
          <div className="flex flex-1 flex-col lg:h-dvh lg:flex-none">
            <SiteHeader />
            {children}
          </div>
          <SiteFooter />
        </ThemeProvider>
      </body>
    </html>
  );
}
