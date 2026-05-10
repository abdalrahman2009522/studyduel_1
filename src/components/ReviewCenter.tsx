import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  History, 
  ChevronRight, 
  CheckCircle, 
  XCircle, 
  Search, 
  Trash2, 
  AlertCircle,
  X,
  History as HistoryIcon
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, getDocs, limit, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { ChallengeRecord, SUBJECTS } from '../types';
import { soundManager } from '../lib/soundManager';

export function ReviewCenter() {
  const { user } = useAuth();
  const [records, setRecords] = React.useState<ChallengeRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState('all');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [confirmDelete, setConfirmDelete] = React.useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = React.useState<ChallengeRecord | null>(null);

  const fetchRecords = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'challenge_records'),
        where('userId', '==', user.uid),
        orderBy('timestamp', 'desc'),
        limit(50)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChallengeRecord));
      setRecords(data);
    } catch (err) {
      console.error("Failed to fetch records:", err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchRecords();
  }, [user]);

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'challenge_records', id));
      setRecords(records.filter(r => r.id !== id));
      setConfirmDelete(null);
      soundManager.playError();
    } catch (err) {
      console.error("Failed to delete record:", err);
    }
  };

  const filteredRecords = records.filter(r => {
    const matchesFilter = filter === 'all' || r.subjectId === filter;
    const subject = SUBJECTS.find(s => s.id === r.subjectId);
    const matchesSearch = subject?.nameAr.includes(searchTerm);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-8 pb-12 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-xl shadow-primary/5 transition-colors duration-300">
        <div className="text-right">
          <div className="w-16 h-16 bg-blue-50 text-primary rounded-3xl flex items-center justify-center mb-4 ml-auto">
             <History size={32} />
          </div>
          <h1 className="text-4xl font-black text-slate-800 arabic-text mb-2">سجل التحديات 📖</h1>
          <p className="text-slate-500 arabic-text font-bold">كل إخفاق هو خطوة نحو النجاح، راجع أخطاءك الآن</p>
        </div>
        <div className="flex flex-col gap-4 w-full md:w-auto">
          <div className="relative">
             <input 
               type="text" 
               placeholder="ابحث عن مادة..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full md:w-64 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary/20 rounded-2xl px-5 py-3 text-right arabic-text font-bold outline-none transition-all dark:text-white"
             />
             <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {['all', ...SUBJECTS.map(s => s.id)].map(id => (
              <button
                key={id}
                onClick={() => setFilter(id)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-black arabic-text transition-all ${filter === id ? 'bg-primary text-white shadow-lg' : 'text-slate-400 bg-slate-50 hover:bg-slate-100'}`}
              >
                {id === 'all' ? 'الكل' : SUBJECTS.find(s => s.id === id)?.nameAr}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredRecords.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-20 rounded-[40px] text-center border-2 border-dashed border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-300">
          <div className="w-24 h-24 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <History size={48} />
          </div>
          <h2 className="text-2xl font-black arabic-text text-slate-800">لا توجد سجلات مطابقة</h2>
          <p className="text-slate-400 arabic-text mt-2 font-bold">ابدأ تحدياً جديداً لتسجيل تقدمك</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredRecords.map((record, idx) => {
            const subject = SUBJECTS.find(s => s.id === record.subjectId);
            const isConfirming = confirmDelete === record.id;

            return (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.03 }}
                key={record.id}
                className="bg-white dark:bg-slate-900 p-6 rounded-[36px] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all group relative overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-2 h-full ${subject?.color || 'bg-slate-400'}`} />
                
                <div className="flex flex-row-reverse items-center justify-between gap-6 mb-6">
                  <div className="flex flex-row-reverse items-center gap-4 text-right">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${subject?.color || 'bg-slate-400'}`}>
                      <History size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black arabic-text text-slate-800 dark:text-white leading-none mb-2">{subject?.nameAr}</h3>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">
                        {new Date(record.timestamp?.toDate ? record.timestamp.toDate() : record.timestamp).toLocaleDateString('ar-EG', { dateStyle: 'full' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-left">
                     <span className={`inline-flex px-4 py-1.5 rounded-full text-[10px] font-black arabic-text uppercase ${record.win ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {record.win ? 'فـوز مـستـحق ✨' : 'خـسارة تـعلـيمية 💪'}
                     </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-3xl text-center transition-colors">
                       <p className="text-[8px] text-slate-400 font-black uppercase mb-1">النتيجة</p>
                       <p className={`text-2xl font-black ${record.win ? 'text-green-500' : 'text-red-500'}`}>{record.score}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-3xl text-center transition-colors">
                       <p className="text-[8px] text-slate-400 font-black uppercase mb-1">المنافس</p>
                       <p className="text-sm font-black text-slate-800 dark:text-slate-200 arabic-text truncate">
                         {record.opponentScore !== undefined ? (record.score > record.opponentScore ? 'هزمت خصمك' : 'تفوّق عليك') : 'تحدي فردي'}
                       </p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-3xl text-center transition-colors">
                       <p className="text-[8px] text-slate-400 font-black uppercase mb-1">الدقة</p>
                       <p className="text-2xl font-black text-slate-800 dark:text-slate-200">
                         {record.questions ? Math.round((record.questions.filter(q => q.correct).length / record.questions.length) * 100) : 0}%
                       </p>
                    </div>
                </div>
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      setSelectedRecord(record);
                      soundManager.playClick();
                    }}
                    className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black arabic-text text-sm shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                  >
                    <Search size={16} />
                    مراجعة الأخطاء
                  </button>
                  <button 
                    onClick={() => setConfirmDelete(record.id)}
                    className="w-14 h-14 flex items-center justify-center bg-red-50 text-red-400 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm active:scale-95"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>

                {isConfirming && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-slate-900/98 flex flex-col items-center justify-center p-8 z-20 text-center"
                  >
                    <AlertCircle className="text-red-500 mb-4" size={48} />
                    <h4 className="text-white text-xl font-black arabic-text mb-2">تأكيد الحذف</h4>
                    <p className="text-slate-400 arabic-text text-sm mb-8">هل أنت متأكد من حذف هذا السجل نهائياً؟ لا يمكن التراجع عن هذا العمل.</p>
                    <div className="flex gap-4 w-full">
                      <button 
                        onClick={() => setConfirmDelete(null)}
                        className="flex-1 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold arabic-text transition-all"
                      >
                        إلغاء
                      </button>
                      <button 
                        onClick={() => handleDelete(record.id)}
                        className="flex-2 py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black arabic-text shadow-lg shadow-red-500/20 transition-all"
                      >
                        نعم، احذف السجل
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Detailed Review Modal */}
      <AnimatePresence>
        {selectedRecord && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4 md:p-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-[48px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20 dark:border-slate-800 transition-colors duration-300"
            >
              <div className="p-8 md:p-10 bg-slate-900 dark:bg-slate-950 text-white flex flex-row-reverse items-center justify-between sticky top-0 z-10 transition-colors">
                <div className="text-right">
                  <h3 className="text-2xl font-black arabic-text mb-1">تفاصيل التحدي 🕵️‍♂️</h3>
                  <p className="text-sm text-slate-400 arabic-text font-bold">مراجعة السؤال بسؤال</p>
                </div>
                <button 
                  onClick={() => setSelectedRecord(null)}
                  className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 md:p-10 space-y-6 custom-scrollbar dark:bg-slate-900/50">
                {selectedRecord.questions && selectedRecord.questions.length > 0 ? (
                  selectedRecord.questions.map((q, i) => {
                    const isAnswered = q.answerIndex !== undefined;
                    const isCorrect = q.correct === true;
                    
                    return (
                      <div key={i} className={`p-6 rounded-[32px] border-2 text-right relative overflow-hidden transition-all ${
                        !isAnswered ? 'border-slate-100 bg-slate-50/30' : 
                        isCorrect ? 'border-green-100 bg-green-50/30' : 'border-red-100 bg-red-50/30'
                      }`}>
                          <div className="flex flex-row-reverse items-start gap-4 mb-4">
                             <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${
                               !isAnswered ? 'bg-slate-100 text-slate-400' : 
                               isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                             }`}>
                                {!isAnswered ? <AlertCircle size={20} /> : isCorrect ? <CheckCircle size={20} /> : <XCircle size={20} />}
                             </div>
                             <div className="flex-1 text-right">
                               <p className="text-xs font-black text-slate-400 mb-1">السؤال {i + 1}</p>
                               <h4 className="text-lg font-black text-slate-800 dark:text-white arabic-text leading-relaxed transition-colors">
                                  {q.text || `سؤال في مادة ${SUBJECTS.find(s => s.id === selectedRecord.subjectId)?.nameAr}`}
                               </h4>
                             </div>
                          </div>
                          
                          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 transition-colors">
                             <p className={`text-sm font-bold arabic-text mb-4 transition-colors ${
                               !isAnswered ? 'text-slate-400' : 
                               isCorrect ? 'text-green-600' : 'text-red-500'
                             }`}>
                                {!isAnswered ? 'لم يتم الإجابة على هذا السؤال' : 
                                 isCorrect ? 'إجابتك كانت صحيحة 🎉' : 'الإجابة التي اخترتها غير صحيحة'}
                             </p>
                             <div className="space-y-2">
                               {q.options?.map((opt: string, optIdx: number) => {
                                 const isCorrectOpt = optIdx === q.correctAnswer;
                                 const isUserChoice = optIdx === q.answerIndex;
                                 return (
                                   <div 
                                     key={optIdx} 
                                     className={`p-4 rounded-2xl text-sm font-bold text-right arabic-text border-2 transition-all ${
                                       isCorrectOpt ? 'bg-green-50 dark:bg-green-900/20 border-green-500 text-green-700 dark:text-green-400 shadow-sm shadow-green-200 dark:shadow-none' : 
                                       isUserChoice ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400' : 
                                       'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                                     }`}
                                   >
                                     <div className="flex items-center justify-between flex-row-reverse">
                                       <span>{opt}</span>
                                       {isCorrectOpt && <CheckCircle size={16} className="text-green-600" />}
                                       {isUserChoice && !isCorrectOpt && <XCircle size={16} className="text-red-500" />}
                                     </div>
                                   </div>
                                 );
                               })}
                             </div>
                          </div>
                       </div>
                    );
                  })
                ) : (
                  <div className="p-10 text-center opacity-30">
                    <AlertCircle size={64} className="mx-auto mb-4" />
                    <p className="font-black arabic-text">السجلات القديمة قد لا تحتوي على تفاصيل الأسئلة</p>
                  </div>
                )}
              </div>

              <div className="p-8 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex flex-row-reverse gap-4 transition-colors">
                <button 
                  onClick={() => {
                    soundManager.playClick();
                    window.dispatchEvent(new CustomEvent('changeTab', { detail: 'dashboard' }));
                    setSelectedRecord(null);
                  }}
                  className="flex-1 py-4 bg-primary text-white rounded-[20px] font-black arabic-text shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                >
                  العودة للتحدي والممارسة
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
