import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'يلا بلاي — لوحة الإدارة',
  description: 'Super Admin Dashboard for YallaPlay sports booking platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-canvas antialiased">
        {children}
      </body>
    </html>
  );
}
