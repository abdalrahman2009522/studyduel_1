import React from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, Coins, Sparkles, Check, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SHOP_ITEMS } from '../lib/gameLogic';
import { db } from '../lib/firebase';
import { doc, updateDoc, arrayUnion, increment } from 'firebase/firestore';

export function Shop() {
  const { profile, user } = useAuth();
  const [buying, setBuying] = React.useState<string | null>(null);

  const handlePurchase = async (item: typeof SHOP_ITEMS[0]) => {
    if (!user || !profile || (profile.stats.points || 0) < item.price || buying) return;

    setBuying(item.id);
    try {
      const userRef = doc(db, 'users', user.uid);
      const inventoryKey = item.type === 'frame' ? 'inventory.frames' : 'inventory.effects';
      
      await updateDoc(userRef, {
        [inventoryKey]: arrayUnion(item.id),
        'stats.points': increment(-item.price)
      });
    } catch (err) {
      console.error("Purchase failed:", err);
    } finally {
      setBuying(null);
    }
  };

  const hasItem = (itemId: string, type: string) => {
    if (!profile?.inventory) return false;
    const list = type === 'frame' ? profile.inventory.frames : profile.inventory.effects;
    return list?.includes(itemId);
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="text-right">
          <h1 className="text-4xl font-black text-text-main arabic-text mb-2 transition-colors duration-300">المتجر التجميلي 🛍️</h1>
          <p className="text-text-muted arabic-text font-bold transition-colors duration-300">استبدل نقاطك بإطارات وتأثيرات مميزة لملفك الشخصي</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/10 px-6 py-3 rounded-2xl flex items-center gap-3 border-2 border-amber-100 dark:border-amber-900/20 transition-colors duration-300">
           <Coins className="text-amber-600" />
           <span className="text-xl font-black text-amber-700 dark:text-amber-400">{profile?.stats.points || 0}</span>
           <span className="text-[10px] font-black arabic-text text-amber-600 uppercase">نقطة</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {SHOP_ITEMS.map((item, idx) => {
          const owned = hasItem(item.id, item.type);
          const canAfford = (profile?.stats.points || 0) >= item.price;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-surface p-6 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group transition-colors duration-300"
            >
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-150 transition-transform">
                <ShoppingBag size={100} />
              </div>
              
              <div className="w-full aspect-square rounded-[32px] mb-6 flex items-center justify-center p-8 transition-transform group-hover:rotate-3 bg-slate-50 dark:bg-slate-900 relative">
                {item.type === 'effect' && (
                  <div className={`w-32 h-32 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center relative overflow-hidden ${item.image}`}>
                     <Sparkles className="text-primary/20" size={40} />
                  </div>
                )}
                {item.type === 'frame' && (
                  <div className={`w-32 h-32 rounded-full border-4 border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center ${item.image}`}>
                     <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800" />
                  </div>
                )}
              </div>

              <div className="text-right space-y-2 mb-8">
                <span className="text-[10px] font-black arabic-text text-primary uppercase tracking-widest bg-blue-50 dark:bg-blue-900/10 px-3 py-1 rounded-full">
                   {item.type === 'frame' ? 'إطار بروفايل' : 'تأثير بروفايل'}
                </span>
                <h3 className="text-xl font-black arabic-text text-text-main transition-colors duration-300">{item.nameAr}</h3>
              </div>

              <button
                onClick={() => handlePurchase(item)}
                disabled={owned || !canAfford || !!buying}
                className={`w-full py-4 rounded-2xl font-black arabic-text flex items-center justify-center gap-2 transition-all
                  ${owned ? 'bg-green-100 dark:bg-green-900/20 text-green-600' : 
                    canAfford ? 'bg-primary text-white shadow-xl shadow-primary/20 hover:scale-105 active:scale-95' : 
                    'bg-slate-100 dark:bg-slate-800 text-text-muted cursor-not-allowed'}
                `}
              >
                {buying === item.id ? 'جاري الشراء...' : owned ? (<><Check size={20} /> تم الامتلاك</>) : (<><Coins size={20} /> {item.price} نقطة</>)}
              </button>
            </motion.div>
          );
        })}
      </div>

      <div className="bg-gradient-to-br from-indigo-600 to-primary p-12 rounded-[50px] text-white text-center relative overflow-hidden">
         <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" 
         />
         <Sparkles className="mx-auto mb-6 opacity-80" size={48} />
         <h2 className="text-3xl font-black arabic-text mb-4">قريباً: تطور الشخصيات! ⚡</h2>
         <p className="text-white/70 arabic-text text-xl max-w-xl mx-auto leading-relaxed">
            نحن نعمل على نظام كامل لتطور الشخصيات حيث يمكنك اختيار بطلك وتطويره والحصول على دروع وأدوات أسطورية مع كل فوز.
         </p>
      </div>
    </div>
  );
}
