import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mailApi } from '../services/mailApi';
import { MailAccount, MailMessage } from '../types/api';
import toast from 'react-hot-toast';

interface InboxState {
  account: MailAccount | null;
  password: string;
  isAuthenticated: boolean;
  expiresAt: Date | null;
  token: string | null;
  createdAt: Date | null;
}

interface CleanupLog {
  accountId: string;
  deletedAt: Date;
  reason: string;
  success: boolean;
  error?: string;
}

export function useInbox() {
  const [inboxState, setInboxState] = useState<InboxState>(() => {
    // Try to restore from localStorage
    const saved = localStorage.getItem('inbox-state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.account && parsed.isAuthenticated && parsed.token) {
          mailApi.setToken(parsed.token);
          return {
            ...parsed,
            expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : null,
            createdAt: parsed.createdAt ? new Date(parsed.createdAt) : null,
            token: parsed.token,
          };
        }
      } catch (error) {
        console.error('Failed to parse saved inbox state:', error);
        localStorage.removeItem('inbox-state');
      }
    }
    return {
      account: null,
      password: '',
      isAuthenticated: false,
      expiresAt: null,
      token: null,
      createdAt: null,
    };
  });

  // Timer state for countdown display
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [showWarning, setShowWarning] = useState<boolean>(false);

  // Always set token on mount if present
  useEffect(() => {
    if (inboxState.token) {
      mailApi.setToken(inboxState.token);
    }
  }, [inboxState.token]);

  const queryClient = useQueryClient();

  // Fetch available domains
  const { 
    data: domains = [], 
    isLoading: domainsLoading,
    isError: domainsError,
    error: domainsErrorMessage 
  } = useQuery({
    queryKey: ['domains'],
    queryFn: () => mailApi.getDomains(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Calculate time remaining and update timer
  useEffect(() => {
    if (!inboxState.expiresAt || !inboxState.isAuthenticated) {
      setTimeRemaining(0);
      setShowWarning(false);
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const remaining = Math.max(0, Math.floor((inboxState.expiresAt!.getTime() - now.getTime()) / 1000));
      setTimeRemaining(remaining);

      // Show warning at 30 minutes (1800 seconds) and 10 minutes (600 seconds)
      const shouldShowWarning = remaining <= 1800 && remaining > 0;
      setShowWarning(shouldShowWarning);

      // Auto-cleanup when expired
      if (remaining <= 0 && inboxState.account) {
        handleExpiredInbox();
      }
    };

    // Update immediately
    updateTimer();

    // Update every second for accurate countdown
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [inboxState.expiresAt, inboxState.isAuthenticated, inboxState.account]);

  // Handle expired inbox cleanup
  const handleExpiredInbox = useCallback(async () => {
    if (!inboxState.account) return;

    console.log('⏰ Inbox expired, initiating cleanup...');
    
    try {
      // Log cleanup attempt
      const cleanupLog: CleanupLog = {
        accountId: inboxState.account.id,
        deletedAt: new Date(),
        reason: 'timer_expired',
        success: false,
      };

      // Attempt to delete from mail.tm
      try {
        await mailApi.deleteAccount(inboxState.account.id);
        cleanupLog.success = true;
        console.log('✅ Account deleted from mail.tm successfully');
      } catch (error) {
        cleanupLog.success = false;
        cleanupLog.error = error instanceof Error ? error.message : 'Unknown error';
        console.error('❌ Failed to delete account from mail.tm:', error);
      }

      // Store cleanup log
      const existingLogs = JSON.parse(localStorage.getItem('cleanup-logs') || '[]');
      existingLogs.push(cleanupLog);
      // Keep only last 50 logs
      if (existingLogs.length > 50) {
        existingLogs.splice(0, existingLogs.length - 50);
      }
      localStorage.setItem('cleanup-logs', JSON.stringify(existingLogs));

      // Clear local state regardless of API success
      setInboxState({
        account: null,
        password: '',
        isAuthenticated: false,
        expiresAt: null,
        token: null,
        createdAt: null,
      });
      
      mailApi.clearToken();
      localStorage.removeItem('inbox-state');
      queryClient.removeQueries({ queryKey: ['messages'] });
      
      toast.error('Inbox has expired and been deleted', {
        icon: '⏰',
        duration: 5000,
      });

    } catch (error) {
      console.error('❌ Error during cleanup process:', error);
    }
  }, [inboxState.account, queryClient]);

  // Create inbox mutation with enhanced error handling
  const createInboxMutation = useMutation({
    mutationFn: async () => {
      console.log('🚀 Creating new inbox...');
      console.log('📋 Available domains:', domains);
      
      const activeDomains = domains.filter(d => d.isActive && !d.isPrivate);
      console.log('✅ Active domains:', activeDomains);
      
      if (activeDomains.length === 0) {
        console.error('❌ No available domains found');
        throw new Error('No available domains found. Please try again later.');
      }

      const randomDomain = activeDomains[Math.floor(Math.random() * activeDomains.length)];
      const username = Math.random().toString(36).substring(2, 10);
      const address = `${username}@${randomDomain.domain}`;
      const password = Math.random().toString(36).substring(2, 15);

      console.log('📧 Creating account:', { address });

      // Create the account and wait for it to be ready
      await mailApi.createAccount(address, password);
      
      // Get authentication token
      const token = await mailApi.getToken(address, password);
      mailApi.setToken(token.token);
      
      // Ensure the account is properly initialized by fetching it
      const verifiedAccount = await mailApi.getAccount();
      
      // Wait a moment to ensure the account is fully ready
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('✅ Inbox created successfully:', { accountId: verifiedAccount.id, address: verifiedAccount.address });
      
      return { account: verifiedAccount, password, token };
    },
    onSuccess: ({ account, password, token }) => {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + (60 * 60 * 1000)); // 1 hour from now

      const newState = {
        account,
        password,
        isAuthenticated: true,
        expiresAt,
        createdAt: now,
        token: token.token,
      };

      setInboxState(newState);

      // Save to localStorage with creation timestamp
      localStorage.setItem('inbox-state', JSON.stringify(newState));

      toast.success('Inbox created successfully! Valid for 1 hour.', {
        icon: '📬',
        duration: 4000,
      });

      // Start polling for messages immediately
      queryClient.invalidateQueries({ queryKey: ['messages', account.id] });
    },
    onError: (error) => {
      console.error('❌ Failed to create inbox:', error);
      toast.error(error.message || 'Failed to create inbox', {
        icon: '❌',
      });
    },
  });

  // Fetch messages with enhanced polling and error handling
  const { 
    data: messages = [], 
    isLoading: messagesLoading,
    refetch: refetchMessages,
    isError: isMessagesError,
    error: messagesError,
  } = useQuery<MailMessage[]>({
    queryKey: ['messages', inboxState.account?.id],
    queryFn: async () => {
      console.log('🔍 Fetching messages...');
      console.log('🔍 Account ID:', inboxState.account?.id);
      console.log('🔍 Token present:', !!inboxState.token);
      console.log('🔍 Is authenticated:', inboxState.isAuthenticated);
      
      try {
        const result = await mailApi.getMessages();
        console.log('📨 Raw API response:', result);
        console.log('📊 Messages count:', result?.length || 0);
        
        if (result && result.length > 0) {
          console.log('📧 First message sample:', result[0]);
          
          // Show notification for new messages
          const lastCheck = localStorage.getItem('last-message-check');
          const lastCheckTime = lastCheck ? new Date(lastCheck) : new Date(0);
          const newMessages = result.filter(msg => new Date(msg.createdAt) > lastCheckTime);
          
          if (newMessages.length > 0) {
            toast.success(`${newMessages.length} new message(s) received!`, {
              icon: '📧',
              duration: 3000,
            });
          }
          
          localStorage.setItem('last-message-check', new Date().toISOString());
        }
        
        // Ensure we always return an array
        const messagesArray = Array.isArray(result) ? result : [];
        console.log('✅ Processed messages array:', messagesArray);
        
        return messagesArray;
      } catch (error) {
        console.error('❌ Error fetching messages:', error);
        // Log more details about the error
        if (error instanceof Error) {
          console.error('❌ Error message:', error.message);
          console.error('❌ Error stack:', error.stack);
        }
        throw error;
      }
    },
    enabled: !!inboxState.account && inboxState.isAuthenticated && !!inboxState.token && timeRemaining > 0,
    refetchInterval: (data) => {
      // More frequent polling if no messages, less frequent if we have messages
      // Stop polling if expired
      if (timeRemaining <= 0) return false;
      return data && data.length > 0 ? 10000 : 3000; // 10s vs 3s
    },
    staleTime: 0, // Always consider data stale to ensure fresh fetches
    retry: (failureCount, error) => {
      console.log(`🔄 Retry attempt ${failureCount} for messages fetch:`, error);
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Delete inbox mutation with enhanced cleanup
  const deleteInboxMutation = useMutation({
    mutationFn: async () => {
      if (!inboxState.account) throw new Error('No inbox to delete');
      
      const cleanupLog: CleanupLog = {
        accountId: inboxState.account.id,
        deletedAt: new Date(),
        reason: 'user_requested',
        success: false,
      };

      try {
        await mailApi.deleteAccount(inboxState.account.id);
        cleanupLog.success = true;
      } catch (error) {
        cleanupLog.success = false;
        cleanupLog.error = error instanceof Error ? error.message : 'Unknown error';
        throw error;
      } finally {
        // Store cleanup log
        const existingLogs = JSON.parse(localStorage.getItem('cleanup-logs') || '[]');
        existingLogs.push(cleanupLog);
        if (existingLogs.length > 50) {
          existingLogs.splice(0, existingLogs.length - 50);
        }
        localStorage.setItem('cleanup-logs', JSON.stringify(existingLogs));
      }
    },
    onSuccess: () => {
      setInboxState({
        account: null,
        password: '',
        isAuthenticated: false,
        expiresAt: null,
        token: null,
        createdAt: null,
      });
      mailApi.clearToken();
      localStorage.removeItem('inbox-state');
      localStorage.removeItem('last-message-check');
      queryClient.removeQueries({ queryKey: ['messages'] });
      toast.success('Inbox deleted successfully!', {
        icon: '🗑️',
      });
    },
    onError: (error) => {
      console.error('❌ Failed to delete inbox:', error);
      toast.error(error.message || 'Failed to delete inbox', {
        icon: '❌',
      });
    },
  });

  // Delete message mutation
  const deleteMessageMutation = useMutation({
    mutationFn: (messageId: string) => mailApi.deleteMessage(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      toast.success('Message deleted successfully!', {
        icon: '🗑️',
        duration: 2000,
      });
    },
    onError: (error) => {
      console.error('❌ Failed to delete message:', error);
      toast.error(error.message || 'Failed to delete message', {
        icon: '❌',
      });
    },
  });

  // Copy email to clipboard with fallback
  const copyToClipboard = useCallback(async (text: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for insecure context or unsupported browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      toast.success('Copied to clipboard!', {
        icon: '📋',
        duration: 2000,
      });
    } catch (error) {
      console.error('❌ Failed to copy to clipboard:', error);
      toast.error('Failed to copy to clipboard', {
        icon: '❌',
      });
    }
  }, []);

  // Check if inbox is expired
  const isExpired = timeRemaining <= 0 && inboxState.isAuthenticated;

  // Automatically create inbox if not authenticated and domains are available
  useEffect(() => {
    if (!inboxState.isAuthenticated && !createInboxMutation.isPending && !domainsLoading && !domainsError && domains && domains.length > 0) {
      const activeDomains = domains.filter(d => d.isActive && !d.isPrivate);
      if (activeDomains.length > 0) {
        console.log('🚀 Auto-creating inbox with available domains...');
        createInboxMutation.mutate();
      } else {
        console.warn('⚠️ No active domains available for inbox creation');
      }
    }
  }, [inboxState.isAuthenticated, createInboxMutation.isPending, createInboxMutation.mutate, domainsLoading, domainsError, domains]);

  // Enhanced error handling and auto-refresh
  useEffect(() => {
    if (isMessagesError && inboxState.isAuthenticated && timeRemaining > 0) {
      console.log('🔄 Messages error detected, will retry in 5 seconds:', messagesError);
      const timer = setTimeout(() => {
        console.log('🔄 Retrying messages fetch...');
        refetchMessages();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isMessagesError, inboxState.isAuthenticated, refetchMessages, messagesError, timeRemaining]);

  // Ensure messages is always an array and log any issues
  const safeMessages = Array.isArray(messages) ? messages : [];
  if (!Array.isArray(messages) && messages !== undefined) {
    console.warn('⚠️ Messages is not an array:', messages);
  }

  // Format time remaining for display
  const formatTimeRemaining = useCallback((seconds: number) => {
    if (seconds <= 0) return '00:00:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    // State
    account: inboxState.account,
    messages: safeMessages,
    isAuthenticated: inboxState.isAuthenticated,
    expiresAt: inboxState.expiresAt,
    createdAt: inboxState.createdAt,
    isExpired,
    
    // Timer state
    timeRemaining,
    formattedTimeRemaining: formatTimeRemaining(timeRemaining),
    showWarning,
    
    // Domain state
    domains,
    domainsLoading,
    domainsError,
    domainsErrorMessage,
    
    // Loading states
    isCreating: createInboxMutation.isPending,
    isDeleting: deleteInboxMutation.isPending,
    messagesLoading,
    
    // Error states
    isMessagesError,
    messagesError,
    
    // Actions
    createInbox: () => createInboxMutation.mutate(),
    deleteInbox: () => deleteInboxMutation.mutate(),
    deleteMessage: deleteMessageMutation.mutate,
    copyToClipboard,
    refetchMessages,
  };
}

export default useInbox;