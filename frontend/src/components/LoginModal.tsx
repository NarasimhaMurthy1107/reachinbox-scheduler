import React, { useState } from 'react';
import { Mail, Zap, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onDemoLogin: () => Promise<void>;
  onGoogleLogin: (credential: string) => Promise<void>;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onDemoLogin,
  onGoogleLogin,
}) => {
  const [googleCredential, setGoogleCredential] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [showManualGoogle, setShowManualGoogle] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDemoClick = async () => {
    try {
      setIsLoggingIn(true);
      setError(null);
      await onDemoLogin();
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleManualGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleCredential.trim()) return;
    try {
      setIsLoggingIn(true);
      setError(null);
      await onGoogleLogin(googleCredential.trim());
    } catch (err: any) {
      setError(err.message || 'Google login failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-darkCard border border-darkBorder rounded-3xl p-8 shadow-2xl overflow-hidden text-center">
        {/* Glow backdrop */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Icon */}
        <div className="relative w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-xl shadow-indigo-500/30 mb-5">
          <Mail className="w-7 h-7 text-white" />
        </div>

        <h2 className="text-xl font-bold text-white tracking-tight">ReachInbox Email Scheduler</h2>
        <p className="text-xs text-gray-400 mt-2 max-w-xs mx-auto">
          Production-grade distributed scheduler with BullMQ, Redis sliding-window rate limiting, and Ethereal fake SMTP.
        </p>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 space-y-3">
          {/* 1-Click Demo Login for Hiring Reviewers */}
          <button
            type="button"
            onClick={handleDemoClick}
            disabled={isLoggingIn}
            className="w-full flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{isLoggingIn ? 'Authenticating...' : '1-Click Reviewer Login (Instant Access)'}</span>
          </button>

          <div className="relative my-4 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-darkBorder" />
            </div>
            <span className="relative px-3 bg-darkCard text-[11px] text-gray-500 uppercase tracking-wider">
              or Google Sign In
            </span>
          </div>

          {/* Google OAuth Login option */}
          {!showManualGoogle ? (
            <button
              type="button"
              onClick={() => setShowManualGoogle(true)}
              className="w-full flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-xl bg-darkSurface hover:bg-zinc-800 border border-darkBorder text-gray-200 font-medium text-xs transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.4 8.9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.6 7.2C.6 9.2 0 10.5 0 12s.6 2.8 1.6 4.8l3.7-2.1z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5.1L1.6 16.1C3.5 20 7.4 23 12 23z"
                />
              </svg>
              <span>Sign in with Google OAuth</span>
            </button>
          ) : (
            <form onSubmit={handleManualGoogleSubmit} className="space-y-2 text-left">
              <label className="block text-[11px] text-gray-400">Google ID Token / Credential</label>
              <input
                type="text"
                value={googleCredential}
                onChange={(e) => setGoogleCredential(e.target.value)}
                placeholder="Paste Google JWT / id_token"
                className="w-full px-3 py-2 bg-darkSurface border border-darkBorder rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 font-mono"
              />
              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold"
              >
                Verify & Sign In
              </button>
            </form>
          )}
        </div>

        {/* Feature Highlights */}
        <div className="mt-8 pt-6 border-t border-darkBorder grid grid-cols-3 gap-2 text-[10px] text-gray-400">
          <div className="flex flex-col items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
            <span>BullMQ Delayed</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Crash Resilient</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Elasticsearch</span>
          </div>
        </div>
      </div>
    </div>
  );
};
