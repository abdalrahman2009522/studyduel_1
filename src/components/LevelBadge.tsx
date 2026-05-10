import React from 'react';
import { Award } from 'lucide-react';
import { LEVEL_REWARDS } from '../lib/gameLogic';

interface LevelBadgeProps {
  level: number;
  showBadge?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LevelBadge({ level, showBadge = true, className = '', size = 'md' }: LevelBadgeProps) {
  const isVeteran = level >= 30;

  const sizeClasses = {
    sm: 'text-[8px] sm:text-[9px] px-1.5 py-0 min-w-[32px]',
    md: 'text-[10px] sm:text-xs px-2 py-0.5',
    lg: 'text-xs sm:text-sm px-3 py-1'
  };

  const badgeSizeClasses = {
    sm: 'w-3.5 h-3.5 text-[8px]',
    md: 'w-5 h-5 text-xs',
    lg: 'w-6 h-6 text-sm'
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className={`
        flex items-center justify-center rounded-lg font-black shadow-sm border
        ${sizeClasses[size]}
        ${level >= 50 ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white border-red-400' : 
          level >= 40 ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-400' : 
          level >= 30 ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white border-yellow-300' : 
          level >= 20 ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-indigo-300' : 
          'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'}
      `}>
        Lvl {level}
      </div>
      {isVeteran && showBadge && (
        <div className={`flex items-center justify-center rounded-full bg-amber-100 border border-amber-300 shadow-sm animate-pulse ${badgeSizeClasses[size]}`} title={LEVEL_REWARDS.BADGE_LVL_30.nameAr}>
          <span>{LEVEL_REWARDS.BADGE_LVL_30.icon}</span>
        </div>
      )}
    </div>
  );
}
