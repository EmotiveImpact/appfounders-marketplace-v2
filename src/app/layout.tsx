import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/ui/navbar';
import Footer from '@/components/ui/footer';
import NextAuthSessionProvider from '@/providers/session-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AppFounders - Beta Tester Marketplace',
  description: 'Connect app developers with beta testers through lifetime founder accounts',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/images/logo-code-tags.svg', type: 'image/svg+xml' }
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NextAuthSessionProvider>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow">{children}</main>
            <Footer />
          </div>
        </NextAuthSessionProvider>
      </body>
    </html>
  );
}
