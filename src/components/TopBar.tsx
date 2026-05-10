import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Award, Star, Flame } from 'lucide-react';
import { calculateLevel } from '../lib/gameLogic';
import { LevelBadge } from './LevelBadge';

export function TopBar() {
  const { profile } = useAuth();

  if (!profile) return null;

  const currentLevel = calculateLevel(profile.stats.xp);

  return (
    <div className="fixed top-0 left-0 right-0 z-[45] bg-white/7 backdrop-blur-xl border-b border-slate-100 h-14 pointer-events-none lg:h-16 lg:left-0">
      <div className="h-full max-w-7xl mx-auto px-4 flex flex-row-reverse items-center justify-between pointer-events-auto">
        <div className="flex flex-row-reverse items-center gap-2 sm:gap-3">
          <div className="flex flex-row-reverse items-center gap-1.5 bg-amber-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl border border-amber-100 shadow-sm shadow-amber-500/5 transition-all hover:scale-105">
            <Sparkles size={14} className="text-amber-500" />
            <div className="flex flex-col items-end leading-none">
              <span className="text-[7px] sm:text-[8px] font-black arabic-text text-amber-600 uppercase tracking-tighter mb-0.5">النقاط</span>
              <span className="text-[10px] sm:text-xs font-black text-slate-800 tabular-nums">{profile.stats.points.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex flex-row-reverse items-center gap-1.5 bg-blue-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl border border-blue-100 shadow-sm shadow-primary/5 transition-all hover:scale-105">
            <Star size={14} className="text-primary" />
            <div className="flex flex-col items-end leading-none">
              <span className="text-[7px] sm:text-[8px] font-black arabic-text text-primary uppercase tracking-tighter mb-0.5">الخبرة</span>
              <span className="text-[10px] sm:text-xs font-black text-slate-800 tabular-nums">{profile.stats.xp.toLocaleString()} XP</span>
            </div>
          </div>

          {profile.stats.streak > 0 && (
            <div className="flex flex-row-reverse items-center gap-1.5 bg-orange-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl border border-orange-100 shadow-sm shadow-orange-500/5 transition-all hover:scale-105 animate-pulse">
              <Flame size={14} className="text-orange-500" fill="currentColor" />
              <div className="flex flex-col items-end leading-none">
                <span className="text-[7px] sm:text-[8px] font-black arabic-text text-orange-600 uppercase tracking-tighter mb-0.5">سلسلة</span>
                <span className="text-[10px] sm:text-xs font-black text-slate-800 tabular-nums">{profile.stats.streak}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-row-reverse items-center gap-4">
          <div className="flex flex-row-reverse items-center gap-2">
             <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-black text-lg shadow-lg rotate-3">S</div>
             <span className="text-sm sm:text-lg font-black text-primary arabic-text">ستادي دويل</span>
          </div>

          <div className="hidden xs:flex flex-row-reverse items-center gap-3 bg-slate-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl border border-slate-100">
             <LevelBadge level={currentLevel} />
             <div className="hidden sm:block text-right">
                <div className="w-12 sm:w-16 h-1 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${(profile.stats.xp % 1000) / 10}%` }}></div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
