import type { Metadata } from 'next';
import Navbar from '@/components/ui/navbar';
import Footer from '@/components/ui/footer';

export const metadata: Metadata = {
  title: 'Submit Your App - AppFounders',
  description: 'Submit your app to the AppFounders marketplace and reach thousands of potential users.',
};

export default function SubmitAppLayout({
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
