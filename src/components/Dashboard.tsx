import React from 'react';
import { motion } from 'motion/react';
import { 
  Zap, 
  Target, 
  Flame, 
  ChevronRight,
  Play,
  CheckCircle2,
  BookOpen,
  Trophy,
  Lightbulb,
  CheckSquare,
  TrendingUp,
  Brain,
  Search,
  Sparkles,
  GraduationCap,
  Users as UsersIcon
} from 'lucide-react';
import { SUBJECTS, AppUser, CommunityPost } from '../types.ts';
import { ProfileAvatar } from './ProfileAvatar';
import { useAuth } from '../context/AuthContext';
import { calculateLevel, getRank, SHOP_ITEMS } from '../lib/gameLogic';
import { db } from '../lib/firebase';
import { collection, query, orderBy, limit, getDocs, where, Timestamp } from 'firebase/firestore';
import { generateAIContent } from '../lib/gemini';
import { soundManager } from '../lib/soundManager';

import { PersonalResume } from './PersonalResume';

interface DashboardProps {
  onStartDuel: (subjectId: string) => void;
}

export function Dashboard({ onStartDuel }: DashboardProps) {
  const { profile } = useAuth();
  const [topPlayers, setTopPlayers] = React.useState<AppUser[]>([]);
  const [latestPosts, setLatestPosts] = React.useState<CommunityPost[]>([]);
  const [aiInsight, setAiInsight] = React.useState<string | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = React.useState(false);
  const [showResume, setShowResume] = React.useState(false);

  const playClick = () => soundManager.playClick();

  React.useEffect(() => {
    const generateDashboardAI = async () => {
      if (!profile || aiInsight) return;
      setIsGeneratingAI(true);
      
      const prompt = `أنت رفيق دراسة ذكي. الطالب ${profile.displayName} في رتبة ${getRank(profile.stats)}. 
        لديه ${profile.stats.xp} نقطة خبرة و ${profile.stats.wins} فوز من أصل ${profile.stats.totalDuels} تحدي. 
        اكتب نصيحة دراسية واحدة قصيرة وذكية ومحفزة جداً باللغة العربية بناءً على أدائه (بدون استخدام رموز تعبيرية كثيرة، سطر واحد فقط).`;

      const result = await generateAIContent("gemini-3-flash-preview", prompt);
      setAiInsight(result.text);
      setIsGeneratingAI(false);
    };
    generateDashboardAI();
  }, [profile]);
  
  React.useEffect(() => {
    const fetchTop = async () => {
      try {
        const q = query(collection(db, 'users'), orderBy('stats.xp', 'desc'), limit(3));
        const snap = await getDocs(q);
        setTopPlayers(snap.docs.map(d => d.data() as AppUser));
        
        const postsQ = query(
          collection(db, 'community_posts'), 
          where('parentId', '==', null),
          orderBy('timestamp', 'desc'), 
          limit(2)
        );
        const postsSnap = await getDocs(postsQ);
        setLatestPosts(postsSnap.docs.map(d => ({ id: d.id, ...d.data() } as CommunityPost)));
      } catch (err) {
        console.error(err);
      }
    };
    fetchTop();
  }, []);
  
  const stats = profile?.stats || {
    level: 1,
    xp: 0,
    wins: 0,
    totalDuels: 0,
    streak: 0,
    points: 0,
    rank: 'Bronze'
  };

  const currentLevel = calculateLevel(stats.xp);
  const currentRank = getRank(stats);

  const dailyGoals = [
    { id: 1, text: 'حل 10 أسئلة في تاريخ الأردن', done: false, xp: 50 },
    { id: 2, text: 'الفوز في مبارزة واحدة على الأقل', done: true, xp: 100 },
    { id: 3, text: 'المشاركة في الدردشة العامة', done: false, xp: 20 },
  ];

  const dailyTip = "التكرار المتباعد هو سر النجاح؛ راجع معلوماتك كل يومين لضمان بقائها في ذاكرتك الطويلة الأمد!";

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
      {/* Top Navigation Bar / Minimalism */}
      <div className="flex flex-row-reverse items-center justify-between bg-surface/50 dark:bg-slate-900/50 backdrop-blur-xl px-6 py-3 rounded-[24px] border border-white/20 dark:border-slate-800/50 shadow-sm mb-4">
        <div className="flex flex-row-reverse items-center gap-6">
          <div className="flex flex-row-reverse items-center gap-2">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
              <BookOpen size={18} />
            </div>
            <span className="font-black text-text-main arabic-text text-sm">Study Duel ⚔️</span>
          </div>
          <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 hidden md:block" />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-xl border border-amber-100 dark:border-amber-800/50">
            <Zap size={14} className="text-amber-500" />
            <span className="text-xs font-black text-amber-700 dark:text-amber-400 tabular-nums">{stats.xp.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Hero Welcome Section */}
      <section className="relative overflow-hidden hero-gradient rounded-[40px] p-8 md:p-12 text-white shadow-2xl shadow-primary/30 flex flex-col md:flex-row-reverse items-center gap-8 group transition-all duration-500">
        <div className="flex-1 relative z-10 text-right">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center justify-end gap-3 mb-4">
              <span className="bg-white/20 px-4 py-1 rounded-full text-xs font-black arabic-text uppercase tracking-widest border border-white/20">
                 رتبة {currentRank}
              </span>
              <h1 className="text-4xl md:text-5xl font-extrabold arabic-text">
                 {profile?.displayName} 👋
              </h1>
            </div>
            <p className="text-blue-100 text-lg md:text-xl arabic-text text-right mb-4 opacity-90 leading-relaxed transition-colors duration-300">
              لقد خضت {stats.totalDuels} تحدياً حتى الآن. مستواك الحالي هو {currentLevel}! 
            </p>

            {/* Enhanced Progress Bar */}
            <div className="mb-8 w-full max-w-md ml-auto">
               <div className="flex flex-row-reverse justify-between items-center mb-2 px-1">
                  <span className="text-xs font-black arabic-text text-white/80">المستوى {currentLevel}</span>
                  <span className="text-xs font-mono text-white/50">{stats.xp % 1000} / 1000 XP</span>
               </div>
               <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden border border-white/10 shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(stats.xp % 1000) / 10}%` }}
                    className="h-full bg-gradient-to-l from-white via-amber-300 to-white shadow-[0_0_15px_rgba(255,255,255,0.5)] rounded-full"
                  />
               </div>
            </div>

            <div className="flex flex-row-reverse gap-4">
              <button 
                onClick={() => { 
                  playClick();
                  const randomSubject = SUBJECTS[Math.floor(Math.random() * SUBJECTS.length)];
                  onStartDuel(randomSubject.id);
                }}
                className="bg-white text-primary px-10 py-5 rounded-3xl font-black arabic-text text-lg shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
              >
                مبارزة عشوائية 🎲
              </button>
              <button 
                onClick={() => { playClick(); setShowResume(true); }}
                className="bg-primary/20 backdrop-blur-md border border-white/20 text-white px-8 py-5 rounded-3xl font-black arabic-text text-lg hover:bg-primary/30 transition-all flex items-center gap-3"
              >
                سيرتي الذاتية 📄
              </button>
            </div>
          </motion.div>
        </div>

        <div className="w-full md:w-64 aspect-square relative group">
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="w-full h-full flex items-center justify-center relative"
            >
               <ProfileAvatar 
                 uid={profile?.uid}
                 photoURL={profile?.photoURL}
                 inventory={profile?.inventory}
                 size="xl"
                 className="group-hover:scale-110 transition-transform duration-500"
               />
               <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white/10 dark:bg-slate-900/40 backdrop-blur-md px-6 py-2 rounded-full text-[10px] font-black arabic-text border border-white/10 dark:border-slate-800 shadow-xl z-20">طالب متميز</div>
            </motion.div>
        </div>

        {/* Floating Decor */}
        <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-white/10 rounded-full blur-2xl" />
      </section>

      {/* Activity Summary pills - Enhanced Design */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
         {[
           { icon: Zap, label: 'الخبرة', val: stats.xp, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/10', border: 'border-amber-100 dark:border-amber-900/20', shadow: 'shadow-amber-500/5' },
           { icon: Trophy, label: 'الانتصارات', val: stats.wins, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/10', border: 'border-green-100 dark:border-green-900/20', shadow: 'shadow-green-500/5' },
           { icon: UsersIcon, label: 'التحديات', val: stats.totalDuels, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/10', border: 'border-blue-100 dark:border-blue-900/20', shadow: 'shadow-blue-500/5' },
           { icon: Flame, label: 'السلسلة', val: stats.streak, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/10', border: 'border-red-100 dark:border-red-900/20', shadow: 'shadow-red-500/5' },
         ].map((stat, i) => (
           <div key={i} className={`${stat.bg} ${stat.border} p-6 rounded-[32px] border-2 flex flex-col items-center text-center group hover:scale-[1.02] hover:shadow-xl ${stat.shadow} transition-all duration-300 relative overflow-hidden`}>
              <div className="absolute top-0 right-0 w-12 h-12 bg-white/40 dark:bg-white/5 rounded-bl-[32px] transform translate-x-4 -translate-y-4 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-500" />
              <stat.icon className={`${stat.color} mb-3 group-hover:rotate-12 group-hover:scale-110 transition-transform`} size={32} strokeWidth={2.5} />
              <p className="text-[10px] font-black text-text-muted arabic-text uppercase tracking-widest">{stat.label}</p>
              <p className="text-3xl font-black text-text-main tabular-nums transition-colors duration-300">{stat.val.toLocaleString()}</p>
           </div>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Subjects Grid */}
        <section className="lg:col-span-2">
          <div className="flex flex-row-reverse items-center justify-between mb-6">
            <h2 className="text-2xl font-black arabic-text text-text-main">اختر مادة للمبارزة</h2>
            <button className="text-primary font-bold text-sm arabic-text hover:underline transition-all">
              عرض جميع المواد
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SUBJECTS.map((subject, i) => (
              <motion.div
                key={subject.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => { playClick(); onStartDuel(subject.id); }}
                className="group cursor-pointer p-6 bg-surface rounded-[32px] border-2 border-transparent hover:border-primary shadow-xl shadow-primary/5 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex flex-col items-center text-center">
                  <div className={`w-20 h-20 ${subject.color} rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-current/30 mb-4 transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                    <BookOpen size={40} />
                  </div>
                  <h3 className="text-2xl font-black arabic-text mb-1 text-text-main">{subject.nameAr}</h3>
                  <p className="text-text-muted text-sm arabic-text font-bold mb-6">{subject.questionsCount} سؤال متاح</p>
                  
                  <div className="w-full h-px bg-slate-100 dark:bg-slate-700 mb-6" />
                  
                  <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 px-6 py-2.5 rounded-2xl group-hover:bg-primary group-hover:text-white transition-colors">
                    <span className="arabic-text font-black">ابدأ التحدي</span>
                    <Play size={16} className="fill-current" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Sidebar - Daily Goals & Tips */}
        <section className="space-y-8">
          {/* Daily Goals */}
          <div className="bg-surface rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-xl shadow-primary/5 p-8 transition-colors duration-300">
            <div className="flex flex-row-reverse items-center justify-between mb-6">
              <CheckSquare className="text-primary" size={24} />
              <h2 className="text-xl font-black arabic-text text-text-main">أهداف اليوم</h2>
            </div>
            <div className="space-y-4">
              {dailyGoals.map((task) => (
                <div key={task.id} className="group flex flex-row-reverse items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 hover:border-primary/20 transition-all">
                  <div className={`mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${task.done ? 'bg-green-500 border-green-500 text-white' : 'bg-surface border-slate-200 dark:border-slate-700'}`}>
                    {task.done && <CheckCircle2 size={14} />}
                  </div>
                  <div className="flex-1 text-right">
                    <div className={`arabic-text font-bold text-sm ${task.done ? 'text-text-muted line-through' : 'text-text-main'} transition-colors duration-300`}>
                      {task.text}
                    </div>
                    <div className="text-[10px] font-black text-primary mt-1">+{task.xp} XP</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Smart Tip */}
          <div className="bg-surface rounded-[32px] p-8 border border-slate-100 dark:border-slate-800 shadow-xl shadow-primary/5 relative overflow-hidden group transition-colors duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -mr-10 -mt-10 blur-2xl" />
            
            <div className="relative z-10">
              <div className="flex items-center flex-row-reverse gap-3 mb-4">
                <Brain className="text-amber-500 animate-pulse" size={24} />
                <h3 className="text-lg font-black arabic-text text-text-main">نصيحة المعلم الذكي الـ AI</h3>
              </div>
              <p className="text-text-muted text-sm arabic-text text-right leading-relaxed font-black transition-colors duration-300">
                {isGeneratingAI ? (
                  <span className="animate-pulse">جاري تحليل أدائك وابتكار نصيحة خصيصاً لك...</span>
                ) : (
                  aiInsight || dailyTip
                )}
              </p>
            </div>
            
            <div className="mt-6 flex flex-row-reverse items-center justify-between text-[10px] font-black arabic-text text-amber-600">
               <span className="bg-amber-50 dark:bg-amber-900/20 px-3 py-1 rounded-full uppercase tracking-tighter">نصيحة تعليمية</span>
               <span className="opacity-50">#دراسة_ذكية</span>
            </div>
          </div>

          {/* Ranking Teaser */}
          <div className="bg-slate-900 dark:bg-slate-950 rounded-[32px] p-8 text-white relative overflow-hidden transition-colors duration-300">
             <div className="relative z-10">
                <h3 className="text-lg font-black arabic-text mb-4 text-right">المتصدرون لهذا الأسبوع 🏆</h3>
                <div className="space-y-3">
                   {topPlayers.map((p, i) => (
                     <div key={p.uid} className="flex flex-row-reverse items-center justify-between bg-white/5 p-3 rounded-2xl border border-white/10 transition-colors duration-300">
                        <div className="flex flex-row-reverse items-center gap-3">
                           <img src={p.photoURL} className="w-8 h-8 rounded-full object-cover" alt="avatar" />
                           <div className="text-xs font-bold arabic-text">{p.displayName}</div>
                        </div>
                        <div className="text-xs font-black text-amber-400">{p.stats.xp.toLocaleString()} XP</div>
                     </div>
                   ))}
                   {topPlayers.length === 0 && <p className="text-center text-xs text-slate-500 font-bold arabic-text py-4 transition-colors duration-300">جاري تحميل البيانات...</p>}
                </div>
                <button 
                  onClick={() => window.dispatchEvent(new CustomEvent('changeTab', { detail: 'leaderboard' }))}
                  className="w-full mt-6 py-3 bg-primary text-white rounded-2xl font-bold arabic-text text-sm hover:scale-105 transition-all text-center"
                >
                  عرض الترتيب الكامل
                </button>
             </div>
             
             {/* Decor */}
             <div className="absolute top-0 left-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
          </div>

          {/* Latest Posts Teaser */}
          <div className="bg-surface rounded-[32px] p-8 border border-slate-100 dark:border-slate-800 shadow-xl shadow-primary/5 transition-colors duration-300">
             <div className="flex flex-row-reverse items-center justify-between mb-6">
                <h3 className="text-lg font-black arabic-text text-text-main">أحدث المشاركات 📢</h3>
                <button 
                  onClick={() => window.dispatchEvent(new CustomEvent('changeTab', { detail: 'community' }))}
                  className="text-primary text-xs font-black arabic-text hover:underline"
                >
                  الكل
                </button>
             </div>
             <div className="space-y-4">
                {latestPosts.map((post) => (
                  <div key={post.id} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-right transition-colors duration-300">
                     <p className="text-sm font-bold text-text-main arabic-text line-clamp-2 mb-2 transition-colors duration-300">{post.content}</p>
                     <div className="flex flex-row-reverse items-center justify-between">
                        <div className="flex flex-row-reverse items-center gap-2">
                           <img 
                             src={post.authorPhotoURL || `https://api.dicebear.com/7.x/open-peeps/svg?seed=${post.authorId}`} 
                             className="w-5 h-5 rounded-full" 
                             alt="" 
                           />
                           <span className="text-[10px] font-black text-text-muted arabic-text transition-colors duration-300">{post.authorName}</span>
                        </div>
                        <span className="text-[9px] font-mono text-text-muted/60 transition-colors duration-300">
                          {post.timestamp instanceof Timestamp ? post.timestamp.toDate().toLocaleDateString('ar-EG') : 'الآن'}
                        </span>
                     </div>
                  </div>
                ))}
                {latestPosts.length === 0 && <p className="text-center text-xs text-text-muted arabic-text py-4 italic transition-colors duration-300">لا توجد مشاركات حديثة</p>}
             </div>
          </div>

          <div className="mt-8">
            {/* MessagingSystem removed as per request */}
          </div>
        </section>
      </div>
      <PersonalResume isOpen={showResume} onClose={() => setShowResume(false)} />
    </div>
  );
}

// Simple placeholder icons helper
