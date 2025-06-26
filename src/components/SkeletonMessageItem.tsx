import React from 'react';

export function SkeletonMessageItem() {
  return (
    <div className="p-4 border-b border-slate-200/50 dark:border-slate-700/50 animate-pulse">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          {/* Sender name skeleton */}
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32"></div>
          {/* Subject skeleton */}
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-48"></div>
          {/* Intro skeleton */}
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-64"></div>
        </div>
        <div className="flex flex-col items-end space-y-2">
          {/* Time skeleton */}
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
          {/* Unread indicator skeleton */}
          <div className="w-2 h-2 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}