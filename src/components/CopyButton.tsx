import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyButtonProps {
  onCopy: () => void;
  className?: string;
  title?: string;
  size?: number;
}

export function CopyButton({ 
  onCopy, 
  className = '', 
  title = 'Copy to clipboard',
  size = 20 
}: CopyButtonProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    onCopy();
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`p-2 text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-all duration-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50 active:scale-95 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 ${className}`}
      title={isCopied ? 'Copied!' : title}
    >
      {isCopied ? (
        <div className="flex items-center space-x-1">
          <Check className={`w-${size/4} h-${size/4} text-green-600 dark:text-green-400`} />
          <span className="text-xs text-green-600 dark:text-green-400 font-medium">Copied!</span>
        </div>
      ) : (
        <Copy className={`w-${size/4} h-${size/4}`} />
      )}
    </button>
  );
}