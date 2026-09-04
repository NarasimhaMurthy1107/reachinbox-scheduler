import React from 'react';
import { EmailJob } from '../types';
import { Clock, AlertTriangle, Trash2, Calendar, User, MailCheck } from 'lucide-react';
import { format } from 'date-fns';

interface ScheduledTableProps {
  emails: EmailJob[];
  isLoading: boolean;
  onCancelEmail: (id: string) => void;
  onOpenCompose: () => void;
}

export const ScheduledTable: React.FC<ScheduledTableProps> = ({
  emails,
  isLoading,
  onCancelEmail,
  onOpenCompose,
}) => {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-darkBorder bg-darkCard overflow-hidden">
        <div className="p-4 border-b border-darkBorder">
          <div className="h-4 bg-zinc-800 rounded w-48 animate-pulse" />
        </div>
        <div className="divide-y divide-darkBorder">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="p-4 flex items-center justify-between gap-4 animate-pulse">
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-zinc-800 rounded w-1/3" />
                <div className="h-3 bg-zinc-800/60 rounded w-1/2" />
              </div>
              <div className="h-6 bg-zinc-800 rounded w-24" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="rounded-xl border border-darkBorder bg-darkCard p-12 text-center flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
          <Clock className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-white mb-1">No scheduled emails</h3>
        <p className="text-xs text-gray-400 max-w-sm mb-5">
          There are no emails currently waiting in the queue. Schedule a batch or cold email outreach now.
        </p>
        <button
          onClick={onOpenCompose}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
        >
          Compose & Schedule Email
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-darkBorder bg-darkCard overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-darkSurface/60 text-gray-400 uppercase tracking-wider border-b border-darkBorder font-medium">
            <tr>
              <th className="px-5 py-3.5">Recipient</th>
              <th className="px-5 py-3.5">Subject & Content</th>
              <th className="px-5 py-3.5">Sender</th>
              <th className="px-5 py-3.5">Scheduled Send Time</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-darkBorder text-gray-200">
            {emails.map((email) => {
              const scheduledDate = new Date(email.scheduledAt);
              return (
                <tr key={email.id} className="hover:bg-darkSurface/40 transition-colors group">
                  {/* Recipient */}
                  <td className="px-5 py-4 font-medium text-white">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-gray-300 font-bold text-[10px]">
                        {email.recipientEmail.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-mono">{email.recipientEmail}</span>
                    </div>
                  </td>

                  {/* Subject & Preview */}
                  <td className="px-5 py-4 max-w-md">
                    <div className="font-semibold text-white truncate">{email.subject}</div>
                    <div className="text-[11px] text-gray-400 truncate mt-0.5">{email.body}</div>
                  </td>

                  {/* Sender */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 text-gray-300">
                      <User className="w-3.5 h-3.5 text-gray-500" />
                      <span className="text-[11px] font-mono">{email.senderEmail}</span>
                    </div>
                  </td>

                  {/* Scheduled Time */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-gray-300">
                      <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{format(scheduledDate, 'MMM d, yyyy · HH:mm:ss')}</span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    {email.status === 'RATE_LIMITED' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <AlertTriangle className="w-3 h-3 animate-pulse" />
                        Rate Limited (Delayed)
                      </span>
                    ) : email.status === 'PROCESSING' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        <Clock className="w-3 h-3 animate-spin" />
                        Sending Now
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        <Clock className="w-3 h-3" />
                        Queued in BullMQ
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => onCancelEmail(email.id)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Cancel Scheduled Send"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
