import React, { useState, useEffect, useCallback } from 'react';
import { api } from './api';
import { User, EmailJob, Sender, DashboardStats, SlackStatus } from './types';
import { Header } from './components/Header';
import { StatsCards } from './components/StatsCards';
import { DashboardTabs } from './components/DashboardTabs';
import { ScheduledTable } from './components/ScheduledTable';
import { SentTable } from './components/SentTable';
import { ComposeModal } from './components/ComposeModal';
import { SlackModal } from './components/SlackModal';
import { LoginModal } from './components/LoginModal';

export const App: React.FC = () => {
  
  const [user, setUser] = useState<User | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  
  const [activeTab, setActiveTab] = useState<'scheduled' | 'sent'>('scheduled');
  const [scheduledEmails, setScheduledEmails] = useState<EmailJob[]>([]);
  const [sentEmails, setSentEmails] = useState<EmailJob[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [senders, setSenders] = useState<Sender[]>([]);
  const [slackStatus, setSlackStatus] = useState<SlackStatus | null>(null);

  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isComposeOpen, setIsComposeOpen] = useState<boolean>(false);
  const [isSlackModalOpen, setIsSlackModalOpen] = useState<boolean>(false);

  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchSource, setSearchSource] = useState<string | undefined>(undefined);

  
  useEffect(() => {
    const token = localStorage.getItem('reachinbox_token');
    if (token) {
      api
        .getCurrentUser()
        .then((res) => setUser(res.user))
        .catch(() => {
          localStorage.removeItem('reachinbox_token');
          setIsLoginModalOpen(true);
        });
    } else {
      setIsLoginModalOpen(true);
    }
  }, []);

  
  const loadData = useCallback(async () => {
    try {
      const [scheduledRes, sentRes, statsRes, sendersRes, slackRes] = await Promise.all([
        api.getScheduledEmails(),
        api.getSentEmails(),
        api.getStats(),
        api.getSenders(),
        api.getSlackStatus(),
      ]);

      setScheduledEmails(scheduledRes.emails || []);
      setSentEmails(sentRes.emails || []);
      setStats(statsRes);
      setSenders(sendersRes.senders || []);
      setSlackStatus(slackRes);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, [loadData]);

  
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchSource(undefined);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await api.searchEmails(searchQuery);
        setSearchSource(res.source);

        const scheduled = (res.emails || []).filter((e) =>
          ['SCHEDULED', 'PROCESSING', 'RATE_LIMITED'].includes(e.status)
        );
        const sent = (res.emails || []).filter((e) => ['SENT', 'FAILED'].includes(e.status));

        setScheduledEmails(scheduled);
        setSentEmails(sent);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handlers
  const handleDemoLogin = async () => {
    const res = await api.demoLogin();
    localStorage.setItem('reachinbox_token', res.token);
    setUser(res.user);
    setIsLoginModalOpen(false);
    loadData();
  };

  const handleGoogleLogin = async (credential: string) => {
    const res = await api.googleLogin(credential);
    localStorage.setItem('reachinbox_token', res.token);
    setUser(res.user);
    setIsLoginModalOpen(false);
    loadData();
  };

  const handleLogout = () => {
    localStorage.removeItem('reachinbox_token');
    setUser(null);
    setIsLoginModalOpen(true);
  };

  const handleCancelEmail = async (id: string) => {
    try {
      await api.cancelEmail(id);
      loadData();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to cancel email');
    }
  };

  const handleScheduleSubmit = async (payload: any) => {
    await api.scheduleEmails(payload);
    loadData();
  };

  const handleSaveSlackWebhook = async (url: string, channel?: string) => {
    await api.saveSlackWebhook(url, channel);
    const updated = await api.getSlackStatus();
    setSlackStatus(updated);
  };

  const handleTestSlackNotification = async () => {
    const res = await api.testSlackNotification();
    return res.message;
  };

  const handleDisconnectSlack = async () => {
    await api.disconnectSlack();
    const updated = await api.getSlackStatus();
    setSlackStatus(updated);
  };

  return (
    <div className="min-h-screen bg-darkBg text-gray-100 flex flex-col font-sans">
      {/* Header */}
      <Header
        user={user}
        slackStatus={slackStatus}
        onOpenSlackModal={() => setIsSlackModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {/* Metric Cards */}
        <StatsCards stats={stats} />

        {/* Tab switcher, search bar, compose button */}
        <DashboardTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          scheduledCount={stats?.scheduledCount ?? scheduledEmails.length}
          sentCount={stats?.sentCount ?? sentEmails.length}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenCompose={() => setIsComposeOpen(true)}
          onRefresh={loadData}
          isSearching={isSearching}
          searchSource={searchSource}
        />

        {/* Tab Content */}
        {activeTab === 'scheduled' ? (
          <ScheduledTable
            emails={scheduledEmails}
            isLoading={isLoading}
            onCancelEmail={handleCancelEmail}
            onOpenCompose={() => setIsComposeOpen(true)}
          />
        ) : (
          <SentTable
            emails={sentEmails}
            isLoading={isLoading}
            onOpenCompose={() => setIsComposeOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-darkBorder py-5 px-6 text-center text-xs text-gray-500 bg-[#090A0F]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>ReachInbox Hiring Assignment — Outbox Labs &copy; 2026</span>
          <div className="flex items-center gap-4 text-gray-400">
            <span>BullMQ 5.8</span>
            <span>·</span>
            <span>Redis 7</span>
            <span>·</span>
            <span>PostgreSQL 16</span>
            <span>·</span>
            <span>Elasticsearch 8</span>
            <span>·</span>
            <span>Ethereal SMTP</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ComposeModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        senders={senders}
        onSubmit={handleScheduleSubmit}
        onSuccess={loadData}
      />

      <SlackModal
        isOpen={isSlackModalOpen}
        onClose={() => setIsSlackModalOpen(false)}
        slackStatus={slackStatus}
        onSaveWebhook={handleSaveSlackWebhook}
        onTestNotification={handleTestSlackNotification}
        onDisconnect={handleDisconnectSlack}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onDemoLogin={handleDemoLogin}
        onGoogleLogin={handleGoogleLogin}
      />
    </div>
  );
};

export default App;
