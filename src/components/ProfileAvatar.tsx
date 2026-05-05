import React from 'react';
import { SHOP_ITEMS } from '../lib/gameLogic';

interface ProfileAvatarProps {
  photoURL?: string;
  uid?: string;
  inventory?: {
    activeFrame?: string;
    activeEffect?: string;
  };
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function ProfileAvatar({ photoURL, uid, inventory, size = 'md', className = '' }: ProfileAvatarProps) {
  const activeFrame = inventory?.activeFrame ? SHOP_ITEMS.find(i => i.id === inventory.activeFrame)?.image : '';
  const activeEffect = inventory?.activeEffect ? SHOP_ITEMS.find(i => i.id === inventory.activeEffect)?.image : '';

  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-24 h-24',
    xl: 'w-48 h-48',
  };

  // Adjust ring/border size based on avatar size
  const ringSize = {
    xs: 'ring-1',
    sm: 'ring-2',
    md: 'ring-4',
    lg: 'ring-8',
    xl: 'ring-[12px]',
  };

  return (
    <div className={`relative inline-block ${sizeClasses[size]} ${className}`}>
      {/* Profile Effect */}
      {activeEffect && (
        <div className={`absolute inset-0 rounded-full z-0 pointer-events-none scale-110 ${activeEffect}`} />
      )}
      
      {/* Frame and Image */}
      <div className={`
        relative w-full h-full rounded-full z-10 transition-all flex items-center justify-center p-0.5
        ${activeFrame ? `${ringSize[size]} ring-offset-2 dark:ring-offset-slate-900 shadow-xl ${activeFrame}` : 'bg-slate-200 dark:bg-slate-700'}
      `}>
        <img 
          src={photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid || 'default'}`} 
          alt="Avatar" 
          className="w-full h-full rounded-full object-cover bg-surface shadow-inner" 
        />
      </div>
    </div>
  );
}
