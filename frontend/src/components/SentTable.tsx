import React from 'react';
import { EmailJob } from '../types';
import { CheckCircle2, XCircle, ExternalLink, Calendar, User, Send } from 'lucide-react';
import { format } from 'date-fns';

interface SentTableProps {
  emails: EmailJob[];
  isLoading: boolean;
  onOpenCompose: () => void;
}

export const SentTable: React.FC<SentTableProps> = ({
  emails,
  isLoading,
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
              <div className="h-6 bg-zinc-800 rounded w-28" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="rounded-xl border border-darkBorder bg-darkCard p-12 text-center flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
          <Send className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-white mb-1">No sent emails yet</h3>
        <p className="text-xs text-gray-400 max-w-sm mb-5">
          Sent emails will appear here once processed by the BullMQ worker, complete with verifiable Ethereal preview links.
        </p>
        <button
          onClick={onOpenCompose}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
        >
          Schedule an Email Now
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
              <th className="px-5 py-3.5">Sent Time</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5 text-right">Ethereal SMTP Verification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-darkBorder text-gray-200">
            {emails.map((email) => {
              const sentDate = email.sentAt ? new Date(email.sentAt) : new Date(email.updatedAt || email.createdAt);
              return (
                <tr key={email.id} className="hover:bg-darkSurface/40 transition-colors group">
                  {/* Recipient */}
                  <td className="px-5 py-4 font-medium text-white">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-[10px]">
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

                  {/* Sent Time */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-gray-300">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span>{format(sentDate, 'MMM d, yyyy · HH:mm:ss')}</span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    {email.status === 'SENT' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        Delivered
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <XCircle className="w-3 h-3" />
                        Failed
                      </span>
                    )}
                  </td>

                  {/* Ethereal Verification Link */}
                  <td className="px-5 py-4 text-right whitespace-nowrap">
                    {email.etherealUrl ? (
                      <a
                        href={email.etherealUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-indigo-300 hover:text-indigo-200 border border-zinc-700 transition-colors shadow-sm"
                        title="Open email preview in Ethereal"
                      >
                        <span>View in Ethereal</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-gray-500 text-[11px] italic">No preview URL</span>
                    )}
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
