import { Metadata } from 'next';
import Link from 'next/link';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

export const metadata: Metadata = {
  title: 'Forgot Password - AppFounders',
  description: 'Reset your AppFounders account password',
};

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto w-full max-w-sm lg:w-96">
      <div>
        <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">Forgot Password?</h2>
        <p className="mt-2 text-sm text-gray-600">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      <div className="mt-8">
        <div className="mt-6">
          <ForgotPasswordForm />
          <div className="mt-6 text-center">
            <Link href="/signin" className="text-sm font-medium text-blue-600 hover:text-blue-500">
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
