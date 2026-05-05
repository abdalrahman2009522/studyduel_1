import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Brain, Star, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SUBJECTS, ChallengeRecord } from '../types';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export function SkillAnalysis() {
  const { profile } = useAuth();
  const [proficiency, setProficiency] = React.useState<Record<string, number>>({});
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchStats = async () => {
      if (!profile) return;
      try {
        const q = query(
          collection(db, 'challenge_records'),
          where('userId', '==', profile.uid)
        );
        const snapshot = await getDocs(q);
        const records = snapshot.docs.map(doc => doc.data() as ChallengeRecord);
        
        const stats: Record<string, { correct: number, total: number }> = {};
        records.forEach(record => {
          if (!stats[record.subjectId]) stats[record.subjectId] = { correct: 0, total: 0 };
          if (record.questions) {
            record.questions.forEach(q => {
              stats[record.subjectId].total += 1;
              if (q.correct) stats[record.subjectId].correct += 1;
            });
          }
        });

        const prof: Record<string, number> = {};
        SUBJECTS.forEach(s => { prof[s.id] = 0; }); // Default all to 0
        Object.entries(stats).forEach(([id, data]) => {
          if (data.total > 0) {
            prof[id] = Math.round((data.correct / data.total) * 100);
          }
        });
        setProficiency(prof);
      } catch (err) {
        console.error("Failed to load skill analysis data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [profile]);

  const data = SUBJECTS.map(s => ({
    ...s,
    score: proficiency[s.id] || 0
  }));
  
  const sortedData = [...data].sort((a, b) => b.score - a.score);
  const strongest = sortedData[0];
  const weakest = sortedData[sortedData.length - 1];

  if (loading) {
     return (
        <div className="flex justify-center items-center h-64">
           <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
     );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="text-right">
        <h1 className="text-4xl font-black text-slate-800 arabic-text mb-2">تحليل المهارات الحقيقي 📊</h1>
        <p className="text-slate-500 arabic-text font-bold">بناءً على التحديات التي قمت بها، هنا تحليل دقيق لمهاراتك</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-green-50 p-8 rounded-[40px] border border-green-100 flex flex-row-reverse items-center gap-6"
        >
          <div className="w-16 h-16 bg-green-500 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-green-500/20">
             <Star size={32} />
          </div>
          <div className="text-right">
            <p className="text-green-600 font-extrabold arabic-text text-sm uppercase tracking-widest mb-1">نسبة {strongest?.score || 0}%</p>
            <h3 className="text-2xl font-black arabic-text text-slate-800">{strongest?.nameAr || 'لا توجد بيانات'}</h3>
            <p className="text-slate-500 text-sm arabic-text mt-1">أقوى مجالاتك الأكاديمية</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-amber-50 p-8 rounded-[40px] border border-amber-100 flex flex-row-reverse items-center gap-6"
        >
          <div className="w-16 h-16 bg-amber-500 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-amber-500/20">
             <AlertTriangle size={32} />
          </div>
          <div className="text-right">
            <p className="text-amber-600 font-extrabold arabic-text text-sm uppercase tracking-widest mb-1">نسبة {weakest?.score || 0}%</p>
            <h3 className="text-2xl font-black arabic-text text-slate-800">{weakest?.nameAr || 'لا توجد بيانات'}</h3>
            <p className="text-slate-500 text-sm arabic-text mt-1">يحتاج إلى المزيد من التحديات</p>
          </div>
        </motion.div>
      </div>

      <div className="bg-white p-8 md:p-12 rounded-[40px] border border-slate-100 shadow-sm">
        <h3 className="text-2xl font-black arabic-text text-slate-800 text-right mb-10">مستوى إتقان المواد</h3>
        <div className="space-y-8">
          {data.map((item, idx) => (
            <div key={idx} className="space-y-3">
              <div className="flex justify-between items-center flex-row-reverse">
                <span className="text-lg font-black arabic-text text-slate-700">{item.nameAr}</span>
                <span className="font-mono text-xl font-black text-primary">{item.score}%</span>
              </div>
              <div className="h-4 bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-1">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.score}%` }}
                  transition={{ duration: 1, delay: idx * 0.1 }}
                  className={`h-full rounded-full ${item.color} shadow-lg`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-900 p-10 rounded-[40px] text-white overflow-hidden relative">
         <div className="absolute top-0 right-0 p-10 opacity-10">
            <Brain size={200} />
         </div>
         <div className="relative z-10 text-right">
            <ShieldCheck size={48} className="text-primary mb-4" />
            <h3 className="text-3xl font-black arabic-text mb-4">نصيحة الذكاء الاصطناعي 🤖</h3>
            <p className="text-slate-400 arabic-text text-xl leading-relaxed max-w-2xl">
              بناءً على أدائك الحقيقي، التركيز على مادة {weakest?.nameAr} سيساعدك في رفع مستواك بشكل كبير. استخدم ميزة "مراجعة الإجابات" بعد كل تحدي لمضاعفة فرص التعلم.
            </p>
         </div>
      </div>
    </div>
  );
}
