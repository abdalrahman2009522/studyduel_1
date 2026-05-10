import { AppUser } from '../types.ts';

export const XP_PER_LEVEL = 1000;

export const LEVEL_REWARDS = {
  FRAME_LVL_20: {
    id: 'lvl_20_frame',
    nameAr: 'إطار النخبة',
    image: 'bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 animation-gradient-x'
  },
  BADGE_LVL_30: {
    id: 'lvl_30_badge',
    nameAr: 'وسام المخضرم',
    icon: '🛡️'
  }
};

export function calculateLevel(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

export function getRank(stats: any): string {
  const { wins, level } = stats;
  if (wins >= 500 && level >= 50) return 'Master';
  if (wins >= 250 && level >= 40) return 'Diamond';
  if (wins >= 100 && level >= 30) return 'Platinum';
  if (wins >= 50 && level >= 20) return 'Gold';
  if (wins >= 10 && level >= 10) return 'Silver';
  return 'Bronze';
}

export const ACHIEVEMENTS_LIST = [
  { id: 'first_win', nameAr: 'الفوز الأول', descriptionAr: 'حقق أول فوز لك في مبارزة', icon: '🏆', xpReward: 100 },
  { id: 'win_10', nameAr: 'عشرة انتصارات', descriptionAr: 'حقق 10 انتصارات', icon: '🎖️', xpReward: 500 },
  { id: 'fast_answer', nameAr: 'جواب البرق', descriptionAr: 'أجب على سؤال في أقل من ثانيتين', icon: '⚡', xpReward: 200 },
  { id: 'challenges_100', nameAr: 'المحارب المخضرم', descriptionAr: 'أكمل 100 تحدي', icon: '⚔️', xpReward: 1000 },
];

export const SHOP_ITEMS = [
  { id: 'effect_glow', nameAr: 'توهج أسطوري', type: 'effect', price: 1000, image: 'animate-pulse ring-4 ring-primary ring-offset-2' },
  { id: 'effect_fire', nameAr: 'نار مشتعلة', type: 'effect', price: 1500, image: 'shadow-[0_0_20px_#ff4d4d] border-red-500' },
  { id: 'effect_frost', nameAr: 'جليد بارد', type: 'effect', price: 1200, image: 'shadow-[0_0_20px_#00d4ff] border-blue-400' },
  { id: 'effect_rainbow', nameAr: 'طيف قزحي', type: 'effect', price: 2000, image: 'animate-bounce ring-4 ring-gradient-to-r from-red-500 via-green-500 to-blue-500' },
  { id: 'golden_frame', nameAr: 'إطار ذهبي', type: 'frame', price: 500, image: 'bg-gradient-to-r from-yellow-400 to-amber-600' },
  { id: 'neon_icon', nameAr: 'أيقونة نيون (إطار)', type: 'frame', price: 300, image: 'shadow-[0_0_15px_#00f2ff]' },
  { id: 'diamond_frame', nameAr: 'إطار الماسي', type: 'frame', price: 800, image: 'bg-gradient-to-r from-cyan-300 to-blue-500' },
];
