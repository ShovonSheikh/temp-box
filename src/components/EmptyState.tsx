import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  button?: React.ReactNode;
  className?: string;
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  button, 
  className = '' 
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}>
      <div className="w-16 h-16 bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 rounded-2xl flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-violet-600 dark:text-violet-400" />
      </div>
      <h3 className="text-lg font-display font-semibold text-slate-800 dark:text-slate-200 mb-2">
        {title}
      </h3>
      <p className="text-slate-600 dark:text-slate-400 max-w-md leading-relaxed mb-4">
        {description}
      </p>
      {button && (
        <div className="mt-2">
          {button}
        </div>
      )}
    </div>
  );
}