import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, ArrowRight, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { soundManager } from '../lib/soundManager';

export function MFAVerification() {
  const { verifyMFA, profile } = useAuth();
  const [code, setCode] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;

    setLoading(true);
    setError('');
    
    try {
      const success = await verifyMFA(code);
      if (success) {
        soundManager.playPowerUp();
      } else {
        setError('رمز التحقق غير صحيح. حاول مرة أخرى.');
        soundManager.playClick();
      }
    } catch (err) {
      setError('حدث خطأ أثناء التحقق.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center p-6 z-[100]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[40px] p-8 md:p-12 shadow-2xl text-center transition-colors duration-300"
      >
        <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mx-auto mb-8">
          <ShieldCheck size={48} />
        </div>

        <h2 className="text-2xl font-black arabic-text text-slate-800 dark:text-white mb-2">التحقق بخطوتين 🔐</h2>
        <p className="text-slate-500 arabic-text mb-8">
          تم إرسال رمز التحقق إلى بريدك الإلكتروني:
          <br />
          <span className="font-bold text-slate-700 dark:text-slate-200">{profile?.email}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center gap-2" dir="ltr">
            <input
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-4 text-center text-3xl font-black tracking-[0.5em] focus:border-primary focus:bg-white dark:focus:bg-slate-700 outline-none transition-all dark:text-white placeholder:text-slate-400/50"
            />
          </div>

          {error && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-500 text-xs font-bold arabic-text"
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full flex items-center justify-center gap-3 bg-primary text-white py-4 rounded-2xl font-bold arabic-text shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 disabled:opacity-50 transition-all font-black"
          >
            {loading ? <RefreshCw className="animate-spin" /> : 'تحقق الآن'}
          </button>
        </form>

        <p className="mt-8 text-xs text-slate-400 arabic-text font-bold">
          لم يصلك الرمز؟ <button className="text-primary hover:underline">إعادة الإرسال</button>
        </p>

        <div className="mt-6 pt-6 border-t border-slate-100 italic text-[10px] text-slate-300 arabic-text">
          * للمراجعة: الرمز التجريبي هو 123456
        </div>
      </motion.div>
    </div>
  );
}
