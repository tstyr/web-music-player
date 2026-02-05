import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Spotify Clone Desktop",
  description: "Professional Spotify Clone Desktop Server App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="dark">
      <body className="antialiased bg-black text-white overflow-hidden">
        <div className="h-screen flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
