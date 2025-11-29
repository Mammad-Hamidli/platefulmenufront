import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ConditionalAuthProvider } from '@/components/ConditionalAuthProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PlatefulMenu',
  description: 'Role-based POS management for PlatefulMenu',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 text-slate-900`}>
        <ConditionalAuthProvider>{children}</ConditionalAuthProvider>
      </body>
    </html>
  );
}

