import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Noto_Sans_KR, Noto_Sans_Thai, Sarabun } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { CategoryRegistryProvider } from "@/contexts/CategoryRegistryContext";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { OperatorViewProvider } from "@/contexts/OperatorViewContext";
import AppDataSync from "@/components/AppDataSync";
import PostsStorageInit from "@/components/PostsStorageInit";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoThai = Noto_Sans_Thai({
  variable: "--font-noto-thai",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
});

const sarabun = Sarabun({
  variable: "--font-sarabun",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
});

const notoKr = Noto_Sans_KR({
  variable: "--font-noto-kr",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Thai Korea Community",
  description:
    "แผนที่และคอมมูนิตี้สำหรับคนไทยในเกาหลี — 지도·리뷰·구인구직·구매대행·게시판",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={`${geistSans.variable} ${geistMono.variable} ${notoThai.variable} ${sarabun.variable} ${notoKr.variable} locale-th min-h-full antialiased`}
    >
      <body className="min-h-full">
        <AuthProvider>
          <OperatorViewProvider>
            <CategoryRegistryProvider>
              <LocaleProvider>
                <PostsStorageInit />
                <AppDataSync />
                {children}
              </LocaleProvider>
            </CategoryRegistryProvider>
          </OperatorViewProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
