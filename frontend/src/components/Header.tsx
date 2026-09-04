import React from 'react';
import { User, SlackStatus } from '../types';
import { LogOut, Bell, ExternalLink, ShieldCheck, Mail } from 'lucide-react';

interface HeaderProps {
  user: User | null;
  slackStatus: SlackStatus | null;
  onOpenSlackModal: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  slackStatus,
  onOpenSlackModal,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#090A0F]/80 backdrop-blur-md border-b border-darkBorder px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-white text-base">ReachInbox</span>
              <span className="px-2 py-0.5 text-[10px] uppercase font-semibold tracking-wider rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Scheduler Pro
              </span>
            </div>
            <p className="text-xs text-gray-400">Outbox Labs High-Throughput Email Engine</p>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          {/* Slack Integration Status Badge */}
          <button
            onClick={onOpenSlackModal}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              slackStatus?.isConnected
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-zinc-800/60 border-darkBorder text-gray-400 hover:text-gray-200 hover:border-zinc-700'
            }`}
            title="Slack Rate Limit Alert Settings"
          >
            <span className={`w-2 h-2 rounded-full ${slackStatus?.isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`} />
            <Bell className="w-3.5 h-3.5" />
            <span>{slackStatus?.isConnected ? `Slack: ${slackStatus.channel}` : 'Connect Slack'}</span>
          </button>

          {/* BullMQ Dashboard External Link */}
          <a
            href="http://localhost:5000/admin/queues"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800/80 border border-darkBorder text-gray-300 hover:text-white hover:border-zinc-600 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>BullMQ Live Monitor</span>
            <ExternalLink className="w-3 h-3 text-gray-400" />
          </a>

          {/* User Profile info */}
          {user && (
            <div className="flex items-center gap-3 pl-3 border-l border-darkBorder">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-8 h-8 rounded-full border border-indigo-500/40 object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs text-white">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <div className="hidden sm:block text-left">
                <div className="text-xs font-medium text-white leading-tight">{user.name}</div>
                <div className="text-[11px] text-gray-400 leading-tight truncate max-w-[140px]">{user.email}</div>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors ml-1"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
