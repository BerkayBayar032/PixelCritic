import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { resetPasswordApi } from '../services/authService';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!token) {
      setError('Invalid reset link. Please request a new one.');
      return;
    }

    setLoading(true);
    try {
      await resetPasswordApi(token, password);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden px-4">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="w-full max-w-md relative z-10 text-center">
          <div className="bg-surface/80 backdrop-blur-xl border border-border rounded-2xl p-8 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
              <p className="text-red-400">Invalid or missing reset token. Please request a new password reset link.</p>
            </div>
            <Link
              to="/login"
              className="text-primary hover:text-primary-hover font-bold transition-colors"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden px-4">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo/Header */}
        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="flex items-center gap-3 group mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface border border-primary/30 shadow-[0_0_20px_rgba(255,87,34,0.3)] group-hover:shadow-[0_0_30px_rgba(255,87,34,0.5)] transition-all duration-300">
              <span className="font-display text-2xl font-bold text-primary">PC</span>
            </div>
            <span className="font-display text-3xl font-bold tracking-tight text-white">
              PixelCritic
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-white mb-2">Set New Password</h1>
          <p className="text-text-muted text-sm text-center px-4">
            Enter your new password below.
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface/80 backdrop-blur-xl border border-border rounded-2xl p-8 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
          {success ? (
            <div className="text-center space-y-6 py-4">
              <div className="flex justify-center">
                <CheckCircle2 className="h-12 w-12 text-green-400" />
              </div>
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                <p className="text-green-400 font-medium">Password reset successful!</p>
                <p className="text-text-muted text-sm mt-2">Redirecting to login...</p>
              </div>
              <Link
                to="/login"
                className="inline-block text-primary hover:text-primary-hover font-bold transition-colors"
              >
                Go to Login Now
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-5 bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-sm text-red-400 text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* New Password */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-main ml-1">New Password</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                      <Lock className="h-5 w-5 text-text-muted group-focus-within:text-primary transition-colors" />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full bg-background border border-border rounded-xl py-3 pl-12 pr-4 text-text-main placeholder-text-muted/50 outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary focus:shadow-[0_0_15px_rgba(255,87,34,0.15)]"
                      placeholder="Enter new password"
                    />
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-main ml-1">Confirm Password</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                      <Lock className="h-5 w-5 text-text-muted group-focus-within:text-primary transition-colors" />
                    </div>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full bg-background border border-border rounded-xl py-3 pl-12 pr-4 text-text-main placeholder-text-muted/50 outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary focus:shadow-[0_0_15px_rgba(255,87,34,0.15)]"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-white font-bold py-3.5 rounded-xl mt-6 shadow-[0_0_15px_rgba(255,87,34,0.3)] hover:bg-primary-hover hover:shadow-[0_0_25px_rgba(255,87,34,0.5)] transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Reset Password
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="text-sm font-medium text-text-muted hover:text-white transition-colors"
                >
                  &larr; Back to Login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
