import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../app/components/context/AuthContext";
import { Header } from "../app/components/Header"; // हमारे नए डायनामिक हेडर को इम्पोर्ट करें

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PrepBook - Your Exam Partner",
  description: "India's #1 Platform for Govt Exam Prep",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {/* हेडर को यहाँ रखें ताकि यह हर पेज पर दिखे */}
          <Header />
          <main>{children}</main>
          {/* आप यहाँ Footer भी जोड़ सकते हैं */}
        </AuthProvider>
      </body>
    </html>
  );
}
