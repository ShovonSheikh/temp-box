import React from 'react';

interface AnimatedProgressBarProps {
  progress: number; // 0-100
  timeLeft: number; // in seconds
  className?: string;
}

export function AnimatedProgressBar({ progress, timeLeft, className = '' }: AnimatedProgressBarProps) {
  const getColorClass = () => {
    if (timeLeft > 300) return 'bg-green-400'; // > 5 minutes
    if (timeLeft > 120) return 'bg-yellow-400'; // > 2 minutes
    return 'bg-red-400'; // <= 2 minutes
  };

  const getPulseClass = () => {
    if (timeLeft <= 120) return 'animate-pulse'; // Pulse when critical
    return '';
  };

  return (
    <div className={`w-32 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden ${className}`} title="Timer progress">
      <div
        className={`h-2 transition-all duration-500 ease-out ${getColorClass()} ${getPulseClass()}`}
        style={{
          width: `${Math.max(0, Math.min(100, progress))}%`,
          boxShadow: timeLeft <= 120 ? '0 0 8px rgba(248, 113, 113, 0.6)' : undefined,
        }}
      />
    </div>
  );
}