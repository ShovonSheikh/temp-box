import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mailApi } from '../services/mailApi';
import { storageService } from '../services/storageService';
import { cleanupService } from '../services/cleanupService';
import { MailAccount, MailMessage } from '../types/api';
import toast from 'react-hot-toast';

interface InboxState {
  account: MailAccount | null;
  password: string;
  isAuthenticated: boolean;
  expiresAt: Date | null;
  token: string | null;
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
    };
  });

  // Always set token on mount if present
  useEffect(() => {
    if (inboxState.token) {
      mailApi.setToken(inboxState.token);
    }
  }, [inboxState.token]);

  const queryClient = useQueryClient();

  // Shared function to reset inbox state
  const resetInboxState = useCallback(() => {
    setInboxState({
      account: null,
      password: '',
      isAuthenticated: false,
      expiresAt: null,
      token: null,
    });
    mailApi.clearToken();
    localStorage.removeItem('inbox-state');
    queryClient.removeQueries({ queryKey: ['messages'] });
  }, [queryClient]);

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

  // Create inbox mutation with 10-minute expiry
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
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes expiry

      const newState = {
        account,
        password,
        isAuthenticated: true,
        expiresAt,
        token: token.token,
      };

      setInboxState(newState);

      // Save to localStorage (legacy support)
      localStorage.setItem('inbox-state', JSON.stringify(newState));

      // Store account data with enhanced metadata
      storageService.storeAccount(account, password, token.token, expiresAt);

      // Start automated cleanup service if not already running
      cleanupService.startAutomatedCleanup();

      toast.success('Inbox created successfully! (10 minutes)', {
        icon: '📬',
        duration: 3000,
      });

      // Start polling for messages immediately
      queryClient.invalidateQueries({ queryKey: ['messages', account.id] });
    },
    onError: (error) => {
      console.error('❌ Failed to create inbox:', error);
      // Reset state if inbox creation fails to ensure clean state
      resetInboxState();
      toast.error(error.message || 'Failed to create inbox', {
        icon: '❌',
      });
    },
  });

  // Fetch messages with enhanced debugging and throttling
  const messagesQuery = useQuery<MailMessage[]>({
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
        }
        
        // Ensure we always return an array
        const messagesArray = Array.isArray(result) ? result : [];
        console.log('✅ Processed messages array:', messagesArray);
        
        // Update access tracking for current account
        if (inboxState.account) {
          storageService.updateAccountAccess(inboxState.account.id, messagesArray.length);
        }
        
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
    enabled: !!inboxState.account && inboxState.isAuthenticated && !!inboxState.token,
    refetchInterval: (query) => {
      const data = query.state.data;
      // Slower polling to reduce server load
      return Array.isArray(data) && data.length > 0 ? 15000 : 5000; // 15s if has messages, 5s if empty
    },
    staleTime: 2000, // Consider data stale after 2 seconds
    retry: (failureCount, error) => {
      console.log(`🔄 Retry attempt ${failureCount} for messages fetch:`, error);
      return failureCount < 2; // Reduced retry attempts
    },
    retryDelay: (attemptIndex) => Math.min(2000 * 2 ** attemptIndex, 10000), // Faster retry with cap
    onError: (error) => {
      // Handle account no longer exists error
      if (error.message === 'This account no longer exists.') {
        console.log('🔄 Account no longer exists, resetting inbox state');
        resetInboxState();
        toast.error('Account has expired. Please create a new inbox.', {
          icon: '⏰',
        });
      }
    },
  });

  const messages = useMemo(() => messagesQuery.data ?? [], [messagesQuery.data]);
  const messagesLoading = messagesQuery.isLoading;
  const refetchMessages = messagesQuery.refetch;
  const isMessagesError = messagesQuery.isError;
  const messagesError = messagesQuery.error;

  // Enhanced logging for messages state changes
  useEffect(() => {
    const messagesCount = Array.isArray(messages) ? messages.length : 0;
    console.log('📊 Messages state updated:', {
      messagesCount,
      messages: messages,
      isAuthenticated: inboxState.isAuthenticated,
      messagesLoading,
      accountId: inboxState.account?.id,
      accountAddress: inboxState.account?.address,
      isMessagesError,
      messagesError: messagesError?.message,
    });
  }, [messages, inboxState.isAuthenticated, messagesLoading, inboxState.account, isMessagesError, messagesError]);

  // Delete inbox mutation
  const deleteInboxMutation = useMutation({
    mutationFn: () => mailApi.deleteAccount(inboxState.account!.id),
    onSuccess: () => {
      resetInboxState();
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
  const isExpired = inboxState.expiresAt ? new Date() > inboxState.expiresAt : false;

  // Auto-cleanup expired inbox
  useEffect(() => {
    if (isExpired && inboxState.account) {
      console.log('⏰ Inbox expired, cleaning up...');
      resetInboxState();
      toast.error('Inbox has expired', {
        icon: '⏰',
      });
    }
  }
  )

  // Enhanced error handling with reduced retry frequency
  useEffect(() => {
    if (isMessagesError && inboxState.isAuthenticated) {
      console.log('🔄 Messages error detected, will retry in 10 seconds:', messagesError);
      const timer = setTimeout(() => {
        console.log('🔄 Retrying messages fetch...');
        refetchMessages();
      }, 10000); // Increased retry delay
      return () => clearTimeout(timer);
    }
  }, [isMessagesError, inboxState.isAuthenticated, refetchMessages, messagesError]);

  // Ensure messages is always an array and log any issues
  const safeMessages = Array.isArray(messages) ? messages : [];
  if (!Array.isArray(messages) && messages !== undefined) {
    console.warn('⚠️ Messages is not an array:', messages);
  }

  return {
    // State
    account: inboxState.account,
    messages: safeMessages,
    isAuthenticated: inboxState.isAuthenticated,
    expiresAt: inboxState.expiresAt,
    isExpired,
    
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