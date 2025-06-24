import { useState } from 'react';
import { X, Mail, Clock, User, ArrowLeft, Eye, Code, FileText } from 'lucide-react';
import { useMessage } from '../hooks/useMessage';
import { formatDistanceToNow } from '../utils/dateUtils';
import toast from 'react-hot-toast';

interface MessageViewerProps {
  messageId: string | null;
  onClose: () => void;
}

type ViewMode = 'html' | 'text' | 'raw';

export function MessageViewer({ messageId, onClose }: MessageViewerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('html');
  const { data: message, isLoading, error } = useMessage(messageId);

  // Copy handler for message content
  const handleCopy = async () => {
    if (!message) return;
    let content = '';
    if (viewMode === 'html' && message.html && message.html.length > 0) {
      // Copy as plain text from HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = message.html.join('');
      content = tempDiv.innerText;
    } else if (viewMode === 'text' && message.text) {
      content = message.text;
    } else if (viewMode === 'raw') {
      content = JSON.stringify(message, null, 2);
    }
    if (content) {
      try {
        await navigator.clipboard.writeText(content);
        toast.success('Message copied to clipboard!', { icon: '📋' });
      } catch {
        toast.error('Failed to copy message', { icon: '❌' });
      }
    }
  };

  if (!messageId) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border border-slate-200/50 dark:border-slate-700/50">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="p-2 bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl text-white">
              <Mail className="w-5 h-5" />
            </div>
            <h3 className="font-display text-xl font-bold text-slate-800 dark:text-slate-200">
              Email Message
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {/* Copy button in modal header */}
          <div className="flex justify-end p-2">
            <button
              onClick={handleCopy}
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-all duration-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50 active:scale-95 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
              title="Copy message content"
              disabled={isLoading || !message}
            >
              <Mail className="w-5 h-5" /> Copy
            </button>
          </div>

          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-slate-600 dark:text-slate-400">Loading message...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <div className="p-4 bg-red-100 dark:bg-red-900/20 rounded-2xl inline-block mb-4">
                <Mail className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-red-600 dark:text-red-400 font-medium">
                Failed to load message
              </p>
            </div>
          ) : message ? (
            <div className="h-full flex flex-col">
              {/* Message Info */}
              <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-700/30">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-display text-lg font-bold text-slate-800 dark:text-slate-200">
                      {message.subject || '(No subject)'}
                    </h4>
                    <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {formatDistanceToNow(new Date(message.createdAt))}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center text-slate-600 dark:text-slate-400">
                      <User className="w-4 h-4 mr-2" />
                      <span className="font-medium">From:</span>
                      <span className="ml-1">
                        {message.from.name ? `${message.from.name} <${message.from.address}>` : message.from.address}
                      </span>
                    </div>
                  </div>

                  {message.to.length > 0 && (
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center text-slate-600 dark:text-slate-400">
                        <Mail className="w-4 h-4 mr-2" />
                        <span className="font-medium">To:</span>
                        <span className="ml-1">
                          {message.to.map(to => to.name ? `${to.name} <${to.address}>` : to.address).join(', ')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* View Mode Tabs */}
              <div className="flex border-b border-slate-200/50 dark:border-slate-700/50">
                {[
                  { mode: 'html' as ViewMode, label: 'HTML', icon: Eye },
                  { mode: 'text' as ViewMode, label: 'Text', icon: FileText },
                  { mode: 'raw' as ViewMode, label: 'Raw', icon: Code },
                ].map(({ mode, label, icon: Icon }) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors ${
                      viewMode === mode
                        ? 'text-violet-600 dark:text-violet-400 border-b-2 border-violet-600 dark:border-violet-400'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>

              {/* Message Content */}
              <div className="flex-1 min-h-[120px] max-h-[60vh] overflow-auto p-6">
                <div
                  className="web-message-container prose prose-slate dark:prose-invert max-w-none break-words whitespace-pre-wrap overflow-x-auto"
                  style={{
                    minHeight: '120px',
                    maxHeight: '60vh',
                    overflowY: 'auto',
                    overflowX: 'auto',
                    wordBreak: 'break-all',
                    whiteSpace: 'pre-wrap',
                    background: '#fff',
                    borderRadius: '0.75rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    padding: '1.5rem',
                  }}
                >
                  {/* HTML mode */}
                  {viewMode === 'html' && message.html && message.html.length > 0 ? (
                    <div
                      className="prose prose-slate dark:prose-invert max-w-none break-words overflow-x-auto"
                      style={{ wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}
                      dangerouslySetInnerHTML={{ __html: message.html.join('') }}
                    />
                  ) : viewMode === 'text' && message.text ? (
                    <pre className="whitespace-pre-wrap text-slate-800 dark:text-slate-200 font-mono text-sm break-words overflow-x-auto" style={{ wordBreak: 'break-all' }}>
                      {message.text}
                    </pre>
                  ) : viewMode === 'raw' ? (
                    <pre className="whitespace-pre-wrap text-slate-600 dark:text-slate-400 font-mono text-xs break-words overflow-x-auto" style={{ wordBreak: 'break-all' }}>
                      {JSON.stringify(message, null, 2)}
                    </pre>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-slate-600 dark:text-slate-400">
                        No content available for this view mode
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}