import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  FileText, 
  Award, 
  Target, 
  TrendingUp, 
  Download, 
  Share2,
  Sparkles,
  Brain,
  Star,
  GraduationCap,
  Trophy,
  History
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { calculateLevel, getRank } from '../lib/gameLogic';
import { GoogleGenAI } from "@google/genai";
import { ChallengeRecord, SUBJECTS } from '../types';

interface PersonalResumeProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PersonalResume({ isOpen, onClose }: PersonalResumeProps) {
  const { profile } = useAuth();
  const [summary, setSummary] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [proficiency, setProficiency] = React.useState<Record<string, number>>({});
  const [statsLoading, setStatsLoading] = React.useState(true);

  React.useEffect(() => {
    if (isOpen && profile) {
      if (!summary) generateSummary();
      fetchRealStats();
    }
  }, [isOpen, profile]);

  const fetchRealStats = async () => {
    if (!profile) return;
    setStatsLoading(true);
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
      Object.entries(stats).forEach(([id, data]) => {
        prof[id] = Math.round((data.correct / data.total) * 100);
      });
      setProficiency(prof);
    } catch (err) {
      console.error(err);
    } finally {
      setStatsLoading(false);
    }
  };

  const generateSummary = async () => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `أنت خبير في الموارد البشرية والتعليم. الطالب ${profile?.displayName} لديه الإحصائيات التالية:
      - المستوى: ${calculateLevel(profile?.stats.xp || 0)}
      - عدد التحديات: ${profile?.stats.totalDuels}
      - عدد مرات الفوز: ${profile?.stats.wins}
      - النقاط الإجمالية: ${profile?.stats.xp}
      - الرتبة: ${getRank(profile?.stats)}
      
      اكتب "ملخصاً مهنياً" أو "نبذة شخصية" قصيرة واحترافية وبليغة باللغة العربية تبرز مهاراته في التعلم والمنافسة وحبه للتميز العلمي. (3 أسطر كحد أقصى).`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      setSummary(response.text);
    } catch (err) {
      console.error(err);
      const isQuotaExceeded = (err instanceof Error && err.message.includes('429')) || 
                             (typeof err === 'string' && err.includes('429')) ||
                             (err && typeof err === 'object' && JSON.stringify(err).includes('429'));
                             
      if (isQuotaExceeded) {
         setSummary("ميزة الذكاء الاصطناعي تجاوزت الحد المسموح للاستخدام حالياً، يرجى المحاولة غداً!");
      } else {
         setSummary("طالب طموح ومتميز يسعى دائماً لتطوير مهاراته العلمية من خلال المنافسة والتعلم المستمر.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 md:p-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden relative border border-slate-100"
          >
            {/* Header / Banner */}
            <div className="bg-gradient-to-br from-slate-900 to-primary p-12 text-white relative">
              <button 
                onClick={onClose}
                className="absolute top-6 left-6 p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all"
              >
                <X size={24} />
              </button>
              
              <div className="flex flex-col md:flex-row-reverse items-center gap-8">
                <div className="relative">
                  <img 
                    src={profile?.photoURL} 
                    className="w-32 h-32 rounded-[32px] border-4 border-white/20 shadow-2xl" 
                    alt="profile" 
                  />
                  <div className="absolute -bottom-2 -right-2 bg-amber-400 text-slate-900 p-2 rounded-xl shadow-lg border-2 border-white">
                    <Trophy size={20} />
                  </div>
                </div>
                
                <div className="text-center md:text-right flex-1">
                  <h2 className="text-3xl font-black arabic-text mb-2 tracking-tight">{profile?.displayName}</h2>
                  <div className="flex flex-row-reverse items-center justify-center md:justify-start gap-4">
                    <div className="flex flex-row-reverse items-center gap-2 bg-white/10 px-4 py-2 rounded-2xl border border-white/10">
                       <Award size={14} className="text-amber-400" />
                       <span className="text-xs font-black arabic-text">رتبة {getRank(profile?.stats)}</span>
                    </div>
                    <div className="flex flex-row-reverse items-center gap-2 bg-white/10 px-4 py-2 rounded-2xl border border-white/10 text-amber-200">
                       <TrendingUp size={14} />
                       <span className="text-xs font-black arabic-text">المستوى {calculateLevel(profile?.stats.xp || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 md:p-12 space-y-10 overflow-y-auto max-h-[60vh] custom-scrollbar">
              {/* Pro Summary Section */}
              <section className="text-right">
                <div className="flex flex-row-reverse items-center gap-3 mb-4 px-2">
                  <Brain className="text-primary" size={24} />
                  <h3 className="text-xl font-black arabic-text text-slate-800">الملخص المهني الذكي 🤖</h3>
                </div>
                <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 relative group overflow-hidden">
                  <div className="absolute top-4 left-4 text-primary/5 group-hover:text-primary/10 transition-colors">
                    <Sparkles size={60} />
                  </div>
                  {loading ? (
                    <div className="space-y-3">
                       <div className="h-3 bg-slate-200 rounded-full w-full animate-pulse"></div>
                       <div className="h-3 bg-slate-200 rounded-full w-5/6 animate-pulse"></div>
                       <div className="h-3 bg-slate-200 rounded-full w-2/3 animate-pulse"></div>
                    </div>
                  ) : (
                    <p className="text-slate-600 arabic-text font-bold leading-relaxed relative z-10 text-lg">
                      {summary}
                    </p>
                  )}
                </div>
              </section>

              {/* Stats Grid */}
              <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                 {[
                   { icon: Target, label: 'أعلى دقة', val: `${Math.round(((profile?.stats.wins || 0) / (profile?.stats.totalDuels || 1)) * 100)}%`, color: 'text-blue-500', bg: 'bg-blue-50/50', border: 'border-blue-100' },
                   { icon: Sparkles, label: 'النقاط الحالية', val: profile?.stats.points.toLocaleString(), color: 'text-amber-500', bg: 'bg-amber-50/50', border: 'border-amber-100' },
                   { icon: GraduationCap, label: 'تحديات مكتملة', val: profile?.stats.totalDuels, color: 'text-emerald-500', bg: 'bg-emerald-50/50', border: 'border-emerald-100' },
                   { icon: Trophy, label: 'مرات الفوز', val: profile?.stats.wins, color: 'text-purple-500', bg: 'bg-purple-50/50', border: 'border-purple-100' },
                 ].map((stat, i) => (
                   <div key={i} className={`p-6 ${stat.bg} ${stat.border} border rounded-[32px] text-center hover:shadow-xl transition-all group overflow-hidden relative`}>
                      <div className="absolute -right-4 -bottom-4 opacity-[0.05] group-hover:opacity-10 transition-opacity">
                         <stat.icon size={80} />
                      </div>
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm border border-white/50">
                         <stat.icon className={stat.color} size={24} />
                      </div>
                      <p className="text-[10px] font-black text-slate-400 arabic-text uppercase mb-1 tracking-tighter">{stat.label}</p>
                      <p className={`text-2xl font-black ${stat.color} tracking-tight`}>{stat.val}</p>
                   </div>
                 ))}
              </section>

              {/* Skills Analysis */}
              <section className="text-right">
                 <div className="flex flex-row-reverse items-center justify-between mb-6 px-2">
                    <div className="flex flex-row-reverse items-center gap-3">
                      <TrendingUp className="text-primary" size={24} />
                      <h3 className="text-xl font-black arabic-text text-slate-800">تحليل المهارات الحقيقي 📊</h3>
                    </div>
                    <span className="text-[10px] font-black arabic-text text-slate-400 uppercase tracking-widest">بناءً على أدائك</span>
                </div>
                <div className="space-y-6">
                   {statsLoading ? (
                     <div className="space-y-4">
                        {[1,2,3,4].map(i => (
                          <div key={i} className="h-10 bg-slate-50 rounded-2xl animate-pulse" />
                        ))}
                     </div>
                   ) : SUBJECTS.map((subject, i) => {
                     const val = proficiency[subject.id] || 0;
                     const stars = Math.min(5, Math.ceil(val / 20));
                     
                     return (
                       <div key={i} className="flex flex-row-reverse items-center gap-4 group">
                          <span className="w-24 text-sm font-black arabic-text text-slate-600 text-right group-hover:text-primary transition-colors">{subject.nameAr}</span>
                          <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner relative">
                             <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: `${val || 5}%` }}
                               className={`h-full ${subject.color}`}
                             />
                             {val > 0 && (
                               <div className="absolute inset-0 flex items-center justify-center px-2">
                                  <span className="text-[8px] font-black text-white mix-blend-difference">{val}%</span>
                               </div>
                             )}
                          </div>
                          <div className="flex gap-0.5 w-24 justify-end">
                             {[1,2,3,4,5].map(s => (
                               <Star 
                                 key={s} 
                                 size={14} 
                                 className={`${s <= stars ? 'text-amber-400 fill-amber-400' : 'text-slate-200'} transition-all`} 
                               />
                             ))}
                          </div>
                       </div>
                     );
                   })}
                </div>
              </section>
            </div>

            {/* Footer */}
            <div className="p-8 bg-slate-50 border-t border-slate-100 flex flex-row-reverse gap-4">
              <button 
                onClick={() => alert('سيتم تفعيل تحميل السيرة الذاتية قريباً! 📄')}
                className="flex-1 py-4 bg-primary text-white rounded-[24px] font-black arabic-text shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 text-lg"
              >
                <Download size={24} />
                تحميل السيرة الذاتية PDF
              </button>
              <button className="p-4 bg-white border-2 border-slate-200 rounded-[24px] text-slate-400 hover:text-primary hover:border-primary/20 transition-all shadow-sm">
                <Share2 size={24} />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
