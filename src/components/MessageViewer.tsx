import { useState } from 'react';
import { X, Mail, Clock, User, ArrowLeft, Copy } from 'lucide-react';
import { useMessage } from '../hooks/useMessage';
import { formatDistanceToNow } from '../utils/dateUtils';
import toast from 'react-hot-toast';
import DOMPurify from 'dompurify';

interface MessageViewerProps {
  messageId: string | null;
  onClose: () => void;
  embedded?: boolean;
}

type ViewMode = 'html' | 'text' | 'raw';

export function MessageViewer({ messageId, onClose, embedded = false }: MessageViewerProps) {
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

  // Expanded allowed tags and attributes for safe HTML rendering
  const sanitizeHTML = (html: string) => {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        // Document structure
        'html', 'head', 'body', 'title', 'meta', 'style',
        'p', 'br', 'div', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li', 'a', 'img',
        'table', 'tr', 'td', 'th', 'thead', 'tbody', 'tfoot', 'blockquote',
        'hr', 'pre', 'code', 'sup', 'sub', 'small', 'mark', 'del', 'ins',
        'figure', 'figcaption', 'col', 'colgroup', 'caption', 'dl', 'dt', 'dd',
        'center', 'font', 'nobr', 'wbr'
      ],
      ALLOWED_ATTR: [
        // Standard attributes
        'href', 'src', 'alt', 'title', 'style', 'width', 'height', 'align', 'valign',
        'colspan', 'rowspan', 'target', 'rel', 'class', 'id', 'name', 'type', 'value', 'data-*',
        // Document attributes
        'lang', 'charset', 'content', 'http-equiv', 'viewport',
        // HTML email specific attributes
        'bgcolor', 'background', 'border', 'cellpadding', 'cellspacing', 'color',
        'face', 'size', 'marginwidth', 'marginheight', 'topmargin', 'leftmargin',
        'rightmargin', 'bottommargin', 'hspace', 'vspace', 'clear', 'nowrap',
        // Table and layout attributes
        'rules', 'frame', 'summary', 'axis', 'headers', 'scope', 'abbr',
        // Form attributes (for email buttons/links)
        'method', 'action', 'enctype', 'accept-charset', 'autocomplete',
        // Media attributes
        'controls', 'loop', 'muted', 'poster', 'preload'
      ],
      // Allow common CSS properties used in HTML emails
      ADD_CSS_PROPERTIES: [
        // Layout and positioning
        'max-width', 'min-width', 'max-height', 'min-height', 'width', 'height',
        'background-color', 'background-image', 'background-repeat', 'background-position',
        'background-size', 'background-attachment', 'border-radius', 'box-shadow',
        'text-shadow', 'font-family', 'font-size', 'font-weight', 'font-style',
        'line-height', 'letter-spacing', 'word-spacing', 'text-decoration',
        'text-transform', 'text-align', 'vertical-align', 'white-space',
        'padding', 'margin', 'border', 'border-top', 'border-right', 'border-bottom', 'border-left',
        'border-color', 'border-style', 'border-width', 'outline', 'display',
        'position', 'top', 'right', 'bottom', 'left', 'z-index', 'float', 'clear',
        'overflow', 'visibility', 'opacity', 'cursor', 'list-style', 'table-layout',
        'border-collapse', 'border-spacing', 'empty-cells', 'caption-side',
        // Additional email-specific properties
        'color', 'background', 'text-indent', 'word-wrap', 'word-break'
      ],
      ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
      // Keep relative URLs and data URLs for embedded content
      ALLOW_DATA_ATTR: true,
      // Preserve whitespace for email formatting
      KEEP_CONTENT: true,
      // Allow unknown protocols that might be used in email templates
      ALLOW_UNKNOWN_PROTOCOLS: false,
      // Allow CSS in style tags
      ADD_TAGS: ['style'],
      ADD_ATTR: ['style'],
      // Return a DOM fragment for better performance
      RETURN_DOM_FRAGMENT: false,
      // Return trusted types if supported
      RETURN_TRUSTED_TYPE: false
    });
  };

  if (!messageId) return null;

  // If embedded, render without the modal wrapper
  if (embedded) {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200/50 dark:border-slate-700/50 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl text-white">
              <Mail className="w-5 h-5" />
            </div>
            <h3 className="font-display text-xl font-bold text-slate-800 dark:text-slate-200">
              Email Message
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-all duration-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50 active:scale-95 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2"
              title="Copy message content"
              disabled={isLoading || !message}
            >
              <Copy className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {isLoading ? (
            <div className="p-8 text-center flex-1 flex items-center justify-center">
              <div className="space-y-4">
                <div className="animate-spin w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full mx-auto"></div>
                <p className="text-slate-600 dark:text-slate-400">Loading message...</p>
              </div>
            </div>
          ) : error ? (
            <div className="p-8 text-center flex-1 flex items-center justify-center">
              <div className="space-y-4">
                <div className="p-4 bg-red-100 dark:bg-red-900/20 rounded-2xl inline-block">
                  <Mail className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <p className="text-red-600 dark:text-red-400 font-medium">
                  Failed to load message
                </p>
              </div>
            </div>
          ) : message ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Message Info */}
              <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-700/30 flex-shrink-0">
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
              <div className="flex border-b border-slate-200/50 dark:border-slate-700/50 flex-shrink-0">
                {['html', 'text', 'raw'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode as ViewMode)}
                    className={`px-4 py-2 font-medium transition-all border-b-2 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-inset ${
                      viewMode === mode 
                        ? 'border-violet-600 text-violet-600 dark:text-violet-400' 
                        : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400'
                    }`}
                  >
                    {mode.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Message Content - Scrollable */}
              <div className="flex-1 overflow-auto p-6" style={{ maxHeight: '60vh' }}>
                <div className="min-h-[200px]">
                  {/* HTML mode with improved rendering and sanitization */}
                  {viewMode === 'html' && message.html && message.html.length > 0 ? (
                    (() => {
                      const htmlContent = sanitizeHTML(message.html.join(''));
                      if (!htmlContent.trim()) {
                        return (
                          <div className="text-center py-8">
                            <p className="text-slate-600 dark:text-slate-400">
                              HTML content is empty or was filtered for security
                            </p>
                          </div>
                        );
                      }
                      return (
                        <div
                          className="max-w-none break-words overflow-wrap-anywhere text-slate-900 dark:text-slate-100"
                          style={{
                            lineHeight: '1.6',
                            wordBreak: 'break-word',
                            overflowWrap: 'anywhere',
                          }}
                          dangerouslySetInnerHTML={{ 
                            __html: htmlContent
                          }}
                        />
                      );
                    })()
                  ) : viewMode === 'text' && message.text ? (
                    <pre 
                      className="whitespace-pre-wrap font-mono text-sm break-words overflow-x-hidden text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-700/30 p-4 rounded-lg"
                      style={{
                        lineHeight: '1.6',
                        wordBreak: 'break-all',
                        overflowWrap: 'anywhere',
                      }}
                    >
                      {message.text}
                    </pre>
                  ) : viewMode === 'raw' ? (
                    <pre 
                      className="whitespace-pre-wrap text-slate-600 dark:text-slate-400 font-mono text-xs break-words overflow-x-hidden bg-slate-50 dark:bg-slate-700/30 p-4 rounded-lg"
                      style={{
                        wordBreak: 'break-all',
                        overflowWrap: 'anywhere',
                      }}
                    >
                      {JSON.stringify(message, null, 2)}
                    </pre>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-slate-600 dark:text-slate-400">
                        {viewMode === 'html' ? 
                          'This email does not contain HTML content' : 
                          'No content available for this view mode'
                        }
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  // Original modal version
  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      style={{ overflow: 'hidden' }} // Prevent body scroll
    >
      <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border border-slate-200/50 dark:border-slate-700/50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200/50 dark:border-slate-700/50 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-violet-400"
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
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-all duration-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50 active:scale-95 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2"
              title="Copy message content"
              disabled={isLoading || !message}
            >
              <Copy className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-violet-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {isLoading ? (
            <div className="p-8 text-center flex-1 flex items-center justify-center">
              <div className="space-y-4">
                <div className="animate-spin w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full mx-auto"></div>
                <p className="text-slate-600 dark:text-slate-400">Loading message...</p>
              </div>
            </div>
          ) : error ? (
            <div className="p-8 text-center flex-1 flex items-center justify-center">
              <div className="space-y-4">
                <div className="p-4 bg-red-100 dark:bg-red-900/20 rounded-2xl inline-block">
                  <Mail className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <p className="text-red-600 dark:text-red-400 font-medium">
                  Failed to load message
                </p>
              </div>
            </div>
          ) : message ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Message Info */}
              <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-700/30 flex-shrink-0">
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
              <div className="flex border-b border-slate-200/50 dark:border-slate-700/50 flex-shrink-0">
                {['html', 'text', 'raw'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode as ViewMode)}
                    className={`px-4 py-2 font-medium transition-all border-b-2 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-inset ${
                      viewMode === mode 
                        ? 'border-violet-600 text-violet-600 dark:text-violet-400' 
                        : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400'
                    }`}
                  >
                    {mode.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Message Content - Scrollable */}
              {/* The following div ensures vertical scrolling for long emails. */}
              <div className="flex-1 overflow-auto p-6" style={{ maxHeight: '50vh' }}>
                <div className="min-h-[200px]">
                  {/* HTML mode with improved rendering and sanitization */}
                  {viewMode === 'html' && message.html && message.html.length > 0 ? (
                    (() => {
                      const htmlContent = sanitizeHTML(message.html.join(''));
                      if (!htmlContent.trim()) {
                        return (
                          <div className="text-center py-8">
                            <p className="text-slate-600 dark:text-slate-400">
                              HTML content is empty or was filtered for security
                            </p>
                          </div>
                        );
                      }
                      return (
                        <div
                          className="max-w-none break-words overflow-wrap-anywhere text-slate-900 dark:text-slate-100"
                          style={{
                            lineHeight: '1.6',
                            wordBreak: 'break-word',
                            overflowWrap: 'anywhere',
                          }}
                          dangerouslySetInnerHTML={{ 
                            __html: htmlContent
                          }}
                        />
                      );
                    })()
                  ) : viewMode === 'text' && message.text ? (
                    <pre 
                      className="whitespace-pre-wrap font-mono text-sm break-words overflow-x-hidden text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-700/30 p-4 rounded-lg"
                      style={{
                        lineHeight: '1.6',
                        wordBreak: 'break-all',
                        overflowWrap: 'anywhere',
                      }}
                    >
                      {message.text}
                    </pre>
                  ) : viewMode === 'raw' ? (
                    <pre 
                      className="whitespace-pre-wrap text-slate-600 dark:text-slate-400 font-mono text-xs break-words overflow-x-hidden bg-slate-50 dark:bg-slate-700/30 p-4 rounded-lg"
                      style={{
                        wordBreak: 'break-all',
                        overflowWrap: 'anywhere',
                      }}
                    >
                      {JSON.stringify(message, null, 2)}
                    </pre>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-slate-600 dark:text-slate-400">
                        {viewMode === 'html' ? 
                          'This email does not contain HTML content' : 
                          'No content available for this view mode'
                        }
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