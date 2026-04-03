import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../context/UserContext';
import { forgotPassword } from '../services/authService';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const navigate = useNavigate();
  const { login, error, loading, clearError } = useAuth();

  useEffect(() => {
    clearError();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(identifier, password);
      navigate('/');
    } catch {
      // Error is set in context
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError('');
    try {
      await forgotPassword(identifier);
      setResetSent(true);
    } catch (err: any) {
      setResetError(err.response?.data?.message || 'Failed to send reset email. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden px-4">
      {/* Ambient Background Glow */}
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
          <h1 className="text-2xl font-bold text-white mb-2">
            {isResetMode ? 'Reset Password' : 'Welcome Back'}
          </h1>
          <p className="text-text-muted text-sm text-center px-4">
            {isResetMode
              ? 'Enter your email address and we will send you a link to reset your password.'
              : 'Enter your credentials to access your account'}
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-surface/80 backdrop-blur-xl border border-border rounded-2xl p-8 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
          {/* Error Message */}
          {resetError && isResetMode && (
            <div className="mb-5 bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-sm text-red-400 text-center">
              {resetError}
            </div>
          )}
          {error && !isResetMode && (
            <div className="mb-5 bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-sm text-red-400 text-center">
              {error}
            </div>
          )}

          <form onSubmit={isResetMode ? handleResetSubmit : handleSubmit} className="space-y-5">

            {resetSent ? (
              <div className="text-center space-y-6 py-4">
                <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
                  <p className="text-text-main">
                    Check your inbox! A reset link has been sent to <span className="font-bold text-white">{identifier}</span>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setIsResetMode(false); setResetSent(false); }}
                  className="w-full flex items-center justify-center gap-2 bg-surface border border-border text-white font-bold py-3.5 rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.3)] hover:bg-border hover:shadow-[0_0_25px_rgba(0,0,0,0.5)] transition-all hover:-translate-y-0.5"
                >
                  Back to Login
                </button>
              </div>
            ) : (
              <>
                {/* Username/Email Input */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-sm font-medium text-text-main">
                      {isResetMode ? 'Email Address' : 'Username or Email'}
                    </label>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                      <Mail className="h-5 w-5 text-text-muted group-focus-within:text-primary transition-colors" />
                    </div>
                    <input
                      type={isResetMode ? "email" : "text"}
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      required
                      className="w-full bg-background border border-border rounded-xl py-3 pl-12 pr-4 text-text-main placeholder-text-muted/50 outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary focus:shadow-[0_0_15px_rgba(255,87,34,0.15)]"
                      placeholder="gamer@example.com"
                    />
                  </div>
                </div>

                {/* Password Input */}
                {!isResetMode && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between ml-1">
                      <label className="text-sm font-medium text-text-main">Password</label>
                      <button
                        type="button"
                        onClick={() => setIsResetMode(true)}
                        className="text-xs font-medium text-primary hover:text-white transition-colors cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                        <Lock className="h-5 w-5 text-text-muted group-focus-within:text-primary transition-colors" />
                      </div>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full bg-background border border-border rounded-xl py-3 pl-12 pr-4 text-text-main placeholder-text-muted/50 outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary focus:shadow-[0_0_15px_rgba(255,87,34,0.15)]"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || resetLoading}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-white font-bold py-3.5 rounded-xl mt-6 shadow-[0_0_15px_rgba(255,87,34,0.3)] hover:bg-primary-hover hover:shadow-[0_0_25px_rgba(255,87,34,0.5)] transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  {(loading || resetLoading) ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : isResetMode ? (
                    'Send Reset Link'
                  ) : (
                    <>
                      Log In
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>

                {/* Back to Login Link */}
                {isResetMode && (
                  <div className="mt-4 text-center">
                    <button
                      type="button"
                      onClick={() => { setIsResetMode(false); setResetSent(false); }}
                      className="text-sm font-medium text-text-muted hover:text-white transition-colors cursor-pointer"
                    >
                      &lt;- Back to Login
                    </button>
                  </div>
                )}
              </>
            )}
          </form>

          {/* Divider */}
          {!isResetMode && (
            <>
              <div className="mt-8 flex items-center justify-center gap-4">
                <div className="h-px bg-border flex-1"></div>
                <span className="text-xs text-text-muted uppercase tracking-wider font-medium">Or</span>
                <div className="h-px bg-border flex-1"></div>
              </div>

              {/* Sign Up Link */}
              <p className="mt-8 text-center text-sm text-text-muted">
                Don't have an account?{' '}
                <Link to="/register" className="font-bold text-primary hover:text-primary-hover transition-colors">
                  Sign Up
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
