import type { Metadata } from "next";
import { Sarabun, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const sarabun = Sarabun({
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["thai", "latin"],
  variable: "--font-sarabun",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Thatakiab Hospital · ER Code Clock ระบบบันทึกเวลาช่วยฟื้นคืนชีพ",
  description: "ระบบบันทึกเวลาช่วยฟื้นคืนชีพและเหตุการณ์ฉุกเฉิน โรงพยาบาลท่าตะเกียบ (Thatakiab Hospital) ฐานข้อมูล Google Sheets",
  icons: {
    icon: "/thatakiab-logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={`${sarabun.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
