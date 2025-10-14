import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "../components/ThemeProvider";
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
  title: "ColdUML - UML Diagram Generator",
  description: "A clean and minimal web tool to generate UML diagrams from simple text input. Create Class Diagrams and Use Case Diagrams with real-time preview.",
  keywords: ["UML", "diagram", "class diagram", "use case", "mermaid", "generator", "tool"],
  authors: [{ name: "Sourish Ghosh", url: "https://github.com/7sg56" }],
  creator: "Sourish Ghosh",
  openGraph: {
    title: "ColdUML - UML Diagram Generator",
    description: "Create UML diagrams with real-time preview from simple text commands",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
