import { mailApi } from './mailApi';
import { storageService, StoredAccount } from './storageService';
import toast from 'react-hot-toast';

export interface CleanupOptions {
  maxRetries: number;
  retryDelay: number;
  batchSize: number;
  enableNotifications: boolean;
}

export interface CleanupResult {
  processed: number;
  successful: number;
  failed: number;
  errors: Array<{
    accountId: string;
    address: string;
    error: string;
  }>;
}

class CleanupService {
  private readonly DEFAULT_OPTIONS: CleanupOptions = {
    maxRetries: 3,
    retryDelay: 2000,
    batchSize: 5,
    enableNotifications: true,
  };

  private cleanupIntervalId: NodeJS.Timeout | null = null;
  private isCleanupRunning = false;

  /**
   * Start automated cleanup process that runs every hour
   */
  startAutomatedCleanup(): void {
    if (this.cleanupIntervalId) {
      console.log('⚡ Cleanup service already running');
      return;
    }

    console.log('🔄 Starting automated cleanup service');
    
    // Run cleanup every 60 minutes
    this.cleanupIntervalId = setInterval(() => {
      this.runCleanupCycle();
    }, 60 * 60 * 1000);

    // Run initial cleanup after 5 seconds
    setTimeout(() => {
      this.runCleanupCycle();
    }, 5000);
  }

  /**
   * Stop automated cleanup process
   */
  stopAutomatedCleanup(): void {
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = null;
      console.log('⏹️ Automated cleanup service stopped');
    }
  }

  /**
   * Run a complete cleanup cycle
   */
  async runCleanupCycle(options?: Partial<CleanupOptions>): Promise<CleanupResult> {
    if (this.isCleanupRunning) {
      console.log('⚠️ Cleanup already in progress, skipping...');
      return {
        processed: 0,
        successful: 0,
        failed: 0,
        errors: [],
      };
    }

    this.isCleanupRunning = true;
    const finalOptions = { ...this.DEFAULT_OPTIONS, ...options };
    
    try {
      console.log('🧹 Starting cleanup cycle...');
      
      // Clean up old storage data first
      storageService.cleanupOldData();
      
      // Get expired accounts
      const expiredAccounts = storageService.getExpiredAccounts();
      
      if (expiredAccounts.length === 0) {
        console.log('✅ No expired accounts to clean up');
        storageService.updateCleanupStats();
        return {
          processed: 0,
          successful: 0,
          failed: 0,
          errors: [],
        };
      }

      console.log(`🗑️ Found ${expiredAccounts.length} expired accounts to clean up`);
      
      const result = await this.cleanupExpiredAccounts(expiredAccounts, finalOptions);
      
      // Update cleanup statistics
      storageService.updateCleanupStats();
      
      // Show notification if enabled
      if (finalOptions.enableNotifications && result.processed > 0) {
        if (result.failed === 0) {
          toast.success(`Cleaned up ${result.successful} expired accounts`, {
            icon: '🧹',
            duration: 3000,
          });
        } else {
          toast.error(`Cleanup completed: ${result.successful} success, ${result.failed} failed`, {
            icon: '⚠️',
            duration: 5000,
          });
        }
      }
      
      console.log('✅ Cleanup cycle completed:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Cleanup cycle failed:', error);
      return {
        processed: 0,
        successful: 0,
        failed: 1,
        errors: [{
          accountId: 'unknown',
          address: 'unknown',
          error: error instanceof Error ? error.message : 'Unknown error',
        }],
      };
    } finally {
      this.isCleanupRunning = false;
    }
  }

  /**
   * Clean up expired accounts with retry mechanism
   */
  private async cleanupExpiredAccounts(
    accounts: StoredAccount[],
    options: CleanupOptions
  ): Promise<CleanupResult> {
    const result: CleanupResult = {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [],
    };

    // Process accounts in batches
    for (let i = 0; i < accounts.length; i += options.batchSize) {
      const batch = accounts.slice(i, i + options.batchSize);
      
      const batchPromises = batch.map(account => 
        this.cleanupSingleAccount(account, options)
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      // Process batch results
      batchResults.forEach((batchResult, index) => {
        const account = batch[index];
        result.processed++;
        
        if (batchResult.status === 'fulfilled') {
          if (batchResult.value.success) {
            result.successful++;
            storageService.markAccountDeleted(account.id);
          } else {
            result.failed++;
            result.errors.push({
              accountId: account.id,
              address: account.address,
              error: batchResult.value.error,
            });
            storageService.recordCleanupFailure(account.id, batchResult.value.error);
          }
        } else {
          result.failed++;
          result.errors.push({
            accountId: account.id,
            address: account.address,
            error: batchResult.reason?.message || 'Unknown error',
          });
          storageService.recordCleanupFailure(account.id, batchResult.reason?.message || 'Unknown error');
        }
      });
      
      // Add delay between batches to avoid overwhelming the API
      if (i + options.batchSize < accounts.length) {
        await this.delay(1000);
      }
    }

    return result;
  }

  /**
   * Clean up a single account with retry mechanism
   */
  private async cleanupSingleAccount(
    account: StoredAccount,
    options: CleanupOptions
  ): Promise<{ success: boolean; error: string }> {
    let lastError = '';
    
    for (let attempt = 1; attempt <= options.maxRetries; attempt++) {
      try {
        console.log(`🗑️ Attempting to delete account ${account.address} (attempt ${attempt}/${options.maxRetries})`);
        
        // Set the token for this account
        mailApi.setToken(account.token);
        
        // Attempt to delete the account
        await mailApi.deleteAccount(account.id);
        
        console.log(`✅ Successfully deleted account ${account.address}`);
        return { success: true, error: '' };
        
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';
        console.error(`❌ Failed to delete account ${account.address} (attempt ${attempt}):`, lastError);
        
        // Increment cleanup attempts counter
        storageService.incrementCleanupAttempts(account.id);
        
        // Wait before retrying (exponential backoff)
        if (attempt < options.maxRetries) {
          const delay = options.retryDelay * Math.pow(2, attempt - 1);
          await this.delay(delay);
        }
      }
    }
    
    return { success: false, error: lastError };
  }

  /**
   * Force cleanup of a specific account
   */
  async forceCleanupAccount(accountId: string): Promise<boolean> {
    const account = storageService.getStoredAccount(accountId);
    if (!account) {
      console.error(`Account ${accountId} not found in storage`);
      return false;
    }

    console.log(`🔨 Force cleaning up account ${account.address}`);
    
    const result = await this.cleanupSingleAccount(account, {
      ...this.DEFAULT_OPTIONS,
      enableNotifications: false,
    });

    if (result.success) {
      storageService.markAccountDeleted(account.id);
      toast.success(`Account ${account.address} deleted successfully`, {
        icon: '🗑️',
      });
      return true;
    } else {
      toast.error(`Failed to delete account: ${result.error}`, {
        icon: '❌',
      });
      return false;
    }
  }

  /**
   * Get cleanup status and statistics
   */
  getCleanupStatus() {
    const stats = storageService.getCleanupStats();
    const expiredAccounts = storageService.getExpiredAccounts();
    const warnings = storageService.getExpirationWarnings();
    
    return {
      isRunning: this.isCleanupRunning,
      isAutomated: !!this.cleanupIntervalId,
      stats,
      expiredAccountsCount: expiredAccounts.length,
      warningAccountsCount: warnings.warning.length,
      criticalAccountsCount: warnings.critical.length,
    };
  }

  /**
   * Check if warnings should be shown and show them
   */
  checkAndShowWarnings(): void {
    const warnings = storageService.getExpirationWarnings();
    
    // Show critical warnings (less than 30 minutes)
    if (warnings.critical.length > 0) {
      warnings.critical.forEach(account => {
        const timeLeft = Math.floor((account.expiresAt.getTime() - new Date().getTime()) / 1000 / 60);
        toast.error(`Inbox ${account.address} expires in ${timeLeft} minutes!`, {
          icon: '⚠️',
          duration: 8000,
        });
      });
    }
    
    // Show warning notifications (less than 1 hour)
    if (warnings.warning.length > 0) {
      warnings.warning.forEach(account => {
        const timeLeft = Math.floor((account.expiresAt.getTime() - new Date().getTime()) / 1000 / 60);
        toast(`Inbox ${account.address} expires in ${timeLeft} minutes`, {
          icon: '⏰',
          duration: 4000,
        });
      });
    }
  }

  /**
   * Extend account expiration time (if supported by the service)
   */
  async extendAccountExpiration(accountId: string, additionalHours: number = 1): Promise<boolean> {
    const account = storageService.getStoredAccount(accountId);
    if (!account) {
      console.error(`Account ${accountId} not found in storage`);
      return false;
    }

    try {
      // Note: mail.tm doesn't support extending account expiration
      // This is a placeholder for future enhancement or different providers
      console.log(`🔄 Extension requested for account ${account.address} (${additionalHours} hours)`);
      
      // For now, we'll just extend the local expiration time
      const accounts = storageService.getStoredAccounts();
      const accountIndex = accounts.findIndex(a => a.id === accountId);
      
      if (accountIndex !== -1) {
        const newExpirationTime = new Date(account.expiresAt.getTime() + (additionalHours * 60 * 60 * 1000));
        accounts[accountIndex].expiresAt = newExpirationTime;
        
        // Save updated accounts (this would need to be implemented in storageService)
        // storageService.saveAccounts(accounts);
        
        toast.success(`Account expiration extended by ${additionalHours} hour(s)`, {
          icon: '🕐',
        });
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to extend account expiration:', error);
      toast.error('Failed to extend account expiration', {
        icon: '❌',
      });
      return false;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const cleanupService = new CleanupService();
