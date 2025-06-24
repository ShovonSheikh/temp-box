import React, { useState, useEffect } from 'react';
import { Trash2, Clock, CheckCircle, XCircle, RefreshCw, BarChart3 } from 'lucide-react';
import { cleanupService, CleanupStats, CleanupLog } from '../services/cleanupService';

interface CleanupStatusProps {
  className?: string;
}

export function CleanupStatus({ className = '' }: CleanupStatusProps) {
  const [stats, setStats] = useState<CleanupStats | null>(null);
  const [logs, setLogs] = useState<CleanupLog[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setStats(cleanupService.getCleanupStats());
    setLogs(cleanupService.getCleanupLogs().slice(-10)); // Show last 10 logs
  };

  const handleManualCleanup = async () => {
    setIsRunning(true);
    try {
      const newStats = await cleanupService.triggerManualCleanup();
      setStats(newStats);
      loadData(); // Reload all data
    } catch (error) {
      console.error('Manual cleanup failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className={`inline-flex items-center space-x-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 ${className}`}
        title="View cleanup status"
      >
        <BarChart3 className="w-4 h-4" />
        <span>Cleanup Status</span>
      </button>
    );
  }

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200/50 dark:border-slate-700/50 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl text-white">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-slate-800 dark:text-slate-200">
              Cleanup Service
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Automated inbox cleanup and monitoring
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleManualCleanup}
            disabled={isRunning}
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 disabled:opacity-50"
            title="Run manual cleanup"
          >
            <RefreshCw className={`w-5 h-5 ${isRunning ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsExpanded(false)}
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50"
            title="Collapse"
          >
            ×
          </button>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-4">
            <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">
              {stats.totalProcessed}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Total Processed
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">
              {stats.successfulDeletions}
            </div>
            <div className="text-sm text-green-600 dark:text-green-400">
              Successful
            </div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
            <div className="text-2xl font-bold text-red-700 dark:text-red-300">
              {stats.failedDeletions}
            </div>
            <div className="text-sm text-red-600 dark:text-red-400">
              Failed
            </div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
            <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Last Run
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-400">
              {formatTimeAgo(stats.lastRunAt)}
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div>
        <h4 className="font-medium text-slate-800 dark:text-slate-200 mb-3 flex items-center">
          <Clock className="w-4 h-4 mr-2" />
          Recent Activity
        </h4>
        
        {logs.length === 0 ? (
          <div className="text-center py-6 text-slate-500 dark:text-slate-400">
            No cleanup activity yet
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {logs.map((log, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {log.success ? (
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  )}
                  <div>
                    <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      Account: {log.accountId.substring(0, 8)}...
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      {log.reason.replace('_', ' ')} • {formatTimeAgo(log.deletedAt)}
                    </div>
                    {log.error && (
                      <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                        Error: {log.error}
                      </div>
                    )}
                  </div>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  log.success
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                }`}>
                  {log.success ? 'Success' : 'Failed'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Refresh Data Button */}
      <div className="mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
        <button
          onClick={loadData}
          className="w-full px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50"
        >
          Refresh Data
        </button>
      </div>
    </div>
  );
}