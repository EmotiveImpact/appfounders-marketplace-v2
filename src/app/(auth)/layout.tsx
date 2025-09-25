import { Metadata } from 'next';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Authentication - AppFounders',
  description: 'Sign in or sign up to AppFounders - The Beta Tester Marketplace',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        {children}
      </div>
      <div className="relative hidden w-0 flex-1 lg:block">
        <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-indigo-600 to-purple-600">
          <div className="flex h-full items-center justify-center p-8">
            <div className="max-w-2xl text-white">
              <div className="testimonial-content">
                <blockquote className="text-2xl font-medium">
                  "AppFounders has transformed how we connect with early adopters. Our beta testing process is now seamless, and we've built a loyal community of users who champion our product."
                </blockquote>
                <div className="mt-6">
                  <p className="font-semibold">Sarah Johnson</p>
                  <p className="text-sm opacity-80">Founder & CEO, TaskFlow Pro</p>
                  <p className="text-sm opacity-80">Productivity App</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
