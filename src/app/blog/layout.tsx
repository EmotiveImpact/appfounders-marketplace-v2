import type { Metadata } from 'next';
import Navbar from '@/components/ui/navbar';
import Footer from '@/components/ui/footer';

export const metadata: Metadata = {
  title: 'Blog - AppFounders',
  description: 'Insights, tutorials, and news from the app development community',
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
}
