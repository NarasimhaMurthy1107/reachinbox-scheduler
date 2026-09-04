import React, { useState } from 'react';
import { SlackStatus } from '../types';
import { X, Bell, CheckCircle2, AlertCircle, Send, Link2, ShieldAlert } from 'lucide-react';

interface SlackModalProps {
  isOpen: boolean;
  onClose: () => void;
  slackStatus: SlackStatus | null;
  onSaveWebhook: (url: string, channel?: string) => Promise<void>;
  onTestNotification: () => Promise<string>;
  onDisconnect: () => Promise<void>;
}

export const SlackModal: React.FC<SlackModalProps> = ({
  isOpen,
  onClose,
  slackStatus,
  onSaveWebhook,
  onTestNotification,
  onDisconnect,
}) => {
  const [webhookUrl, setWebhookUrl] = useState<string>('');
  const [channel, setChannel] = useState<string>('#email-alerts');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestResult(null);
    if (!webhookUrl || !webhookUrl.startsWith('https://hooks.slack.com/')) {
      setTestResult({
        type: 'error',
        message: 'Please enter a valid Slack Incoming Webhook URL starting with https://hooks.slack.com/',
      });
      return;
    }

    try {
      setIsSaving(true);
      await onSaveWebhook(webhookUrl, channel);
      setTestResult({
        type: 'success',
        message: 'Slack webhook connected successfully!',
      });
    } catch (err: any) {
      setTestResult({
        type: 'error',
        message: err.message || 'Failed to save webhook',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    setTestResult(null);
    try {
      setIsTesting(true);
      const msg = await onTestNotification();
      setTestResult({
        type: 'success',
        message: msg || 'Test alert delivered to Slack channel!',
      });
    } catch (err: any) {
      setTestResult({
        type: 'error',
        message: err?.response?.data?.error || err.message || 'Failed to send test alert to Slack',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await onDisconnect();
      setTestResult({
        type: 'success',
        message: 'Slack integration disconnected.',
      });
    } catch (err: any) {
      setTestResult({
        type: 'error',
        message: err.message || 'Failed to disconnect',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-darkCard border border-darkBorder rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-darkBorder bg-darkSurface/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Slack Rate Limit Alerts</h2>
              <p className="text-[11px] text-gray-400">Live Webhook / OAuth Notifications</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                testResult.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-red-500/10 border-red-500/20 text-red-400'
              }`}
            >
              {testResult.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          {/* Current Connection Status */}
          <div className="p-3.5 rounded-xl bg-darkSurface border border-darkBorder flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  slackStatus?.isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'
                }`}
              />
              <div>
                <p className="text-xs font-medium text-white">
                  {slackStatus?.isConnected ? 'Connected to Slack' : 'Slack Not Connected'}
                </p>
                <p className="text-[11px] text-gray-400">
                  {slackStatus?.isConnected ? `Target Channel: ${slackStatus.channel}` : 'No webhook configured'}
                </p>
              </div>
            </div>

            {slackStatus?.isConnected && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTest}
                  disabled={isTesting}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all"
                >
                  <Send className="w-3 h-3" />
                  <span>{isTesting ? 'Sending...' : 'Test Alert'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="px-2.5 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-colors"
                >
                  Disconnect
                </button>
              </div>
            )}
          </div>

          {/* Webhook Form */}
          <form onSubmit={handleSave} className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Incoming Webhook URL
              </label>
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://hooks.slack.com/services/T000/B000/XXXX"
                className="w-full px-3 py-2 bg-darkSurface border border-darkBorder rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Channel Name
              </label>
              <input
                type="text"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                placeholder="#email-alerts"
                className="w-full px-3 py-2 bg-darkSurface border border-darkBorder rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="p-3 rounded-xl bg-darkSurface/50 border border-darkBorder text-[11px] text-gray-400 space-y-1">
              <div className="flex items-center gap-1 text-gray-300 font-medium">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>Rate Limit Trigger Behavior</span>
              </div>
              <p>
                When any sender reaches their hourly email quota, the scheduler dispatches a Slack Block Kit alert in real-time and gracefully defers excess emails into the next hour window.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-gray-400 hover:text-white"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Connecting...' : 'Save & Connect Slack'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
