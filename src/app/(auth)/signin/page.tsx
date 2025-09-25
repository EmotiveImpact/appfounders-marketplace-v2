import { Metadata } from 'next';
import Link from 'next/link';
import { SignInForm } from '@/components/auth/sign-in-form';

export const metadata: Metadata = {
  title: 'Sign In - AppFounders',
  description: 'Sign in to your AppFounders account',
};

export default function SignInPage() {
  return (
    <div className="mx-auto w-full max-w-sm lg:w-96">
      <div>
        <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">Sign In</h2>
        <p className="mt-2 text-sm text-gray-600">
          Welcome back! Please enter your details.
        </p>
      </div>

      <div className="mt-8">
        <div className="mt-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Link 
                href="/signin" 
                className="w-1/2 py-2 text-center border-b-2 border-blue-600 text-blue-600 font-medium"
              >
                Sign In
              </Link>
              <Link 
                href="/signup" 
                className="w-1/2 py-2 text-center border-b-2 border-gray-200 text-gray-500 hover:text-gray-700 font-medium"
              >
                Sign Up
              </Link>
            </div>
            <SignInForm />
          </div>
        </div>
      </div>
    </div>
  );
}
