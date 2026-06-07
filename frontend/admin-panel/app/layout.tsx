import type { Metadata } from 'next';
import { Cairo } from 'next/font/google';
import './globals.css';

const cairo = Cairo({ subsets: ['arabic', 'latin'], display: 'swap' });

export const metadata: Metadata = {
  title: 'لوحة الإدارة — سُفرة واحدة',
  description: 'إدارة المنصة الشاملة',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className={cairo.className}>{children}</body>
    </html>
  );
}
