import { MailAccount, MailMessage, MailMessageDetail, AuthToken, Domain } from '../types/api';

const API_BASE = 'https://api.mail.tm';

interface RawMailMessage {
  id?: string;
  _id?: string;
  msgid?: string;
  accountId?: string;
  account_id?: string;
  from?: {
    address?: string;
    name?: string;
  };
  to?: Array<{
    address: string;
    name: string;
  }>;
  subject?: string;
  intro?: string;
  seen?: boolean;
  isDeleted?: boolean;
  hasAttachments?: boolean;
  size?: number;
  downloadUrl?: string;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

class MailApiService {
  private token: string | null = null;

  async getDomains(): Promise<Domain[]> {
    console.log('🌐 Fetching domains...');
    const response = await fetch(`${API_BASE}/domains`);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to fetch domains:', errorText);
      throw new Error('Failed to fetch domains');
    }
    const data = await response.json();
    const domains = data['hydra:member'] || [];
    console.log('✅ Domains fetched:', domains.length);
    return domains;
  }

  async createAccount(address: string, password: string): Promise<MailAccount> {
    console.log('👤 Creating account:', { address });
    const response = await fetch(`${API_BASE}/accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ address, password }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Account creation failed:', error);
      throw new Error(error['hydra:description'] || error.message || 'Failed to create account');
    }
    
    const account = await response.json();
    console.log('✅ Account created successfully:', account);
    return account;
  }

  async getToken(address: string, password: string): Promise<AuthToken> {
    console.log('🔑 Getting token for:', { address });
    const response = await fetch(`${API_BASE}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ address, password }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Token fetch failed:', error);
      throw new Error(error['hydra:description'] || error.message || 'Failed to authenticate');
    }
    
    const tokenData = await response.json();
    this.token = tokenData.token;
    console.log('✅ Token obtained successfully');
    return tokenData;
  }

  async getAccount(): Promise<MailAccount> {
    if (!this.token) throw new Error('Not authenticated');
    
    console.log('👤 Fetching account details');
    const response = await fetch(`${API_BASE}/me`, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Account fetch failed:', error);
      throw new Error(error['hydra:description'] || error.message || 'Failed to fetch account');
    }

    const account = await response.json();
    console.log('✅ Account details fetched:', account);
    return account;
  }

  async getMessages(page: number = 1, itemsPerPage: number = 50): Promise<MailMessage[]> {
    if (!this.token) {
      console.error('❌ No token available for messages fetch');
      throw new Error('Not authenticated');
    }
    
    console.log('📨 Fetching messages...', { page, itemsPerPage, token: this.token.substring(0, 10) + '...' });
    
    const url = `${API_BASE}/messages?page=${page}&itemsPerPage=${itemsPerPage}`;
    console.log('🔗 Request URL:', url);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Accept': 'application/json',
      },
    });
    
    console.log('📡 Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to fetch messages - Response:', errorText);
      
      let error;
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { message: errorText };
      }
      
      throw new Error(error['hydra:description'] || error.message || 'Failed to fetch messages');
    }

    const data = await response.json();
    console.log('📊 Raw messages response:', data);

    // Handle both array response and hydra response
    let rawMessages;
    if (Array.isArray(data)) {
      console.log('📊 Response is direct array');
      rawMessages = data;
    } else if (data['hydra:member'] && Array.isArray(data['hydra:member'])) {
      console.log('📊 Response has hydra:member array');
      rawMessages = data['hydra:member'];
    } else {
      console.warn('⚠️ Unexpected response structure:', data);
      rawMessages = [];
    }

    console.log('📧 Processing', rawMessages.length, 'raw messages');

    // Process and normalize the messages
    const messages = rawMessages.map((msg: RawMailMessage, index: number) => {
      console.log(`📧 Processing message ${index + 1}:`, msg);
      
      // Handle accountId with potential leading slash
      let accountId = msg.accountId || msg.account_id || '';
      if (accountId.startsWith('/accounts/')) {
        accountId = accountId.replace('/accounts/', '');
      }
      
      const processedMessage = {
        id: msg.id || msg._id || `msg-${index}`,
        accountId: accountId,
        msgid: msg.msgid || msg.id || msg._id || `msgid-${index}`,
        from: {
          address: msg.from?.address || 'unknown@example.com',
          name: msg.from?.name || ''
        },
        to: Array.isArray(msg.to) ? msg.to : [],
        subject: msg.subject || '(No subject)',
        intro: msg.intro || '',
        seen: Boolean(msg.seen),
        isDeleted: Boolean(msg.isDeleted),
        hasAttachments: Boolean(msg.hasAttachments),
        size: Number(msg.size) || 0,
        downloadUrl: msg.downloadUrl || '',
        createdAt: msg.createdAt || msg.created_at || new Date().toISOString(),
        updatedAt: msg.updatedAt || msg.updated_at || new Date().toISOString(),
      };
      
      console.log(`✅ Processed message ${index + 1}:`, processedMessage);
      return processedMessage;
    });

    console.log('✅ Final processed messages:', messages);
    console.log('📊 Returning', messages.length, 'messages');
    
    return messages;
  }

  async getMessage(messageId: string): Promise<MailMessageDetail> {
    if (!this.token) throw new Error('Not authenticated');
    
    console.log('📧 Fetching message details:', messageId);
    const response = await fetch(`${API_BASE}/messages/${messageId}`, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Failed to fetch message:', error);
      throw new Error(error.message || 'Failed to fetch message');
    }

    const message = await response.json();
    console.log('✅ Message details fetched:', message);
    return message;
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    if (!this.token) throw new Error('Not authenticated');
    
    console.log('👁️ Marking message as read:', messageId);
    const response = await fetch(`${API_BASE}/messages/${messageId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/merge-patch+json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ seen: true }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Failed to mark message as read:', error);
      throw new Error(error.message || 'Failed to mark message as read');
    }
    
    console.log('✅ Message marked as read');
  }

  async deleteMessage(messageId: string): Promise<void> {
    if (!this.token) throw new Error('Not authenticated');
    
    console.log('🗑️ Deleting message:', messageId);
    const response = await fetch(`${API_BASE}/messages/${messageId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
    });
    
    if (!response.ok) {
      console.error('❌ Failed to delete message');
      throw new Error('Failed to delete message');
    }
    
    console.log('✅ Message deleted successfully');
  }

  async deleteAccount(accountId: string): Promise<void> {
    if (!this.token) throw new Error('Not authenticated');
    
    console.log('🗑️ Deleting account:', accountId);
    const response = await fetch(`${API_BASE}/accounts/${accountId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
    });
    
    if (!response.ok) {
      console.error('❌ Failed to delete account');
      throw new Error('Failed to delete account');
    }
    
    console.log('✅ Account deleted successfully');
  }

  setToken(token: string) {
    console.log('🔑 Setting token:', token.substring(0, 10) + '...');
    this.token = token;
  }

  clearToken() {
    console.log('🔑 Clearing token');
    this.token = null;
  }

  // Debug method to check current state
  getDebugInfo() {
    return {
      hasToken: !!this.token,
      tokenPreview: this.token ? this.token.substring(0, 10) + '...' : null,
    };
  }
}

export const mailApi = new MailApiService();