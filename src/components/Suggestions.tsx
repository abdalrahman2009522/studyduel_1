import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Send, Lightbulb, MessageSquare, Star, Sparkles, Trash2 } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, deleteDoc, doc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { soundManager } from '../lib/soundManager';
import { toast } from 'react-hot-toast';

export function Suggestions() {
  const { profile, isAdmin } = useAuth();
  const [suggestion, setSuggestion] = useState('');
  const [category, setCategory] = useState('feature');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'suggestions'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSuggestions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestion.trim() || !profile) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'suggestions'), {
        userId: profile.uid,
        userName: profile.displayName,
        text: suggestion,
        category,
        timestamp: serverTimestamp(),
        status: 'pending'
      });
      setSuggestion('');
      setSubmitted(true);
      soundManager.playClick();
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء إرسال الاقتراح');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (sId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الاقتراح؟')) return;
    try {
       await deleteDoc(doc(db, 'suggestions', sId));
       toast.success('تم حذف الاقتراح');
    } catch (err) {
       console.error(err);
       toast.error('حدث خطأ أثناء حذف الاقتراح');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="text-right">
        <h1 className="text-4xl font-black text-slate-800 dark:text-white arabic-text mb-2 tracking-tight transition-colors">صندوق الاقتراحات 💡</h1>
        <p className="text-slate-500 dark:text-slate-400 arabic-text font-bold text-lg transition-colors">شاركنا أفكارك لنجعل "ستادي دويل" أفضل منصة للطلاب</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] shadow-xl shadow-primary/5 border border-slate-100 dark:border-slate-800">
            {submitted ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12 text-center space-y-4"
              >
                <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Sparkles size={40} />
                </div>
                <h3 className="text-2xl font-black arabic-text text-slate-800 dark:text-white">شكراً لك! ✨</h3>
                <p className="text-slate-500 dark:text-slate-400 arabic-text font-bold">لقد استلمنا اقتراحك وسنقوم بدراسته بعناية.</p>
                <button 
                  onClick={() => setSubmitted(false)}
                  className="mt-6 px-8 py-3 bg-slate-100 text-slate-600 rounded-2xl font-black arabic-text hover:bg-slate-200 transition-all"
                >
                  إرسال اقتراح آخر
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                   <label className="block text-right text-sm font-black text-slate-400 arabic-text uppercase mb-3 pr-2">نوع الاقتراح</label>
                   <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'feature', label: 'ميزة جديدة', icon: Lightbulb },
                        { id: 'bug', label: 'بلاغ عن خطأ', icon: MessageSquare },
                        { id: 'content', label: 'تحسين المحتوى', icon: Star },
                      ].map(cat => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setCategory(cat.id)}
                          className={`
                            p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all
                            ${category === cat.id ? 'border-primary bg-primary/5 text-primary' : 'border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-100'}
                          `}
                        >
                          <cat.icon size={20} />
                          <span className="text-xs font-black arabic-text">{cat.label}</span>
                        </button>
                      ))}
                   </div>
                </div>

                <div>
                   <label className="block text-right text-sm font-black text-slate-400 arabic-text uppercase mb-3 pr-2">اكتب فكرتك</label>
                   <textarea
                     value={suggestion}
                     onChange={(e) => setSuggestion(e.target.value)}
                     placeholder="اشرح لنا اقتراحك بالتفصيل..."
                     className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-3xl p-6 text-right arabic-text font-bold min-h-[200px] focus:ring-4 focus:ring-primary/10 transition-all text-lg text-slate-900 dark:text-white"
                     required
                   />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !suggestion.trim()}
                  className="w-full py-5 bg-gradient-to-r from-primary to-blue-600 text-white rounded-[24px] font-black arabic-text text-xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
                >
                  {isSubmitting ? 'جاري الإرسال...' : (
                    <>
                      <Send size={24} className="rotate-180" />
                      إرسال الاقتراح
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
          
          {/* List of suggestions with delete button */}
          <div className="bg-surface p-8 rounded-[40px] shadow-xl border border-slate-100 dark:border-slate-800 mt-8 transition-colors duration-300">
            <h3 className="text-xl font-black arabic-text mb-6 text-right text-text-main">الاقتراحات السابقة</h3>
            <div className="space-y-4">
               {suggestions.length === 0 ? (
                 <p className="text-center py-8 text-text-muted font-bold arabic-text">لا توجد اقتراحات حالياً</p>
               ) : suggestions.map((s) => (
                 <div key={s.id} className="flex flex-row-reverse items-center justify-between p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800 group transition-all">
                    <div className="text-right flex-1">
                       <div className="flex flex-row-reverse items-center gap-2 mb-1">
                          <span className={`text-[10px] font-black arabic-text px-2 py-0.5 rounded-full ${
                             s.category === 'bug' ? 'bg-red-100 text-red-500' : 
                             s.category === 'content' ? 'bg-amber-100 text-amber-500' : 
                             'bg-blue-100 text-blue-500'
                          }`}>
                            {s.category === 'bug' ? 'ثغرة/خطأ' : s.category === 'content' ? 'محتوى' : 'ميزة'}
                          </span>
                          <span className="text-[10px] font-bold text-text-muted">{s.userName || 'طالب'}</span>
                       </div>
                       <p className="arabic-text font-bold text-text-main leading-relaxed">{s.text}</p>
                    </div>
                    {(s.userId === profile?.uid || isAdmin) && (
                      <button 
                        onClick={() => handleDelete(s.id)} 
                        className="p-3 text-red-500/50 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl transition-all"
                        title="حذف"
                      >
                        <Trash2 size={20} />
                      </button>
                    )}
                 </div>
               ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
           <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[40px] text-white overflow-hidden relative shadow-xl">
              <div className="absolute top-4 right-4 text-white/5">
                <Sparkles size={80} />
              </div>
              <h3 className="text-xl font-black arabic-text mb-4 relative z-10">لماذا نشجعك على الإرسال؟</h3>
              <ul className="space-y-4 text-right relative z-10">
                 <li className="flex flex-row-reverse items-start gap-3">
                   <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-[10px] shrink-0 mt-1">1</div>
                   <p className="text-sm font-bold arabic-text text-slate-300">أنت أدرى باحتياجاتك كطالب.</p>
                 </li>
                 <li className="flex flex-row-reverse items-start gap-3">
                   <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-[10px] shrink-0 mt-1">2</div>
                   <p className="text-sm font-bold arabic-text text-slate-300">نسعى لتطوير المنصة باستمرار.</p>
                 </li>
                 <li className="flex flex-row-reverse items-start gap-3">
                   <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-[10px] shrink-0 mt-1">3</div>
                   <p className="text-sm font-bold arabic-text text-slate-300">أصحاب أفضل الاقتراحات يحصلون على نقاط تميز!</p>
                 </li>
              </ul>
           </div>
        </div>
      </div>
    </div>
  );
}
