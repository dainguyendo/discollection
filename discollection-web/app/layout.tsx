import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { FloatingMenu } from "@/components/FloatingMenu";
import { FractalBackground } from "@/components/FractalBackground";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Discollection",
  description: "View your organized Discogs collection",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <FractalBackground />
          {children}
          <FloatingMenu />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
