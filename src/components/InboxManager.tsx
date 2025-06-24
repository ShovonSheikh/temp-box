import { 
  Inbox, 
  Copy, 
  RotateCcw, 
  Trash2,
  Loader2,
  Trash,
  AlertCircle,
  RefreshCw,
  Bug,
  Settings,
} from 'lucide-react';
import { useInbox } from '../hooks/useInbox';
import { formatDistanceToNow } from 'date-fns';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { SystemStats } from './SystemStats';

interface InboxManagerProps {
  onMessageSelect: (messageId: string) => void;
}

export function InboxManager({ onMessageSelect }: InboxManagerProps) {
  const [showDebug, setShowDebug] = useState(false);
  const [showSystemStats, setShowSystemStats] = useState(false);
  const [timer, setTimer] = useState(0);
  const [timerExpired, setTimerExpired] = useState(false);
  const {
    account,
    messages,
    isAuthenticated,
    isExpired,
    isDeleting,
    messagesLoading,
    isMessagesError,
    messagesError,
    deleteInbox,
    copyToClipboard,
    refetchMessages,
    deleteMessage,
    isCreating,
    createInbox,
    expiresAt,
    domains,
    domainsLoading,
    domainsError,
    domainsErrorMessage,
  } = useInbox();

  // Initialize timer based on expiresAt
  useEffect(() => {
    if (expiresAt && isAuthenticated && !isExpired) {
      const now = new Date();
      const timeLeft = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
      setTimer(timeLeft);
      setTimerExpired(timeLeft <= 0);
    } else {
      setTimer(0);
      setTimerExpired(false);
    }
  }, [expiresAt, isAuthenticated, isExpired]);

  // Timer countdown effect
  useEffect(() => {
    if (!isAuthenticated || isExpired || isDeleting || timerExpired || timer <= 0) return;
    
    const interval = setInterval(() => {
      setTimer((prev) => {
        const newTimer = prev - 1;
        if (newTimer <= 0) {
          setTimerExpired(true);
          deleteInbox();
          toast.error('Your inbox has been deleted (timer expired).');
          return 0;
        }
        return newTimer;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated, isExpired, isDeleting, timer, timerExpired, deleteInbox]);

  // Debug logging to track messages data flow
  useEffect(() => {
    console.log('🔍 InboxManager - Component state updated:', {
      messagesCount: messages?.length || 0,
      messages: messages,
      isAuthenticated,
      messagesLoading,
      isMessagesError,
      messagesError: messagesError?.message,
      accountId: account?.id,
      accountAddress: account?.address,
      isCreating,
      domainsLoading,
      domainsError,
      domainsCount: domains?.length || 0,
    });

    // Force a re-render check
    if (messages && messages.length > 0) {
      console.log('🎯 MESSAGES FOUND! Should be displaying:', messages);
    }
  }, [messages, isAuthenticated, messagesLoading, isMessagesError, messagesError, account, isCreating, domainsLoading, domainsError, domains]);

  // Automatically create inbox if not authenticated and domains are available
  useEffect(() => {
    if (!isAuthenticated && !isCreating && !domainsLoading && !domainsError && domains && domains.length > 0) {
      const activeDomains = domains.filter(d => d.isActive && !d.isPrivate);
      if (activeDomains.length > 0) {
        console.log('🚀 Auto-creating inbox with available domains...');
        createInbox();
      } else {
        console.warn('⚠️ No active domains available for inbox creation');
      }
    }
  }, [isAuthenticated, isCreating, createInbox, domainsLoading, domainsError, domains]);

  const handleDeleteMessage = (messageId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent opening message when deleting
    if (confirm('Are you sure you want to delete this message?')) {
      deleteMessage(messageId);
    }
  };

  const handleRefresh = () => {
    console.log('🔄 Manual refresh triggered');
    refetchMessages();
  };

  // Show domain loading/error states
  if (domainsLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Inbox className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              <h2 className="text-lg font-display font-medium text-slate-900 dark:text-slate-100">
                Loading Domains...
              </h2>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center space-y-3 py-8">
            <Loader2 className="w-6 h-6 text-violet-600 dark:text-violet-400 animate-spin" />
            <p className="text-slate-600 dark:text-slate-400">
              Fetching available email domains...
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-500">This should only take a few seconds</p>
          </div>
        </div>
      </div>
    );
  }

  if (domainsError) {
    return (
      <div className="space-y-6">
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <h2 className="text-lg font-display font-medium text-slate-900 dark:text-slate-100">
                Domain Error
              </h2>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center space-y-3 py-8">
            <AlertCircle className="w-8 h-8 text-red-500 dark:text-red-400" />
            <p className="text-red-600 dark:text-red-400 font-medium">Failed to load email domains</p>
            <p className="text-sm text-slate-500 dark:text-slate-500 text-center">
              {domainsErrorMessage?.message || 'Unable to fetch available domains'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !account) {
    const activeDomains = domains?.filter(d => d.isActive && !d.isPrivate) || [];
    const hasActiveDomains = activeDomains.length > 0;

    return (
      <div className="space-y-6">
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Inbox className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              <h2 className="text-lg font-display font-medium text-slate-900 dark:text-slate-100">
                {isCreating ? 'Creating Inbox...' : hasActiveDomains ? 'Initializing Inbox' : 'No Domains Available'}
              </h2>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center space-y-3 py-8">
            {hasActiveDomains ? (
              <>
                <Loader2 className="w-6 h-6 text-violet-600 dark:text-violet-400 animate-spin" />
                <p className="text-slate-600 dark:text-slate-400">
                  {isCreating ? 'Setting up your secure inbox...' : 'Preparing your inbox...'}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-500">This should only take a few seconds</p>
              </>
            ) : (
              <>
                <AlertCircle className="w-8 h-8 text-orange-500 dark:text-orange-400" />
                <p className="text-orange-600 dark:text-orange-400 font-medium">No email domains available</p>
                <p className="text-sm text-slate-500 dark:text-slate-500 text-center">
                  There are currently no active email domains available for creating inboxes.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors"
                >
                  Refresh Page
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Calculate timer values for 1 hour (3600 seconds)
  const totalDuration = 3600; // 1 hour in seconds
  const timerProgress = Math.max(0, (timer / totalDuration) * 100);

  return (
    <div className="space-y-6">
      {/* Inbox Header */}
      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Inbox className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            <h2 className="text-lg font-display font-medium text-slate-900 dark:text-slate-100">Your Inbox</h2>
            {/* Timer display */}
            {isAuthenticated && !isExpired && !timerExpired && timer > 0 && (
              <span
                className={`ml-4 px-3 py-1 rounded-full font-mono text-xs transition-colors duration-500 ${
                  timer > 1800 // 30 minutes
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-200'
                    : timer > 600 // 10 minutes
                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-200'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-200'
                }`}
                title="Time left before inbox deletion"
              >
                {`${Math.floor(timer / 60).toString().padStart(2, '0')}:${(timer % 60)
                  .toString()
                  .padStart(2, '0')}`} left
              </span>
            )}
            {/* Timer progress bar */}
            {isAuthenticated && !isExpired && !timerExpired && timer > 0 && (
              <div className="ml-4 w-32 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden" title="Timer progress">
                <div
                  className="h-2 transition-all duration-500"
                  style={{
                    width: `${timerProgress}%`,
                    background:
                      timer > 1800 // 30 minutes
                        ? '#4ade80' // green-400
                        : timer > 600 // 10 minutes
                        ? '#facc15' // yellow-400
                        : '#f87171', // red-400
                  }}
                ></div>
              </div>
            )}
            {timerExpired && (
              <span className="ml-4 px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-200 font-mono text-xs">
                Inbox deleted (timer expired)
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50"
              title="Toggle debug info"
              aria-label="Toggle debug info"
            >
              <Bug className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowSystemStats(true)}
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-all duration-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50"
              title="System statistics"
              aria-label="System statistics"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={handleRefresh}
              disabled={messagesLoading}
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-all duration-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50 disabled:opacity-50 active:scale-95 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
              title="Refresh messages"
              aria-label="Refresh messages"
            >
              <RotateCcw className={`w-5 h-5 ${messagesLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => deleteInbox()}
              disabled={isDeleting}
              className="p-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-all duration-200 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 active:scale-95 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
              title="Delete inbox"
              aria-label="Delete inbox"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Email Address */}
        <div className="flex items-center space-x-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl">
          <div className="flex-1 font-mono text-sm text-slate-900 dark:text-slate-100 select-all">
            {account.address}
          </div>
          <button
            onClick={() => copyToClipboard(account.address)}
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-all duration-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50 active:scale-95 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
            title="Copy to clipboard"
          >
            <Copy className="w-5 h-5" />
          </button>
        </div>

        {isExpired && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl">
            <p className="text-sm text-red-600 dark:text-red-400">
              This inbox has expired. Please create a new one.
            </p>
          </div>
        )}

        {/* Enhanced Debug Info */}
        {showDebug && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-xs">
            <div className="font-mono text-blue-800 dark:text-blue-200 space-y-1">
              <div className="font-bold text-sm mb-2">🐛 Debug Information</div>
              <div>• Messages Array Length: {messages?.length || 0}</div>
              <div>• Messages Type: {Array.isArray(messages) ? 'Array' : typeof messages}</div>
              <div>• Loading State: {messagesLoading ? 'Loading' : 'Not Loading'}</div>
              <div>• Error State: {isMessagesError ? 'Has Error' : 'No Error'}</div>
              <div>• Error Message: {messagesError?.message || 'None'}</div>
              <div>• Authenticated: {isAuthenticated ? 'Yes' : 'No'}</div>
              <div>• Account ID: {account?.id || 'None'}</div>
              <div>• Account Address: {account?.address || 'None'}</div>
              <div>• Timer: {timer}s ({Math.floor(timer / 60)}m {timer % 60}s)</div>
              <div>• Expires At: {expiresAt?.toLocaleString() || 'None'}</div>
              <div>• Domains Count: {domains?.length || 0}</div>
              <div>• Active Domains: {domains?.filter(d => d.isActive && !d.isPrivate).length || 0}</div>
              {messages && messages.length > 0 && (
                <div className="mt-2 p-2 bg-green-100 dark:bg-green-900/20 rounded">
                  <div className="font-bold text-green-800 dark:text-green-200">First Message:</div>
                  <div className="text-green-700 dark:text-green-300">
                    ID: {messages[0].id}<br/>
                    From: {messages[0].from.address}<br/>
                    Subject: {messages[0].subject}<br/>
                    Created: {messages[0].createdAt}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Messages List */}
      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-3xl shadow-lg border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
        <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-display font-medium text-slate-900 dark:text-slate-100">
              Messages {messages.length > 0 && `(${messages.length})`}
            </h3>
            {isMessagesError && (
              <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">Error loading messages</span>
                <button
                  onClick={handleRefresh}
                  className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  title="Retry"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {messagesLoading ? (
            <div className="p-6">
              <div className="flex items-center justify-center space-x-3">
                <Loader2 className="w-5 h-5 text-violet-600 dark:text-violet-400 animate-spin" />
                <p className="text-slate-600 dark:text-slate-400">Fetching messages...</p>
              </div>
            </div>
          ) : isMessagesError ? (
            <div className="p-6">
              <div className="flex flex-col items-center justify-center space-y-3">
                <AlertCircle className="w-8 h-8 text-red-500 dark:text-red-400" />
                <p className="text-red-600 dark:text-red-400 font-medium">Failed to load messages</p>
                <p className="text-sm text-slate-500 dark:text-slate-500 text-center">
                  {messagesError?.message || 'Unknown error occurred'}
                </p>
                <button
                  onClick={handleRefresh}
                  className="px-4 py-2 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : !Array.isArray(messages) ? (
            <div className="p-6">
              <div className="flex flex-col items-center justify-center space-y-3">
                <AlertCircle className="w-8 h-8 text-orange-500 dark:text-orange-400" />
                <p className="text-orange-600 dark:text-orange-400 font-medium">Data format error</p>
                <p className="text-sm text-slate-500 dark:text-slate-500 text-center">
                  Messages data is not in expected format: {typeof messages}
                </p>
                <button
                  onClick={handleRefresh}
                  className="px-4 py-2 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors"
                >
                  Refresh
                </button>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="p-6">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <Inbox className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                <p className="text-slate-600 dark:text-slate-400">No messages yet</p>
              </div>
              <p className="text-sm text-center text-slate-500 dark:text-slate-500">
                Send an email to your temporary address - it will appear here instantly
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200/50 dark:divide-slate-700/50">
              {messages.map((message, index) => {
                console.log(`🎯 Rendering message ${index + 1}:`, message);
                return (
                  <div
                    key={message.id || `message-${index}`}
                    className="group flex items-center hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all duration-200"
                  >
                    <button
                      onClick={() => onMessageSelect(message.id)}
                      className="flex-1 p-4 text-left transition-all duration-200 hover:pl-6 focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-700/70"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {message.from?.name || message.from?.address || 'Unknown sender'}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                            {message.subject || '(No subject)'}
                          </p>
                          {message.intro && (
                            <p className="text-xs text-slate-500 dark:text-slate-500 line-clamp-2">
                              {message.intro}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          <time className="text-xs text-slate-500 dark:text-slate-500 whitespace-nowrap">
                            {message.createdAt ? formatDistanceToNow(new Date(message.createdAt), { addSuffix: true }) : 'Unknown time'}
                          </time>
                          {!message.seen && (
                            <div className="w-2 h-2 bg-violet-600 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={(e) => handleDeleteMessage(message.id, e)}
                      className="p-2 opacity-0 group-hover:opacity-100 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-all duration-200 mx-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 active:scale-95 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
                      title="Delete message"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      {/* System Stats Modal */}
      <SystemStats 
        isOpen={showSystemStats} 
        onClose={() => setShowSystemStats(false)} 
      />
    </div>
  );
}
