import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../context/UserContext';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { register, error, loading, clearError } = useAuth();

  useEffect(() => {
    clearError();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(username, email, password);
      navigate('/');
    } catch {
      // Error is set in context
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
          <h1 className="text-2xl font-bold text-white mb-2">Create an Account</h1>
          <p className="text-text-muted text-sm">Join the ultimate gaming community</p>
        </div>

        {/* Register Card */}
        <div className="bg-surface/80 backdrop-blur-xl border border-border rounded-2xl p-8 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
          {/* Error Message */}
          {error && (
            <div className="mb-5 bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-sm text-red-400 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Username Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-main ml-1">Username</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <User className="h-5 w-5 text-text-muted group-focus-within:text-primary transition-colors" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  minLength={3}
                  maxLength={30}
                  className="w-full bg-background border border-border rounded-xl py-3 pl-12 pr-4 text-text-main placeholder-text-muted/50 outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary focus:shadow-[0_0_15px_rgba(255,87,34,0.15)]"
                  placeholder="NeonNinja"
                />
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-main ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <Mail className="h-5 w-5 text-text-muted group-focus-within:text-primary transition-colors" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-background border border-border rounded-xl py-3 pl-12 pr-4 text-text-main placeholder-text-muted/50 outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary focus:shadow-[0_0_15px_rgba(255,87,34,0.15)]"
                  placeholder="gamer@example.com"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-main ml-1">Password</label>
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
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary text-white font-bold py-3.5 rounded-xl mt-6 shadow-[0_0_15px_rgba(255,87,34,0.3)] hover:bg-primary-hover hover:shadow-[0_0_25px_rgba(255,87,34,0.5)] transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Sign Up
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-8 flex items-center justify-center gap-4">
            <div className="h-px bg-border flex-1"></div>
            <span className="text-xs text-text-muted uppercase tracking-wider font-medium">Or</span>
            <div className="h-px bg-border flex-1"></div>
          </div>

          {/* Log In Link */}
          <p className="mt-8 text-center text-sm text-text-muted">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-primary hover:text-primary-hover transition-colors">
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
