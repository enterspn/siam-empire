import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
import "./globals.css";

const sarabun = Sarabun({
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-sarabun",
});

export const metadata: Metadata = {
  title: "Siam Empire",
  description: "เกมจำลองอาณาจักรไทยโบราณ สำหรับการเรียนรู้ประวัติศาสตร์ในห้องเรียน",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={`${sarabun.className} bg-thai-paper`}>{children}</body>
    </html>
  );
}
