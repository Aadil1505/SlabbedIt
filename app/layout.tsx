import type { Metadata } from "next";
import { Geist } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

// Geist Sans runs all the functional UI: body copy, control labels, values.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
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
      className={`${geistSans.variable} ${departureMono.variable} h-full antialiased`}
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
