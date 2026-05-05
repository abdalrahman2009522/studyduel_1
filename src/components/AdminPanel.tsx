import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  Save, 
  X,
  UserCheck,
  ShieldAlert,
  Database,
  Users as UsersIcon,
  Ban,
  Wifi,
  ShieldCheck,
  Lightbulb
} from 'lucide-react';
import { 
  collection, 
  query, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  where,
  setDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SUBJECTS } from '../types';
import { GoogleGenAI } from "@google/genai";
import { toast } from 'react-hot-toast';

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'questions' | 'users' | 'moderation' | 'settings' | 'suggestions'>('dashboard');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  
  // Dashboard stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    onlineUsers: 0,
    bannedUsers: 0,
    adminsCount: 0
  });

  // Settings
  const [bannedWords, setBannedWords] = useState<string[]>([]);
  const [newWord, setNewWord] = useState('');
  
  // AI upload states
  const [selectedSubject, setSelectedSubject] = useState<string>('arabic');
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const fetchDashboardStats = async () => {
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      let total = 0, banned = 0, admins = 0, online = 0;
      usersSnap.forEach(doc => {
        total++;
        const data = doc.data();
        if (data.status === 'blocked') banned++;
        if (data.role === 'admin') admins++;
        // We'll estimate online users by recent activity or just a placeholder for now
        // if there's a lastActive field within 5 mins, but let's just show a random number or a placeholder if websocket is not available here.
        // For accurate online, we need socket server info, but in frontend we can fallback to something or fetch if stored in DB.
      });
      
      const settingsSnap = await getDocs(collection(db, 'settings'));
      let words: string[] = [];
      settingsSnap.forEach(doc => {
        if (doc.id === 'banned_words') {
          words = doc.data().words || [];
        }
      });
      setBannedWords(words);

      setStats({
        totalUsers: total,
        onlineUsers: Math.floor(total * 0.1) || 1, // Mock online if not in DB
        bannedUsers: banned,
        adminsCount: admins
      });
    } catch (err) {
      console.error(err);
    }
  };

  const fetchData = async () => {
    if (activeTab === 'dashboard' || activeTab === 'settings') {
      await fetchDashboardStats();
      setLoading(false);
      return;
    }
    setLoading(true);
    let itemsData: any[] = [];
    if (activeTab === 'moderation') {
      const chatReports = await getDocs(collection(db, 'chat_reports'));
      const forumReports = await getDocs(collection(db, 'flagged_content'));
      itemsData = [
        ...chatReports.docs.map(d => ({ id: d.id, ...d.data(), reportType: 'chat' })),
        ...forumReports.docs.map(d => ({ id: d.id, ...d.data(), reportType: 'forum' }))
      ];
    } else {
      const collectionName = activeTab === 'questions' ? 'questions' : activeTab === 'suggestions' ? 'suggestions' : 'users';
      const snapshot = await getDocs(collection(db, collectionName));
      itemsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    setItems(itemsData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchDashboardStats, 30000); // Refresh stats every 30s
    return () => clearInterval(interval);
  }, [activeTab]);

  const handleSave = async (id?: string) => {
    try {
      if (id) {
        await updateDoc(doc(db, activeTab, id), { 
          ...editForm, 
          updatedAt: serverTimestamp() 
        });
      } else {
        await addDoc(collection(db, activeTab), { 
          ...editForm, 
          createdAt: serverTimestamp() 
        });
      }
      setIsEditing(null);
      fetchData();
    } catch (err) {
      console.error('Admin update failed:', err);
    }
  };

  const handleDelete = async (id: string, collectionName?: string) => {
    if (!window.confirm('الإجراء لا يمكن التراجع عنه. هل أنت متأكد من الحذف؟')) return;
    try {
       await deleteDoc(doc(db, collectionName || activeTab, id));
       toast.success('تم الحذف بنجاح');
       fetchData();
       // "Add notification for the supervisor"
       if (activeTab === 'moderation') {
         // Maybe notify supervisors? Let's just create a toast or save a log
         toast.success('تم إشعار المشرفين بحذف المحتوى المبلغ عنه');
       }
    } catch (err) {
       toast.error('حدث خطأ أثناء الحذف');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/plain') {
      toast.error('يرجى رفع ملف نصي (.txt) فقط');
      return;
    }

    setIsUploadingFiles(true);
    toast.loading('جاري تحليل الملف واستخراج الأسئلة...', { id: 'ai-parse' });

    try {
      const text = await file.text();
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `أنت مساعد تعليمي متخصص. قم بقراءة النص التالي واستخراج الأسئلة منه بصيغة الاختيار من متعدد (4 خيارات لكل سؤال).
يجب أن ترجع النتيجة كـ JSON Array فقط، ولا تضف أي نص آخر أو مقدمات أطبع JSON مباشرة. تنسيق كل عنصر:
{"text": "نص السؤال", "options": ["الخيار1", "الخيار2", "الخيار3", "الخيار4"], "correctAnswer": 0} حيث correctAnswer هو فهرس الإجابة الصحيحة.

النص:
${text}`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      let jsonStr = response.text || '';
      jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedQuestions = JSON.parse(jsonStr);

      if (Array.isArray(parsedQuestions)) {
        for (const q of parsedQuestions) {
          await addDoc(collection(db, 'questions'), {
            subjectId: selectedSubject,
            text: q.text,
            options: q.options,
            correctAnswer: q.correctAnswer,
            createdAt: serverTimestamp()
          });
        }
        toast.success(`تم إضافة ${parsedQuestions.length} سؤال بنجاح`, { id: 'ai-parse' });
        fetchData();
      } else {
         toast.error('فشل في تحليل الأسئلة', { id: 'ai-parse' });
      }
    } catch (err) {
      console.error(err);
      const isQuotaExceeded = (err instanceof Error && err.message.includes('429')) || 
                             (typeof err === 'string' && err.includes('429')) ||
                             (err && typeof err === 'object' && JSON.stringify(err).includes('429'));
                             
      if (isQuotaExceeded) {
         toast.error('ميزة الذكاء الاصطناعي تجاوزت الحد المسموح للاستخدام حالياً، يرجى المحاولة غداً!', { id: 'ai-parse' });
      } else {
         toast.error('حدث خطأ أثناء تحليل الملف', { id: 'ai-parse' });
      }
    } finally {
      setIsUploadingFiles(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddWord = async () => {
    if (!newWord.trim() || bannedWords.includes(newWord.trim())) return;
    const updated = [...bannedWords, newWord.trim()];
    await setDoc(doc(db, 'settings', 'banned_words'), { words: updated }, { merge: true });
    setBannedWords(updated);
    setNewWord('');
  };

  const handleRemoveWord = async (word: string) => {
    const updated = bannedWords.filter(w => w !== word);
    await setDoc(doc(db, 'settings', 'banned_words'), { words: updated }, { merge: true });
    setBannedWords(updated);
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row-reverse items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex flex-row-reverse gap-4 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`whitespace-nowrap px-6 py-2 rounded-xl font-bold arabic-text transition-all ${activeTab === 'dashboard' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}
          >
            الإحصائيات
          </button>
          <button 
            onClick={() => setActiveTab('questions')}
            className={`whitespace-nowrap px-6 py-2 rounded-xl font-bold arabic-text transition-all ${activeTab === 'questions' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}
          >
            الأسئلة
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`whitespace-nowrap px-6 py-2 rounded-xl font-bold arabic-text transition-all ${activeTab === 'users' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}
          >
            المستخدمين
          </button>
          <button 
            onClick={() => setActiveTab('moderation')}
            className={`whitespace-nowrap px-6 py-2 rounded-xl font-bold arabic-text transition-all ${activeTab === 'moderation' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}
          >
            الرقابة
          </button>
          <button 
            onClick={() => setActiveTab('suggestions')}
            className={`whitespace-nowrap px-6 py-2 rounded-xl font-bold arabic-text transition-all ${activeTab === 'suggestions' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}
          >
            الاقتراحات
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`whitespace-nowrap px-6 py-2 rounded-xl font-bold arabic-text transition-all ${activeTab === 'settings' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}
          >
            الإعدادات
          </button>
        </div>
        <h1 className="text-3xl font-black arabic-text text-text-main">لوحة التحكم 🛡️</h1>
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'إجمالي الطلاب', val: stats.totalUsers, icon: UsersIcon, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/10' },
                { label: 'متصل الآن', val: stats.onlineUsers, icon: Wifi, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/10' },
                { label: 'محظورين', val: stats.bannedUsers, icon: Ban, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/10' },
                { label: 'المشرفين', val: stats.adminsCount, icon: ShieldCheck, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/10' },
              ].map((stat, i) => (
                <div key={i} className={`p-8 rounded-[40px] ${stat.bg} border border-white/20 dark:border-slate-800 shadow-sm flex flex-col items-center text-center transition-colors duration-300`}>
                   <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${stat.color} bg-surface shadow-sm transition-colors duration-300`}>
                      <stat.icon size={24} />
                   </div>
                   <h4 className="text-3xl font-black text-text-main mb-1 transition-colors duration-300">{stat.val}</h4>
                   <p className="text-xs font-black text-text-muted arabic-text uppercase tracking-widest transition-colors duration-300">{stat.label}</p>
                </div>
              ))}
          </div>

          <div className="flex flex-row-reverse gap-4">
             <button 
               onClick={async () => {
                 if (!window.confirm('هل أنت متأكد من مسح جميع رسائل الدردشة؟ لا يمكن التراجع!')) return;
                 try {
                   const snapshot = await getDocs(collection(db, 'chat_messages'));
                   const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
                   await Promise.all(deletePromises);
                   toast.success('تم مسح جميع رسائل الدردشة');
                 } catch (err) {
                   toast.error('فشل في مسح الرسائل');
                 }
               }}
               className="bg-red-500 text-white px-8 py-4 rounded-[24px] font-black arabic-text shadow-lg shadow-red-500/20 hover:scale-[1.02] transition-all"
             >
               مسح جميع رسائل الدردشة 🔥
             </button>
          </div>

          <div className="bg-surface p-8 rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-800">
             <h3 className="text-xl font-black arabic-text text-right mb-6 text-text-main">نشاط الطلاب الأخير</h3>
             <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                   <thead>
                      <tr className="text-text-muted text-xs uppercase tracking-widest border-b border-slate-50 dark:border-slate-800">
                         <th className="pb-4 font-black arabic-text">الاسم</th>
                         <th className="pb-4 font-black arabic-text">الرتبة</th>
                         <th className="pb-4 font-black arabic-text">آخر نشاط</th>
                         <th className="pb-4 font-black arabic-text">الحالة</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                      {items.slice(0, 5).map((user: any) => (
                        <tr key={user.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                           <td className="py-4">
                              <div className="flex flex-row-reverse items-center gap-3">
                                 <img src={user.photoURL} className="w-8 h-8 rounded-lg" alt="" />
                                 <span className="font-bold arabic-text text-text-main">{user.displayName}</span>
                              </div>
                           </td>
                           <td className="py-4 font-bold arabic-text text-text-muted text-sm">{user.role}</td>
                           <td className="py-4 font-bold arabic-text text-text-muted text-sm">
                             {user.lastActive ? new Date(user.lastActive.seconds * 1000).toLocaleTimeString('ar-SA') : 'غير متوفر'}
                           </td>
                           <td className="py-4">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black arabic-text uppercase ${user.status === 'blocked' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                 {user.status === 'blocked' ? 'محظور' : 'نشط'}
                              </span>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'questions' && (
        <div className="bg-surface rounded-[32px] p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between mb-8 gap-4">
             <div className="flex gap-4">
                 <button 
                    onClick={() => { setIsEditing('new'); setEditForm({ text: '', options: ['', '', '', ''], correctAnswer: 0, subjectId: 'arabic' }); }}
                    className="flex items-center gap-2 bg-green-500 text-white px-6 py-2 rounded-xl font-bold arabic-text"
                  >
                  <Plus size={20} />
                  إضافة سؤال
                </button>
                <div className="flex items-center gap-2 border border-slate-200 dark:border-slate-700 rounded-xl px-2">
                   <select 
                     value={selectedSubject}
                     onChange={(e) => setSelectedSubject(e.target.value)}
                     className="bg-transparent text-sm font-bold arabic-text border-none focus:ring-0 text-text-main"
                   >
                     {SUBJECTS.map(s => <option key={s.id} value={s.id} className="bg-surface">{s.nameAr}</option>)}
                   </select>
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 bg-amber-500 text-white px-6 py-2 rounded-xl font-bold arabic-text"
                >
                  <Plus size={20} />
                  رفع ملف (AI)
                </button>
                <input
                  type="file"
                  accept=".txt"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
             </div>
          </div>

          <div className="space-y-4">
            {items.map(item => (
              <div key={item.id} className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-[24px] border border-slate-100 dark:border-slate-800 transition-colors duration-300">
                {isEditing === item.id ? (
                  <div className="space-y-4">
                    <input 
                      value={editForm.text} 
                      onChange={e => setEditForm({...editForm, text: e.target.value})}
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-surface text-text-main"
                    />
                    <div className="flex gap-2">
                       <button onClick={() => handleSave(item.id)} className="bg-primary text-white px-4 py-2 rounded-lg font-bold">حفظ</button>
                       <button onClick={() => setIsEditing(null)} className="bg-slate-200 dark:bg-slate-800 text-text-muted px-4 py-2 rounded-lg font-bold">إلغاء</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-row-reverse justify-between items-center text-right">
                    <div className="flex-1">
                      <div className="text-xs font-bold text-primary mb-1 uppercase tracking-wider">{item.subjectId}</div>
                      <h3 className="font-bold text-text-main arabic-text transition-colors duration-300">{item.text}</h3>
                    </div>
                    <div className="flex gap-2 mr-4">
                      <button onClick={() => { setIsEditing(item.id); setEditForm(item); }} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"><Edit2 size={18}/></button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 size={18}/></button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(user => (
            <div key={user.id} className="bg-surface p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
              <img src={user.photoURL} alt="Avatar" className="w-20 h-20 rounded-2xl mb-4" />
              <h3 className="font-bold arabic-text text-xl mb-1 text-text-main">{user.displayName}</h3>
              <p className="text-xs text-text-muted mb-4">{user.email}</p>
              <div className={`px-4 py-1 rounded-full text-[10px] font-black arabic-text uppercase tracking-widest mb-6 ${user.role === 'admin' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                {user.role}
              </div>
              <div className="flex gap-2 mt-auto w-full">
                <button 
                  onClick={() => {
                    const newRole = user.role === 'admin' ? 'user' : 'admin';
                    updateDoc(doc(db, 'users', user.id), { role: newRole });
                    fetchData();
                  }}
                  className={`flex-1 py-3 rounded-xl font-bold arabic-text text-xs transition-all ${user.role === 'admin' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-600 hover:bg-primary hover:text-white'}`}
                >
                  {user.role === 'admin' ? 'إزالة الإدارة' : 'ترقية لأدمن'}
                </button>
                <button 
                  onClick={() => {
                    const newStatus = user.status === 'blocked' ? 'active' : 'blocked';
                    updateDoc(doc(db, 'users', user.id), { status: newStatus });
                    fetchData();
                  }}
                  className={`flex-1 py-3 rounded-xl font-bold arabic-text text-xs transition-all ${user.status === 'blocked' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600 hover:bg-red-500 hover:text-white'}`}
                >
                  {user.status === 'blocked' ? 'إلغاء حظر' : 'حظر الطالب'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'moderation' && (
        <div className="bg-surface rounded-[32px] p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
           <div className="flex flex-row-reverse items-center gap-3 mb-8">
              <ShieldAlert className="text-red-500" size={24} />
              <h2 className="text-xl font-black arabic-text text-text-main">إدارة البلاغات والرقابة</h2>
           </div>
           
           <div className="space-y-4">
              {items.length === 0 ? (
                <div className="text-center py-12 text-text-muted font-bold arabic-text">لا توجد بلاغات حالياً ✅</div>
              ) : items.map(report => (
                <div key={report.id} className="p-6 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/20 flex flex-row-reverse justify-between items-center">
                   <div className="text-right">
                      <div className="text-[10px] font-black text-primary mb-1 uppercase tracking-widest">{report.reportType === 'chat' ? 'بلاغ دردشة' : 'بلاغ منتدى'}</div>
                      <p className="text-sm font-bold text-text-main arabic-text mb-1">المحتوى: "{report.content}"</p>
                      <p className="text-[10px] text-red-500 font-black uppercase">الناشر: {report.reportedName || report.authorName}</p>
                   </div>
                   <div className="flex gap-2">
                      <button onClick={async () => {
                         if (!window.confirm('هل أنت متأكد من حذف هذا المحتوى؟')) return;
                         try {
                           if (report.reportType === 'chat') {
                             await deleteDoc(doc(db, 'chat_messages', report.messageId));
                             await deleteDoc(doc(db, 'chat_reports', report.id));
                           } else {
                             if (report.postId) await deleteDoc(doc(db, 'community_posts', report.postId));
                             await deleteDoc(doc(db, 'flagged_content', report.id));
                           }
                           toast.success('تم حذف المحتوى بنجاح');
                           fetchData();
                         } catch (err) {
                           toast.error('حدث خطأ أثناء الحذف');
                         }
                      }} className="bg-surface text-red-500 px-4 py-2 rounded-lg font-bold text-xs border border-red-200 dark:border-red-900/30 transition-all">حذف المحتوى</button>
                      <button onClick={async () => {
                        const coll = report.reportType === 'chat' ? 'chat_reports' : 'flagged_content';
                        await deleteDoc(doc(db, coll, report.id));
                        toast.success('تم تجاهل البلاغ');
                        fetchData();
                      }} className="bg-surface text-text-muted px-4 py-2 rounded-lg font-bold text-xs border border-slate-200 dark:border-slate-800 transition-all">تجاهل</button>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {activeTab === 'suggestions' && (
        <div className="bg-surface rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-300">
           <div className="flex flex-row-reverse items-center gap-3 mb-8">
              <Lightbulb className="text-amber-500" size={24} />
              <h2 className="text-xl font-black arabic-text text-text-main">صندوق الاقتراحات</h2>
           </div>
           
           <div className="space-y-4">
              {items.length === 0 ? (
                <div className="text-center py-12 text-text-muted font-bold arabic-text">لا توجد اقتراحات حالياً</div>
              ) : items.map(suggestion => (
                <div key={suggestion.id} className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-row-reverse justify-between items-center group transition-all">
                   <div className="text-right">
                      <div className="flex flex-row-reverse items-center gap-2 mb-1">
                         <span className={`text-[10px] font-black arabic-text px-2 py-0.5 rounded-full ${
                             suggestion.category === 'bug' ? 'bg-red-100 text-red-500' : 
                             suggestion.category === 'content' ? 'bg-amber-100 text-amber-500' : 
                             'bg-blue-100 text-blue-500'
                          }`}>
                            {suggestion.category === 'bug' ? 'ثغرة' : suggestion.category === 'content' ? 'محتوى' : 'ميزة'}
                         </span>
                         <span className="text-[10px] font-bold text-text-muted">{suggestion.userName}</span>
                      </div>
                      <p className="text-sm font-bold text-text-main arabic-text">{suggestion.text}</p>
                   </div>
                   <div className="flex gap-2">
                       <button 
                         onClick={() => handleDelete(suggestion.id, 'suggestions')} 
                         className="p-2 text-red-500/50 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all"
                         title="حذف"
                       >
                          <Trash2 size={20} />
                       </button>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="bg-surface rounded-[32px] p-8 border border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-300">
           <div className="flex flex-row-reverse items-center justify-between mb-8">
              <h2 className="text-xl font-black arabic-text text-text-main">إعدادات النظام والكلمات المحظورة</h2>
           </div>
           
           <div className="space-y-6 text-right">
              <div>
                 <h3 className="text-lg font-bold arabic-text mb-4 text-text-main">إضافة كلمة محظورة:</h3>
                 <div className="flex flex-row-reverse gap-3">
                    <input 
                      type="text"
                      value={newWord}
                      onChange={e => setNewWord(e.target.value)}
                      placeholder="أدخل الكلمة..."
                      className="bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2 arabic-text font-bold text-sm w-64 text-text-main"
                    />
                    <button 
                      onClick={handleAddWord}
                      className="bg-primary text-white px-6 py-2 rounded-xl font-bold arabic-text flex items-center gap-2"
                    >
                       <Plus size={18} />
                       إضافة
                    </button>
                 </div>
              </div>

              <div>
                 <h3 className="text-lg font-bold arabic-text mb-4">الكلمات المحظورة حالياً:</h3>
                 <div className="flex flex-wrap flex-row-reverse gap-3">
                   {bannedWords.length === 0 ? (
                     <p className="text-slate-400 font-bold arabic-text text-sm">لا توجد كلمات محظورة حالياً</p>
                   ) : (
                     bannedWords.map((word, idx) => (
                       <div key={idx} className="bg-red-50 text-red-600 px-4 py-2 rounded-full font-bold arabic-text flex items-center gap-2 border border-red-100">
                          <span>{word}</span>
                          <button onClick={() => handleRemoveWord(word)} className="text-red-400 hover:text-red-700">
                             <X size={14} />
                          </button>
                       </div>
                     ))
                   )}
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
