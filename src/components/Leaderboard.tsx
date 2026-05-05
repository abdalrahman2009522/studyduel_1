import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Medal, Crown, Star, ArrowUp } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { AppUser } from '../types';
import { ProfileAvatar } from './ProfileAvatar';

export function Leaderboard() {
  const [players, setPlayers] = React.useState<AppUser[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const q = query(
          collection(db, 'users'),
          orderBy('stats.xp', 'desc'),
          limit(10)
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => doc.data() as AppUser);
        setPlayers(data);
      } catch (err) {
        console.error("Leaderboard fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (players.length < 3) {
    return (
      <div className="text-center py-20">
        <Trophy size={64} className="mx-auto text-text-muted/20 mb-6" />
        <h2 className="text-2xl font-black arabic-text text-text-main">قاعة المشاهير قيد التجهيز</h2>
        <p className="text-text-muted arabic-text mt-2">يجب وجود 3 لاعبين على الأقل لتفعيل القاعة</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-12 px-6">
      <div className="text-center mb-16 space-y-4">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="inline-flex items-center gap-3 bg-amber-500/10 text-amber-600 px-6 py-2 rounded-full border border-amber-500/20 shadow-xl shadow-amber-500/5 mb-4"
        >
          <Star size={20} fill="currentColor" />
          <span className="font-black arabic-text uppercase tracking-widest text-sm">أبطال الموسم</span>
          <Star size={20} fill="currentColor" />
        </motion.div>
        <h1 className="text-5xl md:text-6xl font-black arabic-text text-text-main tracking-tight transition-colors duration-300">قاعة المشاهير 🏆</h1>
        <p className="text-text-muted arabic-text text-xl font-medium max-w-2xl mx-auto leading-relaxed transition-colors duration-300">
          هؤلاء هم النخبة الذين سيطروا على ساحة المنافسة هذا الأسبوع. هل لديك ما يلزم لتكون بينهم؟
        </p>
      </div>

      {/* Top 3 Podium - Gaming Aesthetic */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end mb-16 max-w-4xl mx-auto">
        {/* 2nd Place */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center order-2 md:order-1"
        >
          <div className="relative group mb-6">
            <div className="absolute -inset-1 bg-slate-300 rounded-full blur opacity-50"></div>
            <ProfileAvatar 
              uid={players[1].uid}
              photoURL={players[1].photoURL}
              inventory={players[1].inventory}
              size="lg"
            />
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-slate-400 rounded-2xl flex items-center justify-center text-white border-4 border-white shadow-lg z-20">
              <Medal size={20} />
            </div>
          </div>
          <div className="w-full bg-surface rounded-[32px] p-8 text-center border-b-8 border-slate-200 dark:border-slate-800 shadow-xl shadow-primary/5 transition-colors duration-300">
            <h3 className="font-black text-xl arabic-text text-text-main mb-1 transition-colors duration-300">{players[1].displayName}</h3>
            <div className="flex flex-col gap-1">
               <span className="text-text-muted font-black text-sm transition-colors duration-300">{players[1].stats.xp} XP</span>
               <span className="text-text-main/60 font-black text-xs arabic-text transition-colors duration-300">{players[1].stats.wins} انتصار</span>
            </div>
          </div>
        </motion.div>

        {/* 1st Place */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col items-center order-1 md:order-2"
        >
          <div className="relative group mb-8 scale-110">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
              className="absolute -inset-4 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 rounded-full blur-xl opacity-40 z-0"
            />
            <ProfileAvatar 
              uid={players[0].uid}
              photoURL={players[0].photoURL}
              inventory={players[0].inventory}
              size="xl"
              className="relative z-10"
            />
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-30">
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <Crown size={48} className="text-amber-500 drop-shadow-lg" fill="#F59E0B" />
              </motion.div>
            </div>
            <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white border-4 border-white shadow-lg">
              <Trophy size={24} />
            </div>
          </div>
          <div className="w-full bg-slate-900 rounded-[40px] p-10 text-center border-b-8 border-amber-500 shadow-2xl shadow-amber-500/20 text-white transform -translate-y-2">
            <h3 className="font-black text-2xl arabic-text text-white mb-2">{players[0].displayName}</h3>
            <div className="flex flex-col gap-1">
               <span className="text-amber-400 font-extrabold text-lg">{players[0].stats.xp} XP</span>
               <span className="text-slate-400 font-black text-sm arabic-text">{players[0].stats.wins} انتصار</span>
            </div>
          </div>
        </motion.div>

        {/* 3rd Place */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col items-center order-3"
        >
          <div className="relative group mb-6">
            <div className="absolute -inset-1 bg-amber-700 rounded-full blur opacity-30"></div>
            <ProfileAvatar 
              uid={players[2].uid}
              photoURL={players[2].photoURL}
              inventory={players[2].inventory}
              size="lg"
            />
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-amber-700 rounded-2xl flex items-center justify-center text-white border-4 border-white shadow-lg z-20">
              <Medal size={20} />
            </div>
          </div>
          <div className="w-full bg-surface rounded-[32px] p-8 text-center border-b-8 border-amber-700 shadow-xl shadow-amber-700/10 transition-colors duration-300">
            <h3 className="font-black text-xl arabic-text text-text-main mb-1 transition-colors duration-300">{players[2].displayName}</h3>
            <div className="flex flex-col gap-1">
               <span className="text-text-muted font-black text-sm transition-colors duration-300">{players[2].stats.xp} XP</span>
               <span className="text-text-main/60 font-black text-xs arabic-text transition-colors duration-300">{players[2].stats.wins} انتصار</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* List */}
      <div className="bg-surface rounded-[40px] shadow-2xl shadow-primary/5 border border-slate-100 dark:border-slate-800 overflow-hidden max-w-4xl mx-auto transition-colors duration-300">
        <div className="bg-slate-50 dark:bg-slate-900/50 px-8 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-row-reverse items-center justify-between text-[10px] font-black arabic-text text-text-muted uppercase tracking-widest transition-colors duration-300">
           <div className="flex-1 text-right flex flex-row-reverse gap-8 px-6">
              <span className="w-20">النقاط</span>
              <span className="w-20">الانتصارات</span>
           </div>
           <span className="flex-1 text-right px-12">الطالب</span>
           <span className="w-12 text-center">الترتيب</span>
        </div>
        {players.slice(3).map((player, i) => (
          <motion.div 
            key={player.uid} 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + i * 0.1 }}
            className="flex flex-row-reverse items-center justify-between p-6 border-b border-slate-50 dark:border-slate-800 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-all group"
          >
            <div className="flex-1 flex flex-row-reverse gap-8 px-6">
               <span className="w-20 text-right font-black text-primary font-mono text-lg">{player.stats.xp}</span>
               <span className="w-20 text-right font-black text-text-muted font-mono text-lg transition-colors duration-300">{player.stats.wins}</span>
            </div>
            
            <div className="flex-1 flex flex-row-reverse items-center gap-4 px-6 text-right">
              <ProfileAvatar 
                uid={player.uid}
                photoURL={player.photoURL}
                inventory={player.inventory}
                size="md"
              />
              <div>
                <div className="font-black arabic-text text-text-main text-lg transition-colors duration-300">{player.displayName}</div>
                <div className="flex items-center flex-row-reverse gap-1 text-[10px] text-green-500 font-black uppercase">
                   <ArrowUp size={10} />
                   <span>+2 مركز</span>
                </div>
              </div>
            </div>

            <div className="w-12 flex items-center justify-center">
               <span className="text-xl font-black text-text-muted/20 group-hover:text-primary transition-colors duration-300">#{i + 4}</span>
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="mt-12 text-center">
         <button className="bg-slate-900 text-white px-10 py-5 rounded-[32px] font-black arabic-text text-xl shadow-2xl shadow-slate-900/20 hover:scale-105 active:scale-95 transition-all">
            ابدأ طريقك نحو القمة 🚀
         </button>
      </div>
    </div>
  );
}
