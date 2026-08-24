import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import AuthProvider from "@/components/providers/AuthProvider";
import RouteProgress from "@/components/layout/RouteProgress";

export const metadata: Metadata = {
  title: "DSARunway — Your Smart DSA Learning Companion",
  description: "An agentic AI tutor for Data Structures & Algorithms — Socratic tutoring, live visualizations, an in-browser compiler, and curriculum-aware personalized learning.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&family=Playfair+Display:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased" style={{ overflowX: "hidden" }} suppressHydrationWarning>
        <AuthProvider>
          <ThemeProvider>
            <RouteProgress />
            {children}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
