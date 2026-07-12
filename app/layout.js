import "./globals.css";
import { siteInfo } from "../data/content";

export const metadata = {
  title: siteInfo.title,
  description: siteInfo.description,
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
