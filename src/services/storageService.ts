import { MailAccount } from '../types/api';

export interface StoredAccount {
  id: string;
  address: string;
  password: string;
  token: string;
  createdAt: Date;
  expiresAt: Date;
  deleted: boolean;
  lastAccessedAt: Date;
  messageCount: number;
  cleanupAttempts: number;
}

export interface AuditLogEntry {
  id: string;
  accountId: string;
  action: 'CREATED' | 'ACCESSED' | 'EXPIRED' | 'DELETED' | 'CLEANUP_ATTEMPTED' | 'CLEANUP_FAILED';
  timestamp: Date;
  details?: string;
}

export interface CleanupStats {
  totalAccounts: number;
  expiredAccounts: number;
  deletedAccounts: number;
  failedDeletions: number;
  lastCleanupRun: Date;
}

class StorageService {
  private readonly ACCOUNTS_KEY = 'tempbox-accounts';
  private readonly AUDIT_LOG_KEY = 'tempbox-audit-log';
  private readonly CLEANUP_STATS_KEY = 'tempbox-cleanup-stats';
  private readonly MAX_AUDIT_ENTRIES = 1000;
  private readonly MAX_ACCOUNTS_STORED = 50;

  /**
   * Store account data with enhanced metadata
   */
  storeAccount(account: MailAccount, password: string, token: string, expiresAt: Date): StoredAccount {
    const storedAccount: StoredAccount = {
      id: account.id,
      address: account.address,
      password,
      token,
      createdAt: new Date(),
      expiresAt,
      deleted: false,
      lastAccessedAt: new Date(),
      messageCount: 0,
      cleanupAttempts: 0,
    };

    const accounts = this.getStoredAccounts();
    
    // Remove any existing account with same ID
    const filteredAccounts = accounts.filter(a => a.id !== account.id);
    
    // Add new account
    filteredAccounts.push(storedAccount);
    
    // Keep only the most recent accounts to prevent storage bloat
    const sortedAccounts = filteredAccounts
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, this.MAX_ACCOUNTS_STORED);
    
    this.saveAccounts(sortedAccounts);
    this.addAuditLogEntry(account.id, 'CREATED', `Account created: ${account.address}`);
    
    return storedAccount;
  }

  /**
   * Update account with last accessed timestamp and message count
   */
  updateAccountAccess(accountId: string, messageCount: number): void {
    const accounts = this.getStoredAccounts();
    const accountIndex = accounts.findIndex(a => a.id === accountId);
    
    if (accountIndex !== -1) {
      accounts[accountIndex].lastAccessedAt = new Date();
      accounts[accountIndex].messageCount = messageCount;
      this.saveAccounts(accounts);
      this.addAuditLogEntry(accountId, 'ACCESSED');
    }
  }

  /**
   * Mark account as deleted
   */
  markAccountDeleted(accountId: string): void {
    const accounts = this.getStoredAccounts();
    const accountIndex = accounts.findIndex(a => a.id === accountId);
    
    if (accountIndex !== -1) {
      accounts[accountIndex].deleted = true;
      this.saveAccounts(accounts);
      this.addAuditLogEntry(accountId, 'DELETED', 'Account marked as deleted');
    }
  }

  /**
   * Get stored account by ID
   */
  getStoredAccount(accountId: string): StoredAccount | null {
    const accounts = this.getStoredAccounts();
    return accounts.find(a => a.id === accountId) || null;
  }

  /**
   * Get all stored accounts
   */
  getStoredAccounts(): StoredAccount[] {
    try {
      const stored = localStorage.getItem(this.ACCOUNTS_KEY);
      if (!stored) return [];
      
      const accounts = JSON.parse(stored);
      return accounts.map((account: any) => ({
        ...account,
        createdAt: new Date(account.createdAt),
        expiresAt: new Date(account.expiresAt),
        lastAccessedAt: new Date(account.lastAccessedAt),
      }));
    } catch (error) {
      console.error('Failed to parse stored accounts:', error);
      return [];
    }
  }

  /**
   * Get expired accounts that haven't been deleted
   */
  getExpiredAccounts(): StoredAccount[] {
    const accounts = this.getStoredAccounts();
    const now = new Date();
    
    return accounts.filter(account => 
      !account.deleted && 
      account.expiresAt < now
    );
  }

  /**
   * Add audit log entry
   */
  addAuditLogEntry(accountId: string, action: AuditLogEntry['action'], details?: string): void {
    try {
      const auditLog = this.getAuditLog();
      const entry: AuditLogEntry = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        accountId,
        action,
        timestamp: new Date(),
        details,
      };
      
      auditLog.push(entry);
      
      // Keep only the most recent entries
      const trimmedLog = auditLog
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, this.MAX_AUDIT_ENTRIES);
      
      localStorage.setItem(this.AUDIT_LOG_KEY, JSON.stringify(trimmedLog));
    } catch (error) {
      console.error('Failed to add audit log entry:', error);
    }
  }

  /**
   * Get audit log
   */
  getAuditLog(): AuditLogEntry[] {
    try {
      const stored = localStorage.getItem(this.AUDIT_LOG_KEY);
      if (!stored) return [];
      
      const entries = JSON.parse(stored);
      return entries.map((entry: any) => ({
        ...entry,
        timestamp: new Date(entry.timestamp),
      }));
    } catch (error) {
      console.error('Failed to parse audit log:', error);
      return [];
    }
  }

  /**
   * Increment cleanup attempt counter for an account
   */
  incrementCleanupAttempts(accountId: string): void {
    const accounts = this.getStoredAccounts();
    const accountIndex = accounts.findIndex(a => a.id === accountId);
    
    if (accountIndex !== -1) {
      accounts[accountIndex].cleanupAttempts++;
      this.saveAccounts(accounts);
      this.addAuditLogEntry(accountId, 'CLEANUP_ATTEMPTED');
    }
  }

  /**
   * Record cleanup failure
   */
  recordCleanupFailure(accountId: string, error: string): void {
    this.addAuditLogEntry(accountId, 'CLEANUP_FAILED', error);
  }

  /**
   * Get cleanup statistics
   */
  getCleanupStats(): CleanupStats {
    try {
      const stored = localStorage.getItem(this.CLEANUP_STATS_KEY);
      if (!stored) {
        return this.calculateCleanupStats();
      }
      
      const stats = JSON.parse(stored);
      return {
        ...stats,
        lastCleanupRun: new Date(stats.lastCleanupRun),
      };
    } catch (error) {
      console.error('Failed to parse cleanup stats:', error);
      return this.calculateCleanupStats();
    }
  }

  /**
   * Update cleanup statistics
   */
  updateCleanupStats(): void {
    const stats = this.calculateCleanupStats();
    localStorage.setItem(this.CLEANUP_STATS_KEY, JSON.stringify(stats));
  }

  /**
   * Calculate current cleanup statistics
   */
  private calculateCleanupStats(): CleanupStats {
    const accounts = this.getStoredAccounts();
    const now = new Date();
    
    const expiredAccounts = accounts.filter(a => a.expiresAt < now);
    const deletedAccounts = accounts.filter(a => a.deleted);
    const failedDeletions = accounts.filter(a => a.cleanupAttempts > 0 && !a.deleted);
    
    return {
      totalAccounts: accounts.length,
      expiredAccounts: expiredAccounts.length,
      deletedAccounts: deletedAccounts.length,
      failedDeletions: failedDeletions.length,
      lastCleanupRun: new Date(),
    };
  }

  /**
   * Clean up old data (remove very old entries)
   */
  cleanupOldData(): void {
    const accounts = this.getStoredAccounts();
    const auditLog = this.getAuditLog();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Remove accounts older than 30 days
    const recentAccounts = accounts.filter(account => 
      account.createdAt > thirtyDaysAgo
    );
    
    // Remove audit log entries older than 30 days
    const recentAuditEntries = auditLog.filter(entry =>
      entry.timestamp > thirtyDaysAgo
    );
    
    this.saveAccounts(recentAccounts);
    localStorage.setItem(this.AUDIT_LOG_KEY, JSON.stringify(recentAuditEntries));
    
    console.log(`🧹 Cleaned up old data - Removed ${accounts.length - recentAccounts.length} accounts and ${auditLog.length - recentAuditEntries.length} audit entries`);
  }

  /**
   * Get warning threshold info for expiring accounts
   */
  getExpirationWarnings(): { critical: StoredAccount[]; warning: StoredAccount[] } {
    const accounts = this.getStoredAccounts();
    const now = new Date();
    const oneHour = 60 * 60 * 1000;
    const thirtyMinutes = 30 * 60 * 1000;
    
    const critical = accounts.filter(account => {
      const timeLeft = account.expiresAt.getTime() - now.getTime();
      return !account.deleted && timeLeft > 0 && timeLeft <= thirtyMinutes;
    });
    
    const warning = accounts.filter(account => {
      const timeLeft = account.expiresAt.getTime() - now.getTime();
      return !account.deleted && timeLeft > thirtyMinutes && timeLeft <= oneHour;
    });
    
    return { critical, warning };
  }

  /**
   * Clear all stored data (for debugging or reset)
   */
  clearAllData(): void {
    localStorage.removeItem(this.ACCOUNTS_KEY);
    localStorage.removeItem(this.AUDIT_LOG_KEY);
    localStorage.removeItem(this.CLEANUP_STATS_KEY);
    localStorage.removeItem('inbox-state'); // Legacy cleanup
    console.log('🗑️ All TempBox data cleared');
  }

  private saveAccounts(accounts: StoredAccount[]): void {
    localStorage.setItem(this.ACCOUNTS_KEY, JSON.stringify(accounts));
  }
}

export const storageService = new StorageService();
