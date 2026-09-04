import React from 'react';
import { DashboardStats } from '../types';
import { Clock, Send, ShieldAlert, Users } from 'lucide-react';

interface StatsCardsProps {
  stats: DashboardStats | null;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  const cards = [
    {
      title: 'Scheduled Emails',
      value: stats?.scheduledCount ?? 0,
      icon: Clock,
      color: 'text-amber-400',
      bgColor: 'bg-amber-400/10',
      borderColor: 'border-amber-400/20',
      subtitle: 'Queued in BullMQ persistent store',
    },
    {
      title: 'Sent Emails',
      value: stats?.sentCount ?? 0,
      icon: Send,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-400/10',
      borderColor: 'border-emerald-400/20',
      subtitle: 'Delivered via Ethereal SMTP',
    },
    {
      title: 'Rate Limited / Delayed',
      value: stats?.rateLimitedCount ?? 0,
      icon: ShieldAlert,
      color: 'text-rose-400',
      bgColor: 'bg-rose-400/10',
      borderColor: 'border-rose-400/20',
      subtitle: 'Rescheduled into next hour window',
    },
    {
      title: 'Configured Senders',
      value: stats?.totalSenders ?? 0,
      icon: Users,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-400/10',
      borderColor: 'border-indigo-400/20',
      subtitle: 'Multi-sender throttle isolation',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div
            key={i}
            className={`p-4 rounded-xl bg-darkCard border ${c.borderColor} flex items-start justify-between relative overflow-hidden transition-all hover:border-zinc-600`}
          >
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{c.title}</p>
              <h3 className="text-2xl font-bold text-white mt-1">{c.value}</h3>
              <p className="text-[11px] text-gray-400 mt-1">{c.subtitle}</p>
            </div>
            <div className={`p-2.5 rounded-lg ${c.bgColor} ${c.color}`}>
              <Icon className="w-5 h-5" />
            </div>
          </div>
        );
      })}
    </div>
  );
};
