import type { Metadata, Viewport } from 'next';
import { Cairo, Tajawal } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '900'],
});

const tajawal = Tajawal({
  subsets: ['arabic'],
  variable: '--font-tajawal',
  display: 'swap',
  weight: ['300', '400', '500', '700', '800'],
});

export const metadata: Metadata = {
  title: {
    default: 'سُفرة واحدة — أطلب من أحسن مطاعم المنيا',
    template: '%s | سُفرة واحدة',
  },
  description:
    'أكتشف مطاعمك المفضلة، اطلب طعامك، وتابع توصيلك في المنيا — سريع، سهل، موثوق',
  keywords: ['مطاعم المنيا', 'توصيل طعام', 'اطلب اونلاين', 'سُفرة واحدة'],
  authors: [{ name: 'سُفرة واحدة' }],
  creator: 'سُفرة واحدة',
  openGraph: {
    type: 'website',
    locale: 'ar_EG',
    url: 'https://sufra-wahda.com',
    title: 'سُفرة واحدة',
    description: 'منصة طلب وتوصيل الطعام الأولى في المنيا',
    siteName: 'سُفرة واحدة',
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#7B1E3A',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${tajawal.variable}`}>
      <body className="font-cairo bg-gray-50 text-gray-800 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
