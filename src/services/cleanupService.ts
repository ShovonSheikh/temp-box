interface CleanupLog {
  accountId: string;
  deletedAt: Date;
  reason: string;
  success: boolean;
  error?: string;
}

interface CleanupStats {
  totalProcessed: number;
  successfulDeletions: number;
  failedDeletions: number;
  lastRunAt: Date;
}

class CleanupService {
  private static readonly CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour in milliseconds
  private static readonly MAX_RETENTION_DAYS = 7; // Maximum retention period
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.startCleanupScheduler();
  }

  /**
   * Start the automated cleanup scheduler
   */
  startCleanupScheduler(): void {
    // Run cleanup immediately on start
    this.runCleanup();

    // Schedule recurring cleanup
    this.cleanupTimer = setInterval(() => {
      this.runCleanup();
    }, CleanupService.CLEANUP_INTERVAL);

    console.log('🧹 Cleanup scheduler started - runs every hour');
  }

  /**
   * Stop the cleanup scheduler
   */
  stopCleanupScheduler(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
      console.log('🧹 Cleanup scheduler stopped');
    }
  }

  /**
   * Run the cleanup process
   */
  async runCleanup(): Promise<CleanupStats> {
    console.log('🧹 Starting cleanup process...');
    
    const stats: CleanupStats = {
      totalProcessed: 0,
      successfulDeletions: 0,
      failedDeletions: 0,
      lastRunAt: new Date(),
    };

    try {
      // Get all stored inbox states from localStorage
      const expiredInboxes = this.findExpiredInboxes();
      stats.totalProcessed = expiredInboxes.length;

      if (expiredInboxes.length === 0) {
        console.log('🧹 No expired inboxes found');
        this.updateCleanupStats(stats);
        return stats;
      }

      console.log(`🧹 Found ${expiredInboxes.length} expired inbox(es) to clean up`);

      // Process each expired inbox
      for (const inbox of expiredInboxes) {
        try {
          await this.cleanupExpiredInbox(inbox);
          stats.successfulDeletions++;
        } catch (error) {
          console.error(`❌ Failed to cleanup inbox ${inbox.accountId}:`, error);
          stats.failedDeletions++;
          
          // Log the failure
          this.logCleanupAttempt({
            accountId: inbox.accountId,
            deletedAt: new Date(),
            reason: 'scheduled_cleanup',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      console.log(`🧹 Cleanup completed: ${stats.successfulDeletions} successful, ${stats.failedDeletions} failed`);
      
    } catch (error) {
      console.error('❌ Cleanup process failed:', error);
    }

    this.updateCleanupStats(stats);
    return stats;
  }

  /**
   * Find expired inboxes that need cleanup
   */
  private findExpiredInboxes(): Array<{ accountId: string; expiresAt: Date; address: string }> {
    const expiredInboxes: Array<{ accountId: string; expiresAt: Date; address: string }> = [];
    const now = new Date();
    const maxRetentionDate = new Date(now.getTime() - (CleanupService.MAX_RETENTION_DAYS * 24 * 60 * 60 * 1000));

    // Check current inbox state
    const currentInboxState = localStorage.getItem('inbox-state');
    if (currentInboxState) {
      try {
        const parsed = JSON.parse(currentInboxState);
        if (parsed.account && parsed.expiresAt) {
          const expiresAt = new Date(parsed.expiresAt);
          if (expiresAt <= now || expiresAt <= maxRetentionDate) {
            expiredInboxes.push({
              accountId: parsed.account.id,
              expiresAt,
              address: parsed.account.address,
            });
          }
        }
      } catch (error) {
        console.error('❌ Failed to parse current inbox state:', error);
      }
    }

    // Check for any other stored inbox data (for future multi-inbox support)
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('inbox-backup-')) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const parsed = JSON.parse(data);
            if (parsed.account && parsed.expiresAt) {
              const expiresAt = new Date(parsed.expiresAt);
              if (expiresAt <= now || expiresAt <= maxRetentionDate) {
                expiredInboxes.push({
                  accountId: parsed.account.id,
                  expiresAt,
                  address: parsed.account.address,
                });
              }
            }
          }
        } catch (error) {
          console.error(`❌ Failed to parse backup inbox data for key ${key}:`, error);
        }
      }
    }

    return expiredInboxes;
  }

  /**
   * Clean up a specific expired inbox
   */
  private async cleanupExpiredInbox(inbox: { accountId: string; expiresAt: Date; address: string }): Promise<void> {
    console.log(`🧹 Cleaning up expired inbox: ${inbox.address} (${inbox.accountId})`);

    const cleanupLog: CleanupLog = {
      accountId: inbox.accountId,
      deletedAt: new Date(),
      reason: 'scheduled_cleanup',
      success: false,
    };

    try {
      // Import mailApi dynamically to avoid circular dependencies
      const { mailApi } = await import('./mailApi');
      
      // Attempt to delete from mail.tm API
      await mailApi.deleteAccount(inbox.accountId);
      cleanupLog.success = true;
      
      console.log(`✅ Successfully deleted inbox ${inbox.address} from mail.tm`);
      
    } catch (error) {
      cleanupLog.success = false;
      cleanupLog.error = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Failed to delete inbox ${inbox.address} from mail.tm:`, error);
    }

    // Clean up local storage regardless of API success
    this.cleanupLocalStorage(inbox.accountId);
    
    // Log the cleanup attempt
    this.logCleanupAttempt(cleanupLog);
  }

  /**
   * Clean up local storage for an inbox
   */
  private cleanupLocalStorage(accountId: string): void {
    // Remove current inbox state if it matches
    const currentState = localStorage.getItem('inbox-state');
    if (currentState) {
      try {
        const parsed = JSON.parse(currentState);
        if (parsed.account && parsed.account.id === accountId) {
          localStorage.removeItem('inbox-state');
          localStorage.removeItem('last-message-check');
          console.log(`🧹 Removed current inbox state for ${accountId}`);
        }
      } catch (error) {
        console.error('❌ Failed to parse current inbox state during cleanup:', error);
      }
    }

    // Remove any backup data
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith('inbox-backup-')) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const parsed = JSON.parse(data);
            if (parsed.account && parsed.account.id === accountId) {
              localStorage.removeItem(key);
              console.log(`🧹 Removed backup data: ${key}`);
            }
          }
        } catch (error) {
          console.error(`❌ Failed to parse backup data for key ${key}:`, error);
        }
      }
    }
  }

  /**
   * Log a cleanup attempt
   */
  private logCleanupAttempt(log: CleanupLog): void {
    try {
      const existingLogs = JSON.parse(localStorage.getItem('cleanup-logs') || '[]');
      existingLogs.push({
        ...log,
        deletedAt: log.deletedAt.toISOString(), // Serialize date
      });
      
      // Keep only the last 100 logs
      if (existingLogs.length > 100) {
        existingLogs.splice(0, existingLogs.length - 100);
      }
      
      localStorage.setItem('cleanup-logs', JSON.stringify(existingLogs));
    } catch (error) {
      console.error('❌ Failed to log cleanup attempt:', error);
    }
  }

  /**
   * Update cleanup statistics
   */
  private updateCleanupStats(stats: CleanupStats): void {
    try {
      const statsToStore = {
        ...stats,
        lastRunAt: stats.lastRunAt.toISOString(), // Serialize date
      };
      localStorage.setItem('cleanup-stats', JSON.stringify(statsToStore));
    } catch (error) {
      console.error('❌ Failed to update cleanup stats:', error);
    }
  }

  /**
   * Get cleanup statistics
   */
  getCleanupStats(): CleanupStats | null {
    try {
      const stats = localStorage.getItem('cleanup-stats');
      if (stats) {
        const parsed = JSON.parse(stats);
        return {
          ...parsed,
          lastRunAt: new Date(parsed.lastRunAt), // Deserialize date
        };
      }
    } catch (error) {
      console.error('❌ Failed to get cleanup stats:', error);
    }
    return null;
  }

  /**
   * Get cleanup logs
   */
  getCleanupLogs(): CleanupLog[] {
    try {
      const logs = localStorage.getItem('cleanup-logs');
      if (logs) {
        const parsed = JSON.parse(logs);
        return parsed.map((log: any) => ({
          ...log,
          deletedAt: new Date(log.deletedAt), // Deserialize date
        }));
      }
    } catch (error) {
      console.error('❌ Failed to get cleanup logs:', error);
    }
    return [];
  }

  /**
   * Manual cleanup trigger
   */
  async triggerManualCleanup(): Promise<CleanupStats> {
    console.log('🧹 Manual cleanup triggered');
    return this.runCleanup();
  }

  /**
   * Check if an inbox should show expiration warning
   */
  shouldShowExpirationWarning(expiresAt: Date): boolean {
    const now = new Date();
    const timeRemaining = expiresAt.getTime() - now.getTime();
    const thirtyMinutes = 30 * 60 * 1000; // 30 minutes in milliseconds
    
    return timeRemaining <= thirtyMinutes && timeRemaining > 0;
  }

  /**
   * Get time remaining until expiration
   */
  getTimeRemaining(expiresAt: Date): number {
    const now = new Date();
    return Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
  }
}

// Create and export a singleton instance
export const cleanupService = new CleanupService();

// Export types for use in other modules
export type { CleanupLog, CleanupStats };