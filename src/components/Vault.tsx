import React from 'react';
import { motion } from 'motion/react';
import { Archive, Check, User, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { SHOP_ITEMS } from '../lib/gameLogic';
import { soundManager } from '../lib/soundManager';

export function Vault() {
  const { user, profile } = useAuth();
  
  if (!profile || !user) return null;

  const inventory = profile.inventory || { frames: [], effects: [], activeFrame: '', activeEffect: '' };
  
  // Aggregate items
  const frameItems = (inventory.frames || []).map(id => SHOP_ITEMS.find(item => item.id === id)).filter(Boolean);
  const effectItems = (inventory.effects || []).map(id => SHOP_ITEMS.find(item => item.id === id)).filter(Boolean);
  
  const handleEquip = async (type: 'frame' | 'effect', itemId: string) => {
    soundManager.playClick();
    try {
      const field = type === 'frame' ? 'inventory.activeFrame' : 'inventory.activeEffect';
      // if equipping same, unequip instead
      const isEquipped = type === 'frame' ? inventory.activeFrame === itemId : inventory.activeEffect === itemId;
      await updateDoc(doc(db, 'users', user.uid), {
        [field]: isEquipped ? null : itemId
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="text-right mb-8">
        <h1 className="text-4xl font-black text-text-main arabic-text mb-2 flex items-center flex-row-reverse gap-3 justify-start transition-colors duration-300">
          الخزنة 
          <Archive className="text-primary" size={36} />
        </h1>
        <p className="text-text-muted arabic-text font-bold transition-colors duration-300">خزنتك الخاصة للإطارات والتأثيرات المميزة</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Frames Section */}
        <div className="bg-surface p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-300">
          <h2 className="text-xl font-black arabic-text text-text-main mb-6 text-right border-b dark:border-slate-800 pb-4">الإطارات</h2>
          {frameItems.length === 0 ? (
            <p className="text-text-muted arabic-text text-center py-4">لم تقم بشراء أي إطارات بعد</p>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {frameItems.map((item: any) => {
                const isEquipped = inventory.activeFrame === item.id;
                return (
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    key={item.id} 
                    className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${isEquipped ? 'border-primary bg-primary/5' : 'border-slate-100 dark:border-slate-800'}`}
                  >
                    <div className={`w-16 h-16 rounded-2xl ${item.image} flex items-center justify-center relative shadow-lg`}>
                       <div className="w-10 h-10 bg-slate-50 dark:bg-slate-900 rounded-full" />
                       {isEquipped && <Check className="absolute -top-2 -right-2 bg-primary text-white rounded-full p-0.5" size={20} />}
                    </div>
                    <span className="font-bold text-text-main arabic-text text-sm">{item.nameAr}</span>
                    <button 
                      onClick={() => handleEquip('frame', item.id)}
                      className={`w-full py-1.5 rounded-lg text-xs font-bold arabic-text transition-all ${isEquipped ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-text-muted hover:bg-slate-200'}`}
                    >
                      {isEquipped ? 'إلغاء التجهيز' : 'تجهيز'}
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Effects Section */}
        <div className="bg-surface p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-300">
          <h2 className="text-xl font-black arabic-text text-text-main mb-6 text-right border-b dark:border-slate-800 pb-4">التأثيرات</h2>
          {effectItems.length === 0 ? (
            <p className="text-text-muted arabic-text text-center py-4">لم تقم بشراء أي تأثيرات بعد</p>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {effectItems.map((item: any) => {
                const isEquipped = inventory.activeEffect === item.id;
                return (
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    key={item.id} 
                    className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${isEquipped ? 'border-primary bg-primary/5' : 'border-slate-100 dark:border-slate-800'}`}
                  >
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center relative bg-slate-100 dark:bg-slate-800 ${item.image}`}>
                       <Sparkles className="text-primary/40" />
                       {isEquipped && <Check className="absolute -top-2 -right-2 bg-primary text-white rounded-full p-0.5" size={20} />}
                    </div>
                    <span className="font-bold text-text-main arabic-text text-sm">{item.nameAr}</span>
                    <button 
                      onClick={() => handleEquip('effect', item.id)}
                      className={`w-full py-1.5 rounded-lg text-xs font-bold arabic-text transition-all ${isEquipped ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-text-muted hover:bg-slate-200'}`}
                    >
                      {isEquipped ? 'إلغاء التجهيز' : 'تجهيز'}
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
