import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import AuthProvider from "@/components/providers/AuthProvider";
import CustomCursor from "@/components/ui/CustomCursor";

export const metadata: Metadata = {
  title: "DSARunway — CoE Data Science & AI, Thapar",
  description:
    "Your runway to mastering Data Structures & Algorithms — an agentic AI tutor with curriculum-aware, personalized learning. A capstone initiative at the TIET-UQ Centre of Excellence in Data Science and Artificial Intelligence, Thapar Institute of Engineering & Technology.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // data-theme is the SSR default; ThemeContext updates it from localStorage on mount.
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased overflow-x-hidden" suppressHydrationWarning>
        <AuthProvider>
          <ThemeProvider>
            <CustomCursor />
            {children}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
