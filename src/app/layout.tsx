import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/providers/AuthProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'EventQR - Smart Event Attendance & Item Redemption System',
  description: 'Enterprise Event Management System with Real-Time QR Attendance & Item Redemption Tracking',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-slate-50 text-slate-900 antialiased">
      <body className={`${inter.className} min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-indigo-600 selection:text-white`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
