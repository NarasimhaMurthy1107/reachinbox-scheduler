import React from 'react';
import { Search, Plus, Clock, CheckCircle2, RefreshCw } from 'lucide-react';

interface DashboardTabsProps {
  activeTab: 'scheduled' | 'sent';
  onTabChange: (tab: 'scheduled' | 'sent') => void;
  scheduledCount: number;
  sentCount: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenCompose: () => void;
  onRefresh: () => void;
  isSearching: boolean;
  searchSource?: string;
}

export const DashboardTabs: React.FC<DashboardTabsProps> = ({
  activeTab,
  onTabChange,
  scheduledCount,
  sentCount,
  searchQuery,
  onSearchChange,
  onOpenCompose,
  onRefresh,
  isSearching,
  searchSource,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-darkBorder">
      {/* Tabs */}
      <div className="flex items-center gap-2 bg-darkSurface p-1 rounded-xl border border-darkBorder">
        <button
          onClick={() => onTabChange('scheduled')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'scheduled'
              ? 'bg-darkCard text-white shadow-sm border border-darkBorder'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>Scheduled Emails</span>
          <span className="px-2 py-0.5 text-[10px] rounded-full bg-amber-400/10 text-amber-300 font-bold">
            {scheduledCount}
          </span>
        </button>

        <button
          onClick={() => onTabChange('sent')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'sent'
              ? 'bg-darkCard text-white shadow-sm border border-darkBorder'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Sent Emails</span>
          <span className="px-2 py-0.5 text-[10px] rounded-full bg-emerald-400/10 text-emerald-300 font-bold">
            {sentCount}
          </span>
        </button>
      </div>

      {/* Search and Compose Button */}
      <div className="flex items-center gap-3">
        {/* Elasticsearch Search Bar */}
        <div className="relative flex-1 sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className={`w-4 h-4 ${isSearching ? 'text-indigo-400 animate-spin' : 'text-gray-400'}`} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search emails via Elasticsearch..."
            className="w-full pl-9 pr-20 py-2 bg-darkSurface border border-darkBorder rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
          {searchSource && (
            <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {searchSource}
              </span>
            </div>
          )}
        </div>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          className="p-2 bg-darkSurface border border-darkBorder rounded-xl text-gray-400 hover:text-white hover:border-zinc-700 transition-colors"
          title="Refresh Data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* Compose Button */}
        <button
          onClick={onOpenCompose}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/25 transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Compose New Email</span>
        </button>
      </div>
    </div>
  );
};
