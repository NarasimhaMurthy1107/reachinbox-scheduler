import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { Sender } from '../types';
import { X, Upload, CheckCircle2, Clock, AlertCircle, FileText, Send, Sliders } from 'lucide-react';

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  senders: Sender[];
  onSuccess: () => void;
  onSubmit: (payload: {
    senderEmail: string;
    senderName?: string;
    recipients: string[];
    subject: string;
    body: string;
    startTime?: string;
    delayBetweenEmailsSeconds: number;
    hourlyLimit: number;
  }) => Promise<void>;
}

export const ComposeModal: React.FC<ComposeModalProps> = ({
  isOpen,
  onClose,
  senders,
  onSubmit,
  onSuccess,
}) => {
  const [selectedSender, setSelectedSender] = useState<string>(senders[0]?.email || 'alex.growth@reachinbox.ai');
  const [customSender, setCustomSender] = useState<string>('');
  const [useCustomSender, setUseCustomSender] = useState<boolean>(false);
  const [subject, setSubject] = useState<string>('Personalized Outreach: Accelerate your outbound engine');
  const [body, setBody] = useState<string>(
    'Hi {{name}},\n\nI came across your work at your company and was really impressed. At ReachInbox, we help businesses automate multi-sender cold outreach with guaranteed deliverability and zero spam.\n\nWould you be open for a 10-minute coffee chat this Thursday?\n\nBest regards,\nReachInbox Team'
  );

  const [recipients, setRecipients] = useState<string[]>([
    'lead1.acme@example.com',
    'lead2.techcorp@example.com',
    'partner.growth@startup.io',
  ]);
  const [manualInput, setManualInput] = useState<string>('');

  const [scheduleType, setScheduleType] = useState<'now' | 'later'>('now');
  const [scheduledDateTime, setScheduledDateTime] = useState<string>('');
  const [delayBetweenEmails, setDelayBetweenEmails] = useState<number>(2);
  const [hourlyLimit, setHourlyLimit] = useState<number>(50);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [detectedFileCount, setDetectedFileCount] = useState<number | null>(3);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      complete: (results) => {
        const foundEmails = new Set<string>();
        for (const row of results.data as any[]) {
          if (Array.isArray(row)) {
            for (const cell of row) {
              const str = String(cell).trim();
              if (emailRegex.test(str)) {
                foundEmails.add(str.toLowerCase());
              }
            }
          } else if (typeof row === 'object' && row !== null) {
            for (const val of Object.values(row)) {
              const str = String(val).trim();
              if (emailRegex.test(str)) {
                foundEmails.add(str.toLowerCase());
              }
            }
          }
        }

        const emailArr = Array.from(foundEmails);
        if (emailArr.length > 0) {
          setRecipients(emailArr);
          setDetectedFileCount(emailArr.length);
          setErrorMessage(null);
        } else {
          setErrorMessage('No valid email addresses found in the uploaded file.');
        }
      },
      error: (err) => {
        setErrorMessage('Failed to parse file: ' + err.message);
      },
    });
  };

  const handleAddManualEmails = () => {
    if (!manualInput.trim()) return;
    const tokens = manualInput.split(/[\n,; ]+/);
    const valid = tokens
      .map((t) => t.trim().toLowerCase())
      .filter((t) => emailRegex.test(t));

    const combined = Array.from(new Set([...recipients, ...valid]));
    setRecipients(combined);
    setDetectedFileCount(combined.length);
    setManualInput('');
  };

  const handleRemoveRecipient = (emailToRemove: string) => {
    const updated = recipients.filter((r) => r !== emailToRemove);
    setRecipients(updated);
    setDetectedFileCount(updated.length);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const senderEmail = useCustomSender ? customSender.trim() : selectedSender;
    if (!senderEmail || !emailRegex.test(senderEmail)) {
      setErrorMessage('Please provide a valid sender email address.');
      return;
    }

    if (recipients.length === 0) {
      setErrorMessage('Please add or upload at least one recipient email.');
      return;
    }

    if (!subject.trim()) {
      setErrorMessage('Email subject is required.');
      return;
    }

    if (!body.trim()) {
      setErrorMessage('Email body is required.');
      return;
    }

    let startTimeIso: string | undefined = undefined;
    if (scheduleType === 'later') {
      if (!scheduledDateTime) {
        setErrorMessage('Please select a scheduled start date and time.');
        return;
      }
      startTimeIso = new Date(scheduledDateTime).toISOString();
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        senderEmail,
        recipients,
        subject,
        body,
        startTime: startTimeIso,
        delayBetweenEmailsSeconds: Number(delayBetweenEmails),
        hourlyLimit: Number(hourlyLimit),
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.error || err.message || 'Failed to schedule emails');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-darkCard border border-darkBorder rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-darkBorder bg-darkSurface/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Compose & Schedule Emails</h2>
              <p className="text-[11px] text-gray-400">Persistent BullMQ Queue with Staggered Delays & Rate Limits</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleFormSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Sender Email */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-gray-300">From / Sender</label>
              <button
                type="button"
                onClick={() => setUseCustomSender(!useCustomSender)}
                className="text-[11px] text-indigo-400 hover:text-indigo-300"
              >
                {useCustomSender ? 'Choose existing sender' : '+ Add custom sender'}
              </button>
            </div>

            {useCustomSender ? (
              <input
                type="email"
                value={customSender}
                onChange={(e) => setCustomSender(e.target.value)}
                placeholder="e.g. founder@mycompany.com"
                className="w-full px-3 py-2 bg-darkSurface border border-darkBorder rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
            ) : (
              <select
                value={selectedSender}
                onChange={(e) => setSelectedSender(e.target.value)}
                className="w-full px-3 py-2 bg-darkSurface border border-darkBorder rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {senders.map((s) => (
                  <option key={s.id} value={s.email}>
                    {s.name} ({s.email}) — Limit: {s.hourlyLimit}/hr
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Lead CSV/Text File Upload */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">
              Recipients / Leads (CSV or Text File)
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-darkBorder hover:border-indigo-500/50 rounded-xl p-4 text-center cursor-pointer bg-darkSurface/30 hover:bg-darkSurface/60 transition-all"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".csv,.txt"
                className="hidden"
              />
              <Upload className="w-6 h-6 text-indigo-400 mx-auto mb-1.5" />
              <p className="text-xs text-gray-300 font-medium">
                Click to upload leads CSV or TXT file
              </p>
              <p className="text-[11px] text-gray-500">Supports standard CSV exports or plain email lists</p>
            </div>

            {/* Detected Emails Indicator */}
            {detectedFileCount !== null && (
              <div className="mt-2 flex items-center justify-between p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="font-medium">{detectedFileCount} email addresses detected</span>
                </div>
                <span className="text-[11px] text-emerald-300 font-mono">Deduplicated & validated</span>
              </div>
            )}

            {/* Recipient Chips Preview */}
            {recipients.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-darkSurface/60 rounded-xl border border-darkBorder">
                {recipients.map((email) => (
                  <span
                    key={email}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] bg-zinc-800 text-gray-300 border border-zinc-700 font-mono"
                  >
                    <span>{email}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveRecipient(email)}
                      className="hover:text-red-400 ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Quick manual entry */}
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddManualEmails())}
                placeholder="Or paste email addresses separated by commas..."
                className="flex-1 px-3 py-1.5 bg-darkSurface border border-darkBorder rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddManualEmails}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-gray-200 text-xs rounded-lg transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          {/* Subject Line */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Scaling outbound outreach with ReachInbox"
              className="w-full px-3 py-2 bg-darkSurface border border-darkBorder rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">Email Body</label>
            <textarea
              rows={5}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your email content here..."
              className="w-full px-3 py-2 bg-darkSurface border border-darkBorder rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 font-sans resize-none"
            />
          </div>

          {/* Scheduling Configuration */}
          <div className="p-4 rounded-xl bg-darkSurface/50 border border-darkBorder space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-200">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <span>Throughput & Throttling Parameters</span>
            </div>

            {/* Start Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-gray-400 mb-1">Start Time</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setScheduleType('now')}
                    className={`flex-1 py-1.5 text-xs rounded-lg border font-medium transition-all ${
                      scheduleType === 'now'
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-darkSurface border-darkBorder text-gray-400 hover:text-white'
                    }`}
                  >
                    Send Immediately
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleType('later')}
                    className={`flex-1 py-1.5 text-xs rounded-lg border font-medium transition-all ${
                      scheduleType === 'later'
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-darkSurface border-darkBorder text-gray-400 hover:text-white'
                    }`}
                  >
                    Schedule Time
                  </button>
                </div>
              </div>

              {scheduleType === 'later' && (
                <div>
                  <label className="block text-[11px] font-medium text-gray-400 mb-1">Send Date & Time</label>
                  <input
                    type="datetime-local"
                    value={scheduledDateTime}
                    onChange={(e) => setScheduledDateTime(e.target.value)}
                    className="w-full px-3 py-1.5 bg-darkSurface border border-darkBorder rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}
            </div>

            {/* Delay & Rate Limit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-darkBorder">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-medium text-gray-400">Delay Between Sends</label>
                  <span className="text-[11px] text-indigo-400 font-mono font-bold">{delayBetweenEmails}s</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={30}
                  step={1}
                  value={delayBetweenEmails}
                  onChange={(e) => setDelayBetweenEmails(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
                <p className="text-[10px] text-gray-500 mt-0.5">Staggers sends to mimic provider throttling</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-medium text-gray-400">Hourly Rate Limit</label>
                  <span className="text-[11px] text-amber-400 font-mono font-bold">{hourlyLimit}/hr</span>
                </div>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={hourlyLimit}
                  onChange={(e) => setHourlyLimit(Number(e.target.value))}
                  className="w-full px-3 py-1 bg-darkSurface border border-darkBorder rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[10px] text-gray-500 mt-0.5">Auto-delays excess into next hour + alerts Slack</p>
              </div>
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-darkBorder">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Enqueuing Jobs...</span>
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4" />
                  <span>Schedule {recipients.length} Email{recipients.length !== 1 ? 's' : ''}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
