import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, X, Check, Trophy } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { SUBJECTS } from '../types';

import { soundManager } from '../lib/soundManager';

export function ChallengeNotification() {
  const { incomingChallenge, outgoingChallenge, acceptChallenge, rejectChallenge, cancelChallenge } = useSocket();

  React.useEffect(() => {
    if (incomingChallenge) {
      soundManager.playOpponentFound();
    }
  }, [incomingChallenge]);

  if (!incomingChallenge && !outgoingChallenge) return null;

  if (outgoingChallenge) {
    const subject = SUBJECTS.find(s => s.id === outgoingChallenge.subjectId);
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed bottom-6 right-6 z-[200] w-full max-w-sm"
        >
          <div className="bg-slate-900 border border-white/10 rounded-[32px] p-6 shadow-2xl overflow-hidden relative">
            <div className="relative z-10">
              <div className="flex flex-row-reverse items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg animate-pulse">
                  <Trophy size={28} />
                </div>
                <div className="text-right">
                  <h3 className="text-lg font-black text-white arabic-text">في انتظار المنافس... ⏳</h3>
                  <p className="text-slate-400 text-xs font-bold arabic-text mt-1">دعوة {outgoingChallenge.displayName}</p>
                </div>
              </div>
              <div className="bg-white/5 rounded-2xl p-4 flex flex-row-reverse items-center gap-4 mb-6 border border-white/5">
                <img src={outgoingChallenge.photoURL} className="w-12 h-12 rounded-xl" alt="Avatar" />
                <div className="text-right flex-1">
                  <p className="text-white font-black arabic-text text-sm">{outgoingChallenge.displayName}</p>
                  <p className="text-[10px] text-slate-400 font-bold arabic-text">مادة {subject?.nameAr || 'عامة'}</p>
                </div>
              </div>
              <button
                onClick={() => cancelChallenge(outgoingChallenge.socketId)}
                className="w-full py-4 bg-red-500/10 text-red-500 rounded-2xl font-black arabic-text text-sm hover:bg-red-500/20 transition-all border border-red-500/20"
              >
                إلغاء التحدي
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  const subject = SUBJECTS.find(s => s.id === incomingChallenge.subjectId);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed bottom-6 right-6 z-[200] w-full max-w-sm"
      >
        <div className="bg-slate-900 border border-white/10 rounded-[32px] p-6 shadow-2xl overflow-hidden relative group">
          {/* Animated Background Decor */}
          <motion.div 
            animate={{ 
              rotate: 360,
              scale: [1, 1.2, 1]
            }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl"
          />
          
          <div className="relative z-10">
            <div className="flex flex-row-reverse items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20 animate-pulse">
                <Zap size={28} />
              </div>
              <div className="text-right">
                <h3 className="text-lg font-black text-white arabic-text">تحدي جديد وارد! ⚔️</h3>
                <p className="text-slate-400 text-xs font-bold arabic-text mt-1">دعوة للمنافسة الآن</p>
              </div>
            </div>

            <div className="bg-white/5 rounded-2xl p-4 flex flex-row-reverse items-center gap-4 mb-6 border border-white/5">
              <img 
                src={incomingChallenge.from.photoURL} 
                className="w-12 h-12 rounded-xl border-2 border-white/10" 
                alt="Avatar" 
              />
              <div className="text-right flex-1">
                <p className="text-white font-black arabic-text text-sm">{incomingChallenge.from.displayName}</p>
                <div className="flex flex-row-reverse items-center gap-2 mt-1">
                  <span className={`w-2 h-2 rounded-full ${subject?.color || 'bg-primary'}`} />
                  <p className="text-[10px] text-slate-400 font-bold arabic-text">يتحدى في مادة {subject?.nameAr || 'عامة'}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => rejectChallenge(incomingChallenge.from.socketId)}
                className="flex-1 py-4 bg-white/5 text-white rounded-2xl font-black arabic-text text-sm hover:bg-white/10 transition-all border border-white/5 flex items-center justify-center gap-2"
              >
                <X size={18} />
                رفض
              </button>
              <button
                onClick={() => acceptChallenge(incomingChallenge.from.socketId, incomingChallenge.subjectId)}
                className="flex-[2] py-4 bg-primary text-white rounded-2xl font-black arabic-text text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Check size={18} />
                قبول التحدي
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
