import type { Metadata } from "next";
import "./globals.css";
import VisitorTracker from "@/components/VisitorTracker";

export const metadata: Metadata = {
  title: "The Digital Observer",
  description: "Interactive portfolio website",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <VisitorTracker />
        {children}
      </body>
    </html>
  );
}
