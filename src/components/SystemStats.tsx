import React, { useState, useEffect } from 'react';
import {
  Activity,
  Database,
  Trash2,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  Settings,
  Info
} from 'lucide-react';
import { cleanupService } from '../services/cleanupService';
import { storageService, CleanupStats, AuditLogEntry } from '../services/storageService';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

interface SystemStatsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SystemStats({ isOpen, onClose }: SystemStatsProps) {
  const [stats, setStats] = useState<CleanupStats | null>(null);
  const [cleanupStatus, setCleanupStatus] = useState<any>(null);
  const [recentAuditEntries, setRecentAuditEntries] = useState<AuditLogEntry[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'audit' | 'settings'>('overview');

  useEffect(() => {
    if (isOpen) {
      refreshData();
      // Refresh data every 30 seconds while modal is open
      const interval = setInterval(refreshData, 30000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      const currentStats = storageService.getCleanupStats();
      const currentStatus = cleanupService.getCleanupStatus();
      const auditLog = storageService.getAuditLog();
      
      setStats(currentStats);
      setCleanupStatus(currentStatus);
      setRecentAuditEntries(auditLog.slice(0, 20)); // Show last 20 entries
    } catch (error) {
      console.error('Failed to refresh stats:', error);
      toast.error('Failed to refresh statistics');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRunCleanup = async () => {
    try {
      toast.loading('Running cleanup cycle...', { id: 'cleanup' });
      const result = await cleanupService.runCleanupCycle();
      
      if (result.failed === 0) {
        toast.success(`Cleanup completed: ${result.successful} accounts processed`, { id: 'cleanup' });
      } else {
        toast.error(`Cleanup completed with errors: ${result.successful} success, ${result.failed} failed`, { id: 'cleanup' });
      }
      
      refreshData();
    } catch (error) {
      toast.error('Failed to run cleanup cycle', { id: 'cleanup' });
    }
  };

  const handleStartAutomatedCleanup = () => {
    cleanupService.startAutomatedCleanup();
    toast.success('Automated cleanup started');
    refreshData();
  };

  const handleStopAutomatedCleanup = () => {
    cleanupService.stopAutomatedCleanup();
    toast.success('Automated cleanup stopped');
    refreshData();
  };

  const handleClearAllData = () => {
    if (confirm('Are you sure you want to clear all stored data? This action cannot be undone.')) {
      storageService.clearAllData();
      toast.success('All data cleared');
      refreshData();
    }
  };

  const getActionIcon = (action: AuditLogEntry['action']) => {
    switch (action) {
      case 'CREATED':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'ACCESSED':
        return <Activity className="w-4 h-4 text-blue-500" />;
      case 'EXPIRED':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'DELETED':
        return <Trash2 className="w-4 h-4 text-red-500" />;
      case 'CLEANUP_ATTEMPTED':
        return <RotateCcw className="w-4 h-4 text-orange-500" />;
      case 'CLEANUP_FAILED':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl border border-slate-200/50 dark:border-slate-700/50">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl text-white">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold text-slate-800 dark:text-slate-200">
                System Statistics
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                TempBox cleanup and audit information
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={refreshData}
              disabled={isRefreshing}
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50"
              title="Refresh data"
            >
              <RotateCcw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200/50 dark:border-slate-700/50">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'audit', label: 'Audit Log', icon: Database },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === id
                  ? 'text-violet-600 dark:text-violet-400 border-b-2 border-violet-600 dark:border-violet-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Cleanup Status */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-display text-lg font-bold text-slate-800 dark:text-slate-200">
                      Cleanup Service
                    </h4>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      cleanupStatus?.isAutomated
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-200'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-200'
                    }`}>
                      {cleanupStatus?.isAutomated ? 'Active' : 'Stopped'}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Status:</span>
                      <span className="font-medium">
                        {cleanupStatus?.isRunning ? 'Running' : 'Idle'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Expired Accounts:</span>
                      <span className="font-medium text-red-600 dark:text-red-400">
                        {cleanupStatus?.expiredAccountsCount || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Warning (30-60 min):</span>
                      <span className="font-medium text-yellow-600 dark:text-yellow-400">
                        {cleanupStatus?.warningAccountsCount || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Critical (&lt;30 min):</span>
                      <span className="font-medium text-red-600 dark:text-red-400">
                        {cleanupStatus?.criticalAccountsCount || 0}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600 space-y-2">
                    <button
                      onClick={handleRunCleanup}
                      disabled={cleanupStatus?.isRunning}
                      className="w-full bg-violet-600 text-white px-4 py-2 rounded-xl hover:bg-violet-700 transition-colors disabled:opacity-50"
                    >
                      Run Cleanup Now
                    </button>
                    {cleanupStatus?.isAutomated ? (
                      <button
                        onClick={handleStopAutomatedCleanup}
                        className="w-full bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 transition-colors"
                      >
                        Stop Automated Cleanup
                      </button>
                    ) : (
                      <button
                        onClick={handleStartAutomatedCleanup}
                        className="w-full bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition-colors"
                      >
                        Start Automated Cleanup
                      </button>
                    )}
                  </div>
                </div>

                {/* Statistics */}
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-6">
                  <h4 className="font-display text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">
                    Statistics
                  </h4>
                  {stats && (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Total Accounts:</span>
                        <span className="font-medium">{stats.totalAccounts}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Expired Accounts:</span>
                        <span className="font-medium text-yellow-600 dark:text-yellow-400">
                          {stats.expiredAccounts}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Deleted Accounts:</span>
                        <span className="font-medium text-green-600 dark:text-green-400">
                          {stats.deletedAccounts}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Failed Deletions:</span>
                        <span className="font-medium text-red-600 dark:text-red-400">
                          {stats.failedDeletions}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Last Cleanup:</span>
                        <span className="font-medium text-sm">
                          {formatDistanceToNow(stats.lastCleanupRun, { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-display text-lg font-bold text-slate-800 dark:text-slate-200">
                  Recent Activity
                </h4>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Last {recentAuditEntries.length} entries
                </span>
              </div>
              
              <div className="space-y-2">
                {recentAuditEntries.length === 0 ? (
                  <div className="text-center py-8">
                    <Database className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-slate-600 dark:text-slate-400">No audit entries found</p>
                  </div>
                ) : (
                  recentAuditEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-start space-x-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl"
                    >
                      <div className="mt-0.5">
                        {getActionIcon(entry.action)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                            {entry.action.replace('_', ' ')}
                          </p>
                          <time className="text-xs text-slate-500 dark:text-slate-500">
                            {formatDistanceToNow(entry.timestamp, { addSuffix: true })}
                          </time>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                          Account: {entry.accountId}
                        </p>
                        {entry.details && (
                          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                            {entry.details}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-6">
                <h4 className="font-display text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">
                  Data Management
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl">
                    <div>
                      <h5 className="font-medium text-slate-800 dark:text-slate-200">
                        Clear All Data
                      </h5>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Remove all stored accounts and audit logs
                      </p>
                    </div>
                    <button
                      onClick={handleClearAllData}
                      className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl">
                    <div>
                      <h5 className="font-medium text-slate-800 dark:text-slate-200">
                        Check Warnings
                      </h5>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Show expiration warnings for current accounts
                      </p>
                    </div>
                    <button
                      onClick={() => cleanupService.checkAndShowWarnings()}
                      className="bg-yellow-600 text-white px-4 py-2 rounded-xl hover:bg-yellow-700 transition-colors"
                    >
                      Check Now
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-6">
                <h4 className="font-display text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">
                  System Information
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Version:</span>
                    <span className="font-medium">2.0.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Storage:</span>
                    <span className="font-medium">LocalStorage</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Max Accounts:</span>
                    <span className="font-medium">50</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Max Audit Entries:</span>
                    <span className="font-medium">1000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Cleanup Interval:</span>
                    <span className="font-medium">60 minutes</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
