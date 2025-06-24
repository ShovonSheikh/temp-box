# Backend Implementation Guide

This guide provides instructions for implementing the server-side components of the TempBox enhanced storage and cleanup system.

## Overview

The current implementation works entirely on the client-side using localStorage. For production use, you'll want to implement these features on the backend for better reliability, scalability, and data persistence.

## Required Backend Components

### 1. Database Schema

```sql
-- PostgreSQL / MySQL Schema
CREATE TABLE accounts (
    id VARCHAR(255) PRIMARY KEY,
    address VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    token_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    deleted BOOLEAN DEFAULT FALSE,
    last_accessed_at TIMESTAMP,
    message_count INTEGER DEFAULT 0,
    cleanup_attempts INTEGER DEFAULT 0
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id VARCHAR(255) REFERENCES accounts(id),
    action VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    details TEXT,
    ip_address INET,
    user_agent TEXT
);

CREATE TABLE cleanup_stats (
    id SERIAL PRIMARY KEY,
    total_accounts INTEGER NOT NULL,
    expired_accounts INTEGER NOT NULL,
    deleted_accounts INTEGER NOT NULL,
    failed_deletions INTEGER NOT NULL,
    last_cleanup_run TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_accounts_expires_at ON accounts(expires_at);
CREATE INDEX idx_accounts_deleted ON accounts(deleted);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_account_id ON audit_logs(account_id);
```

### 2. API Endpoints

#### Account Management
```typescript
// POST /api/accounts
interface CreateAccountRequest {
  address: string;
  password: string;
  expiresAt: string; // ISO timestamp
}

// GET /api/accounts/:id
// PUT /api/accounts/:id/access - Update last accessed
// DELETE /api/accounts/:id
```

#### Cleanup Management
```typescript
// POST /api/cleanup/run - Manual cleanup trigger
// GET /api/cleanup/status - Get cleanup statistics
// POST /api/cleanup/start - Start automated cleanup
// POST /api/cleanup/stop - Stop automated cleanup
```

#### Audit Logs
```typescript
// GET /api/audit/:accountId - Get audit logs for account
// GET /api/audit/system - Get system-wide audit logs
```

### 3. Background Jobs

#### Scheduled Cleanup Job
```typescript
// Example using node-cron
import cron from 'node-cron';
import { CleanupService } from './services/cleanup';

class ScheduledCleanup {
  private cleanupService: CleanupService;

  constructor() {
    this.cleanupService = new CleanupService();
  }

  start() {
    // Run every hour
    cron.schedule('0 * * * *', async () => {
      console.log('🔄 Running scheduled cleanup...');
      await this.cleanupService.runCleanupCycle();
    });

    // Run initial cleanup after 5 minutes
    setTimeout(() => {
      this.cleanupService.runCleanupCycle();
    }, 5 * 60 * 1000);
  }
}
```

#### Cleanup Service Implementation
```typescript
import { MailApiService } from './mail-api';
import { DatabaseService } from './database';

export class CleanupService {
  private mailApi: MailApiService;
  private database: DatabaseService;

  constructor() {
    this.mailApi = new MailApiService();
    this.database = new DatabaseService();
  }

  async runCleanupCycle(): Promise<CleanupResult> {
    console.log('🧹 Starting cleanup cycle...');
    
    // Get expired accounts from database
    const expiredAccounts = await this.database.getExpiredAccounts();
    
    if (expiredAccounts.length === 0) {
      console.log('✅ No expired accounts to clean up');
      await this.database.updateCleanupStats();
      return { processed: 0, successful: 0, failed: 0, errors: [] };
    }

    console.log(`🗑️ Found ${expiredAccounts.length} expired accounts to clean up`);
    
    const result = await this.cleanupExpiredAccounts(expiredAccounts);
    
    // Update cleanup statistics
    await this.database.updateCleanupStats();
    
    console.log('✅ Cleanup cycle completed:', result);
    return result;
  }

  private async cleanupExpiredAccounts(accounts: StoredAccount[]): Promise<CleanupResult> {
    const result: CleanupResult = {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [],
    };

    for (const account of accounts) {
      result.processed++;
      
      try {
        // Set token and attempt deletion
        this.mailApi.setToken(account.token);
        await this.mailApi.deleteAccount(account.id);
        
        // Mark as deleted in database
        await this.database.markAccountDeleted(account.id);
        await this.database.addAuditLogEntry(account.id, 'DELETED', 'Account successfully deleted');
        
        result.successful++;
        console.log(`✅ Successfully deleted account ${account.address}`);
        
      } catch (error) {
        result.failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push({
          accountId: account.id,
          address: account.address,
          error: errorMessage,
        });
        
        // Record failure in database
        await this.database.incrementCleanupAttempts(account.id);
        await this.database.addAuditLogEntry(account.id, 'CLEANUP_FAILED', errorMessage);
        
        console.error(`❌ Failed to delete account ${account.address}:`, errorMessage);
      }
      
      // Add delay between deletions to avoid overwhelming the API
      await this.delay(1000);
    }

    return result;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 4. Database Service
```typescript
export class DatabaseService {
  async storeAccount(account: MailAccount, password: string, token: string, expiresAt: Date): Promise<void> {
    const query = `
      INSERT INTO accounts (id, address, password_hash, token_hash, expires_at, created_at, last_accessed_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET
        token_hash = $4,
        expires_at = $5,
        last_accessed_at = CURRENT_TIMESTAMP
    `;
    
    const passwordHash = await this.hashPassword(password);
    const tokenHash = await this.hashToken(token);
    
    await this.execute(query, [account.id, account.address, passwordHash, tokenHash, expiresAt]);
    await this.addAuditLogEntry(account.id, 'CREATED', `Account created: ${account.address}`);
  }

  async getExpiredAccounts(): Promise<StoredAccount[]> {
    const query = `
      SELECT * FROM accounts 
      WHERE expires_at <= CURRENT_TIMESTAMP 
      AND deleted = false
    `;
    
    const result = await this.query(query);
    return result.rows;
  }

  async markAccountDeleted(accountId: string): Promise<void> {
    const query = `
      UPDATE accounts 
      SET deleted = true, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1
    `;
    
    await this.execute(query, [accountId]);
  }

  async addAuditLogEntry(accountId: string, action: string, details?: string): Promise<void> {
    const query = `
      INSERT INTO audit_logs (account_id, action, details)
      VALUES ($1, $2, $3)
    `;
    
    await this.execute(query, [accountId, action, details]);
  }

  async updateCleanupStats(): Promise<void> {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_accounts,
        COUNT(CASE WHEN expires_at <= CURRENT_TIMESTAMP THEN 1 END) as expired_accounts,
        COUNT(CASE WHEN deleted = true THEN 1 END) as deleted_accounts,
        COUNT(CASE WHEN cleanup_attempts > 0 AND deleted = false THEN 1 END) as failed_deletions
      FROM accounts
    `;
    
    const result = await this.query(statsQuery);
    const stats = result.rows[0];
    
    const insertQuery = `
      INSERT INTO cleanup_stats (total_accounts, expired_accounts, deleted_accounts, failed_deletions)
      VALUES ($1, $2, $3, $4)
    `;
    
    await this.execute(insertQuery, [
      stats.total_accounts,
      stats.expired_accounts, 
      stats.deleted_accounts,
      stats.failed_deletions
    ]);
  }

  // ... other database methods
}
```

## Environment Configuration

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/tempbox
DATABASE_MAX_CONNECTIONS=20

# Mail.tm API
MAIL_TM_API_URL=https://api.mail.tm

# Cleanup Configuration
CLEANUP_INTERVAL_MINUTES=60
CLEANUP_BATCH_SIZE=10
CLEANUP_MAX_RETRIES=3
CLEANUP_RETRY_DELAY=2000

# Security
JWT_SECRET=your-secret-key
BCRYPT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Docker Setup

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://tempbox:password@db:5432/tempbox
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=tempbox
      - POSTGRES_USER=tempbox
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./schema.sql:/docker-entrypoint-initdb.d/schema.sql
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    restart: unless-stopped

volumes:
  postgres_data:
```

## Security Considerations

1. **Rate Limiting**: Implement rate limiting for API endpoints
2. **Authentication**: Add proper authentication for admin endpoints
3. **Data Encryption**: Encrypt sensitive data at rest
4. **Input Validation**: Validate all inputs and sanitize data
5. **CORS**: Configure CORS properly for frontend domains
6. **Monitoring**: Add logging and monitoring for security events

## Monitoring and Alerting

```typescript
// Example monitoring setup
import { metrics } from './monitoring';

export class MonitoringService {
  trackCleanupCycle(result: CleanupResult) {
    metrics.increment('cleanup.cycles.total');
    metrics.increment('cleanup.accounts.processed', result.processed);
    metrics.increment('cleanup.accounts.successful', result.successful);
    metrics.increment('cleanup.accounts.failed', result.failed);
    
    if (result.failed > 0) {
      // Alert on failures
      this.sendAlert('Cleanup failures detected', result);
    }
  }
  
  trackAccountCreation(account: StoredAccount) {
    metrics.increment('accounts.created');
    metrics.histogram('accounts.lifetime', this.calculateLifetime(account));
  }
  
  private sendAlert(message: string, data: any) {
    // Send to Slack, Discord, email, etc.
    console.error(`🚨 ALERT: ${message}`, data);
  }
}
```

## Deployment

1. **Database Migration**: Run database migrations before deploying
2. **Zero Downtime**: Use blue-green deployment or rolling updates
3. **Health Checks**: Implement health check endpoints
4. **Backup Strategy**: Set up automated database backups
5. **SSL/TLS**: Ensure all traffic is encrypted in production

This backend implementation will provide the robust, scalable foundation needed for the TempBox service while maintaining all the enhanced features from the client-side implementation.
