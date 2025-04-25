import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { API_URL } from '@/lib/constants';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

// Form schema
const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

const ResetPassword: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (!token) {
      toast.error('Invalid reset token');
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setResetComplete(true);
        toast.success('Password has been reset successfully');
        
        // If we received a token, auto-login the user
        if (result.token) {
          // Store the token in localStorage
          localStorage.setItem('token', result.token);
          
          // Call the login context method to update the auth state
          await login(data.password, data.password); // Using password as dummy values since we already have the token
          
          // Redirect to home page after a delay
          setTimeout(() => {
            navigate('/');
          }, 2000);
        }
      } else {
        toast.error(result.message || 'Failed to reset password');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again later');
      console.error('Reset password error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <div className="w-full max-w-md space-y-8 rounded-lg border bg-white p-8 shadow-md">
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Invalid Request</h1>
            <p className="mt-2 text-gray-600">
              The password reset link is invalid or has expired.
            </p>
          </div>
          <div className="mt-4 text-center">
            <Link
              to="/forgot-password"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Request a new password reset link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8 rounded-lg border bg-white p-8 shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Reset Password</h1>
          <p className="mt-2 text-gray-600">
            {resetComplete
              ? 'Your password has been successfully reset'
              : 'Create a new password for your account'}
          </p>
        </div>

        {!resetComplete ? (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <input
                id="password"
                type="password"
                {...register('password')}
                className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm ${
                  errors.password ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                {...register('confirmPassword')}
                className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm ${
                  errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-75"
              >
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-4 flex flex-col items-center space-y-4">
            <p className="text-sm text-gray-600">
              You will be automatically redirected to the homepage.
            </p>
            <Link
              to="/"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Go to Home
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPassword; 