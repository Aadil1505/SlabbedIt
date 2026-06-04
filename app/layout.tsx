import type { Metadata } from "next";
import { Geist, Roboto_Condensed } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

// Geist Sans runs all the functional UI: body copy, control labels, values.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Univers Condensed (regular + bold) is the actual condensed grotesque PSA
// prints on its labels. Used only on the accurate slab label. Self-hosted by
// next/font, so it embeds cleanly when the slab is exported to PNG.
const univers = localFont({
  src: [
    {
      path: "../public/fonts/UniversCondensed-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/UniversCondensed-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-univers",
  display: "swap",
});

// Roboto Condensed is the free fallback if Univers ever fails to load — the same
// Helvetica-Condensed-Bold look.
const robotoCondensed = Roboto_Condensed({
  variable: "--font-condensed",
  subsets: ["latin"],
  weight: ["400", "700"],
});

// Departure Mono is the identity face — pixel/retro, used only where it carries
// the brand (wordmark, section headers, the on-slab label). Kept off small,
// dense panel text where a bitmap face turns rough.
const departureMono = localFont({
  src: "../public/fonts/DepartureMono-Regular.woff2",
  variable: "--font-departure",
  display: "swap",
  weight: "400",
});

export const metadata: Metadata = {
  title: "GuardedView",
  description: "Preview your graded card in a slab.",
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
      className={`${geistSans.variable} ${departureMono.variable} ${univers.variable} ${robotoCondensed.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
