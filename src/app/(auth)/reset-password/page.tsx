import { Metadata } from 'next';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';

export const metadata: Metadata = {
  title: 'Reset Password - AppFounders',
  description: 'Reset your AppFounders account password',
};

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto w-full max-w-sm lg:w-96">
      <div>
        <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">Reset Password</h2>
        <p className="mt-2 text-sm text-gray-600">
          Create a new password for your account.
        </p>
      </div>

      <div className="mt-8">
        <div className="mt-6">
          <ResetPasswordForm />
        </div>
      </div>
    </div>
  );
}
