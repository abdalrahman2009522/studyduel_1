import React from 'react';
import { motion } from 'motion/react';
import { LogIn, GraduationCap } from 'lucide-react';
import { loginWithGoogle } from '../lib/firebase';

export function Login() {
  const [loading, setLoading] = React.useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-primary flex items-center justify-center p-6 overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-secondary/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-400/20 rounded-full blur-[100px]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[40px] p-8 md:p-12 shadow-2xl relative z-10 text-center"
      >
        <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center text-white mx-auto mb-8 shadow-xl shadow-primary/20">
          <GraduationCap size={48} />
        </div>

        <h1 className="text-3xl font-black arabic-text text-text-main mb-4">Study Duel ⚔️</h1>
        <p className="text-text-muted arabic-text mb-10 leading-relaxed">
          انضم إلى أقوى مجتمع طلابي في الأردن ونافس زملائك في تحديات تعليمية ممتعة!
        </p>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-100 py-4 rounded-2xl font-bold hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-6 h-6" />
          <span className="text-slate-700">تسجيل الدخول عبر جوجل</span>
          {loading && <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin ml-2" />}
        </button>

        <p className="mt-8 text-xs text-text-muted arabic-text opacity-70">
          بالتسجيل، أنت توافق على شروط الخدمة وسياسة الخصوصية
        </p>
      </motion.div>
    </div>
  );
}
