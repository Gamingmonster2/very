import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'very ai | التفريغ الصوتي المحلي الذكي وآمن 100%',
  description: 'منصة ويب ممتازة لتفريغ المقاطع الصوتية والمقابلات إلى نصوص وملفات ترجمة SRT بالكامل داخل متصفحك بدقة متناهية وسرية مطلقة.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-darkBg selection:bg-brand-500/30 selection:text-white">
        {children}
      </body>
    </html>
  );
}
