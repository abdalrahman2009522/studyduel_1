import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Timer, 
  ChevronRight, 
  Trophy, 
  X, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  Snowflake,
  Zap,
  Heart,
  Skull,
  Sparkles,
  MessageSquare
} from 'lucide-react';
import { Question, SUBJECTS, ChallengeRecord } from '../types.ts';
import { QUESTIONS_DATA } from '../data/questions.ts';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { db } from '../lib/firebase';
import { collection, addDoc, updateDoc, doc, increment, serverTimestamp } from 'firebase/firestore';
import { GoogleGenAI } from "@google/genai";

import { soundManager } from '../lib/soundManager';

interface QuizModeProps {
  subjectId: string;
  onClose: () => void;
}

export function QuizMode({ subjectId, onClose }: QuizModeProps) {
  const { profile } = useAuth();
  const { socket } = useSocket();
  const [isFindingOpponent, setIsFindingOpponent] = React.useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
  const [selectedOption, setSelectedOption] = React.useState<number | null>(null);
  const [score, setScore] = React.useState(0);
  const [timer, setTimer] = React.useState(15);
  const [isFinished, setIsFinished] = React.useState(false);
  const [isReviewing, setIsReviewing] = React.useState(false);
  const [opponent, setOpponent] = React.useState<any>(null);
  const [answeredQuestions, setAnsweredQuestions] = React.useState<any[]>([]);
  const [recordId, setRecordId] = React.useState<string | null>(null);
  
  // Bot real-time progress simulation
  const [botScore, setBotScore] = React.useState(0);
  const [botQuestionIndex, setBotQuestionIndex] = React.useState(0);
  const [botStatus, setBotStatus] = React.useState<'thinking' | 'answered' | 'idle'>('idle');

  const [isGeneratingAI, setIsGeneratingAI] = React.useState(false);
  const [aiInsights, setAiInsights] = React.useState<string | null>(null);
  
  // Power-ups state
  const [powerUps, setPowerUps] = React.useState({
    freeze: 1,
    double: 1,
    heart: 1
  });
  const [isFrozen, setIsFrozen] = React.useState(false);
  const [isDoubleActive, setIsDoubleActive] = React.useState(false);
  const [hasHeartActive, setHasHeartActive] = React.useState(false);
  const [hearts, setHearts] = React.useState(3);

  // Trigger found sound when opponent is found
  React.useEffect(() => {
    if (!isFindingOpponent && opponent) {
      soundManager.playOpponentFound();
    }
  }, [isFindingOpponent, opponent]);

  // Handle timer sounds
  React.useEffect(() => {
    if (!isFindingOpponent && !isFinished && timer <= 5 && timer > 0 && !isFrozen) {
      soundManager.playTimer();
    }
  }, [timer, isFindingOpponent, isFinished, isFrozen]);

  const subject = SUBJECTS.find(s => s.id === subjectId);
  const questionsMap: Record<string, string> = {
    'arabic': 'arabic',
    'english': 'english',
    'islamic': 'islamic',
    'history': 'history'
  };
  const questionsKey = questionsMap[subjectId] || subjectId;
  const allQuestions = QUESTIONS_DATA[questionsKey] || [];
  
  // Limit to 10 questions and shuffle
  const [questions] = React.useState(() => {
    return [...allQuestions].sort(() => Math.random() - 0.5).slice(0, 10);
  });

  // Create initial record in Firestore once opponent is found
  React.useEffect(() => {
    if (!isFindingOpponent && opponent && profile && !recordId && !isFinished) {
      const createInitialRecord = async () => {
        try {
          const docRef = await addDoc(collection(db, 'challenge_records'), {
            userId: profile.uid,
            subjectId,
            opponentId: opponent?.uid || 'bot',
            score: 0,
            opponentScore: 0,
            win: false,
            status: 'active',
            currentQuestionIndex: 0,
            questions: questions.map(q => ({
              questionId: q.id,
              text: q.text,
              options: q.options,
              correctAnswer: q.correctAnswer
            })),
            timestamp: serverTimestamp()
          });
          setRecordId(docRef.id);
        } catch (err) {
          console.error("Failed to create initial record:", err);
        }
      };
      createInitialRecord();
    }
  }, [isFindingOpponent, opponent, profile, recordId, isFinished, questions, subjectId]);
  
  const currentQuestion = questions[currentQuestionIndex];

  // Simulating bot progress with adaptive logic
  React.useEffect(() => {
    if (!isFindingOpponent && opponent?.isBot && !isFinished && !isFrozen) {
      const simulateBot = () => {
        if (botQuestionIndex < questions.length) {
          // Adaptive delay: bot gets faster if it's behind, slower if it's way ahead
          const scoreDiff = botScore - score;
          const baseDelay = 5000;
          const variance = Math.random() * 3000;
          const adaptiveFactor = scoreDiff > 2 ? 2000 : scoreDiff < -2 ? -2000 : 0;
          const delay = Math.max(3000, baseDelay + variance + adaptiveFactor);

          setBotStatus('thinking');
          
          setTimeout(() => {
            if (isFinished) return;
            setBotStatus('answered');
            
            // Adaptive accuracy: bot gets smarter if user is near win, but stays around 70-85%
            const baseAccuracy = 0.75;
            const accuracyFactor = scoreDiff < -1 ? 0.1 : scoreDiff > 1 ? -0.1 : 0;
            const isCorrect = Math.random() < (baseAccuracy + accuracyFactor);
            
            if (isCorrect) setBotScore(s => s + 1);
            setBotQuestionIndex(i => i + 1);
            
            setTimeout(() => {
              if (isFinished) return;
              setBotStatus('idle');
              simulateBot();
            }, 1000);
          }, delay);
        }
      };
      simulateBot();
    }
  }, [isFindingOpponent, opponent, isFinished]);

  // State for search timer
  const [searchTimer, setSearchTimer] = React.useState(30);

  React.useEffect(() => {
    if (isFindingOpponent && searchTimer > 0 && !opponent) {
      const interval = setInterval(() => setSearchTimer(s => s - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [isFindingOpponent, searchTimer, opponent]);

  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    if (isFindingOpponent && socket) {
      socket.emit('duel:search', subjectId);
      
      socket.on('duel:found', (data) => {
        setOpponent(data.opponent);
      });
      
      return () => {
        socket.off('duel:found');
      };
    }
  }, [isFindingOpponent, socket, subjectId]);

  // Handle Bot timeout separately to avoid stale closures and redundant timers
  React.useEffect(() => {
    if (!isFindingOpponent || opponent) return;

    const botTimeout = setTimeout(() => {
      if (isFindingOpponent && !opponent) {
        const botData = { 
          displayName: 'بوت ذكي 🤖', 
          photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${Math.random()}`,
          isBot: true 
        };
        setOpponent(botData);
        
        // Auto-advance for bot
        setTimeout(() => {
          setIsReady(true);
          setIsFindingOpponent(false);
          soundManager.playOpponentFound();
        }, 1500);
      }
    }, 30000);

    return () => clearTimeout(botTimeout);
  }, [isFindingOpponent, opponent]);

  const handleReady = () => {
    soundManager.playClick();
    setIsReady(true);
    setTimeout(() => setIsFindingOpponent(false), 1000);
  };

  React.useEffect(() => {
    if (timer > 0 && !isFinished && !isReviewing && selectedOption === null && !isFrozen) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    } else if (timer === 0 && selectedOption === null && !isReviewing) {
      handleOptionSelect(-1); // Timeout
    }
  }, [timer, isFinished, isReviewing, selectedOption, isFrozen]);

  const generateAIInsights = async (finalScore: number) => {
    if (!profile) return;
    setIsGeneratingAI(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `أنت معلم ذكي ومحفز للطلاب. قام الطالب ${profile.displayName} بإنهاء تحدي في مادة ${subject?.nameAr}. 
      نتيجته كانت ${finalScore} من أصل ${questions.length} أسئلة. 
      الأسئلة التي أجاب عليها هي: ${JSON.stringify(answeredQuestions.map((aq, i) => ({ 
        text: questions[i]?.text, 
        correct: aq.correct 
      })))}.
      اكتب تعليقاً مشجعاً ومختصراً جداً (سطرين فقط) باللغة العربية، يبرز نقاط القوة ويقدم نصيحة للتحسن.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      setAiInsights(response.text);
    } catch (err) {
      console.error("AI Insight failed:", err);
      const isQuotaExceeded = (err instanceof Error && err.message.includes('429')) || 
                             (typeof err === 'string' && err.includes('429')) ||
                             (err && typeof err === 'object' && JSON.stringify(err).includes('429'));
      
      if (isQuotaExceeded) {
          setAiInsights("ميزة الذكاء الاصطناعي تجاوزت الحد المسموح للاستخدام حالياً، يرجى المحاولة غداً!");
      } else {
          setAiInsights("أداء رائع! استمر في المحاولة وستصل للقمة بالتأكيد.");
      }
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const saveResult = async (finalScore: number) => {
    if (!profile || !recordId) return;
    
    const xpGained = finalScore * 15;
    const pointsGained = finalScore * 5;
    const win = finalScore >= (questions.length / 2); 

    generateAIInsights(finalScore);

    try {
      // Update record in Review Center
      await updateDoc(doc(db, 'challenge_records', recordId), {
        score: finalScore,
        opponentScore: opponent?.isBot ? botScore : Math.floor(Math.random() * questions.length),
        win,
        status: 'completed',
        timestamp: serverTimestamp()
      });

      // Update user stats
      const userRef = doc(db, 'users', profile.uid);
      await updateDoc(userRef, {
        'stats.xp': increment(xpGained),
        'stats.points': increment(pointsGained),
        'stats.wins': increment(win ? 1 : 0),
        'stats.totalDuels': increment(1)
      });
    } catch (err) {
      console.error("Failed to update results:", err);
    }
  };

  const handleOptionSelect = async (optionIndex: number) => {
    if (selectedOption !== null) return;
    
    const isCorrect = optionIndex === currentQuestion.correctAnswer;
    setSelectedOption(optionIndex);
    
    // Calculate points with double multiplier
    const pointsToAdd = isCorrect ? (isDoubleActive ? 2 : 1) : 0;
    
    setAnsweredQuestions(prev => [
      ...prev, 
      { questionId: currentQuestion.id, correct: isCorrect, answerIndex: optionIndex }
    ]);

    // Update session record in real-time
    if (recordId) {
       try {
         const updatedQuestions = questions.map((q, idx) => {
           if (idx === currentQuestionIndex) {
              return {
                questionId: q.id,
                text: q.text,
                options: q.options,
                correctAnswer: q.correctAnswer,
                correct: isCorrect,
                answerIndex: optionIndex
              };
           }
           const existingAnswer = answeredQuestions.find(aq => aq.questionId === q.id);
           if (existingAnswer) {
             return {
               questionId: q.id,
               text: q.text,
               options: q.options,
               correctAnswer: q.correctAnswer,
               correct: existingAnswer.correct,
               answerIndex: existingAnswer.answerIndex
             };
           }
           return {
             questionId: q.id,
             text: q.text,
             options: q.options,
             correctAnswer: q.correctAnswer
           };
         });

         await updateDoc(doc(db, 'challenge_records', recordId), {
           questions: updatedQuestions,
           currentQuestionIndex: currentQuestionIndex + 1,
           score: score + pointsToAdd
         });
       } catch (err) {
         console.error("Failed to update real-time progress:", err);
       }
    }

    if (isCorrect) {
      soundManager.playSuccess();
      setScore(s => s + pointsToAdd);
      // Consume double XP after use
      if (isDoubleActive) {
        setIsDoubleActive(false);
      }
    } else {
      soundManager.playError();
      setHearts(h => Math.max(0, h - 1));
    }

    setTimeout(() => {
      const nextIndex = currentQuestionIndex + 1;
      const willBeFinished = nextIndex >= questions.length || (hearts <= 0 && !isCorrect);
      
      if (!willBeFinished) {
        setCurrentQuestionIndex(nextIndex);
        setSelectedOption(null);
        setTimer(15);
        if (isFrozen) setIsFrozen(false);
      } else {
        setIsFinished(true);
        saveResult(score + pointsToAdd);
      }
    }, 1500);
  };

  const usePowerUp = (type: 'freeze' | 'double' | 'heart') => {
    if (powerUps[type] <= 0 || selectedOption !== null || isFinished) return;
    
    soundManager.playPowerUp();
    setPowerUps(prev => ({ ...prev, [type]: prev[type] - 1 }));
    
    switch(type) {
      case 'freeze':
        setIsFrozen(true);
        // Freeze for 10 seconds as stated in some UI parts
        setTimeout(() => setIsFrozen(false), 10000);
        break;
      case 'double':
        setIsDoubleActive(true);
        break;
      case 'heart':
        setHearts(h => Math.min(5, h + 1));
        break;
    }
  };

  const handleCancel = () => {
    if (opponent) {
      if (window.confirm('هل أنت متأكد من الانسحاب من هذه المواجهة؟ سيتم خصم نقاط من رصيدك.')) {
        onClose();
        soundManager.playError();
      }
    } else {
      if (window.confirm('هل تريد إلغاء البحث عن خصم؟')) {
        onClose();
        soundManager.playClick();
      }
    }
  };

  if (isFindingOpponent) {
    return (
      <div className="fixed inset-0 bg-[#0F172A] z-[70] flex flex-col items-center justify-center p-6 text-white overflow-hidden">
        {/* Close Button during search */}
        <button 
          onClick={handleCancel}
          className="absolute top-8 right-8 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center transition-all z-20"
        >
          <X size={24} />
        </button>
        
        <div className="flex flex-col items-center max-w-4xl w-full">
          <div className="flex items-center justify-center gap-6 md:gap-12 mb-12">
            <motion.div 
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ type: "spring", damping: 15 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                <div className="relative w-24 h-24 md:w-32 md:h-32 bg-slate-900 rounded-full border-4 border-slate-800 flex items-center justify-center text-3xl font-black overflow-hidden shadow-2xl">
                  <img src={profile?.photoURL} alt="Me" className="w-full h-full object-cover" />
                </div>
              </div>
              <span className="font-extrabold arabic-text text-xl bg-white/10 px-4 py-1 rounded-full backdrop-blur-md border border-white/10 uppercase tracking-tighter">
                {profile?.displayName}
              </span>
            </motion.div>
            
            <motion.div 
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", duration: 0.8 }}
              className="relative"
            >
              <div className="text-secondary text-5xl md:text-7xl font-black italic drop-shadow-[0_0_15px_rgba(245,158,11,0.5)] z-10 relative">
                VS
              </div>
              <motion.div 
                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="absolute inset-0 bg-secondary rounded-full blur-2xl -z-10"
              />
            </motion.div>

            <motion.div 
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ type: "spring", damping: 15 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="relative">
                {!opponent && (
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="absolute -inset-2 bg-gradient-to-r from-blue-500/20 to-primary/20 rounded-full border-2 border-dashed border-white/20"
                  />
                )}
                <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full bg-slate-900 border-4 border-slate-800 flex items-center justify-center text-3xl font-black overflow-hidden shadow-2xl">
                  {opponent ? (
                    <img src={opponent.photoURL} alt="Opponent" className="w-full h-full object-cover" />
                  ) : (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <motion.div 
                        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="absolute inset-0 bg-primary rounded-full"
                      />
                      <motion.div 
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="text-white/20 text-5xl relative z-10"
                      >
                        ?
                      </motion.div>
                    </div>
                  )}
                </div>
              </div>
              <span className="font-extrabold arabic-text text-xl bg-white/10 px-4 py-1 rounded-full backdrop-blur-md border border-white/10 uppercase tracking-tighter">
                {opponent ? opponent.displayName : 'جاري البحث...'}
              </span>
            </motion.div>
          </div>

          <div className="space-y-6">
            <motion.h2 
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-4xl md:text-5xl font-black arabic-text"
            >
              {opponent ? 'تم العثور على خصم!' : 'جاري البحث عن منافس...'}
            </motion.h2>
            <p className="text-slate-400 text-lg arabic-text opacity-90 max-w-md mx-auto">
              {opponent ? (isReady ? 'في انتظار المنافس...' : 'المنافس جاهز، هل أنت مستعد؟') : `نقوم حالياً بالبحث عن طالب في نفس مستواك... ${searchTimer} ثانية متبقية`}
            </p>
          </div>

          <div className="w-full max-w-md mx-auto h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 p-1">
            <motion.div 
              initial={{ width: 0 }}
              animate={opponent ? { width: "100%" } : { width: "90%" }}
              transition={opponent ? { duration: 0.5 } : { duration: 10, ease: "linear" }}
              className="h-full bg-gradient-to-r from-primary to-blue-400 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.5)]"
            />
          </div>

          {opponent && !isReady && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleReady}
              className="px-12 py-5 bg-secondary text-white rounded-3xl font-black arabic-text text-2xl shadow-2xl shadow-secondary/30 hover:bg-amber-500 transition-all"
            >
              جاهز للتحدي! ⚔️
            </motion.button>
          )}
        </div>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="fixed inset-0 bg-background z-[60] flex items-center justify-center p-6 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="max-w-xl w-full"
        >
          <div className="bg-surface rounded-[40px] p-8 md:p-12 text-center space-y-8 shadow-2xl shadow-primary/10 border border-slate-100 dark:border-slate-800 transition-colors duration-300">
            <div className="relative inline-block">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-amber-100 dark:bg-amber-900/20 rounded-full scale-150 blur-3xl opacity-50"
              />
              <div className="relative w-32 h-32 bg-amber-400 rounded-[32px] flex items-center justify-center mx-auto text-white shadow-2xl shadow-amber-500/30 transform -rotate-6">
                <Trophy size={64} strokeWidth={2.5} />
              </div>
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.5 }}
                className="absolute -top-4 -right-4 w-14 h-14 bg-green-500 rounded-2xl flex items-center justify-center text-white border-4 border-surface shadow-xl"
              >
                <CheckCircle2 size={32} />
              </motion.div>
            </div>

            <div className="space-y-2">
              <h2 className="text-4xl font-black arabic-text text-text-main">انتهت الجولة! ✨</h2>
              <p className="text-text-muted arabic-text font-bold text-lg">لقد قمت بعمل رائع في هذه المواجهة</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-[28px] border border-slate-100 dark:border-slate-800 group hover:border-primary transition-all">
                <p className="text-xs text-text-muted arabic-text font-black uppercase tracking-widest mb-2">الدقة</p>
                <p className="text-3xl font-black text-text-main">{Math.round((score / questions.length) * 100)}%</p>
                <p className="text-[10px] font-bold text-text-muted arabic-text mt-1">{score} من {questions.length} صحيح</p>
              </div>
              <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-[28px] border border-blue-100 dark:border-blue-800 group hover:border-blue-500 transition-all">
                <p className="text-xs text-blue-400 arabic-text font-black uppercase tracking-widest mb-2">الجوائز</p>
                <p className="text-3xl font-black text-blue-600">+{score * 15} XP</p>
                <p className="text-[10px] font-bold text-blue-400 arabic-text mt-1">تمت إضافتها لملفك</p>
              </div>
            </div>

            {/* AI Study Coach */}
            <div className="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950 dark:to-slate-900 p-6 rounded-[32px] border border-indigo-100 dark:border-indigo-900 shadow-lg text-right relative overflow-hidden">
               <div className="absolute top-4 left-4 text-indigo-200 dark:text-indigo-900/30">
                  <Sparkles size={40} />
               </div>
               <h4 className="text-sm font-black arabic-text text-indigo-600 dark:text-indigo-400 mb-2 flex flex-row-reverse items-center gap-2">
                  <Sparkles size={16} />
                  نصيحة المعلم الذكي
               </h4>
               {isGeneratingAI ? (
                 <div className="flex flex-row-reverse items-center gap-2">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-200"></div>
                 </div>
               ) : (
                 <p className="text-text-main arabic-text font-bold leading-relaxed relative z-10 transition-colors duration-300">
                   {aiInsights || "جارِ تحليل أدائك..."}
                 </p>
               )}
            </div>

            {/* Quick Messages */}
            <div className="space-y-3">
               <p className="text-[10px] font-black text-slate-300 arabic-text uppercase tracking-widest">رسائل سريعة للمنافس</p>
               <div className="flex flex-wrap justify-center gap-2">
                  {['لعب رائع! 🤝', 'مواجهة قوية! 🔥', 'تحتاج لمراجعة أكثر 😉', 'هل تريد جولة أخرى؟ 🔄'].map(msg => (
                    <button 
                      key={msg}
                      onClick={() => {
                        soundManager.playClick();
                        // In a real app, this would emit to socket
                        alert(`تم إرسال: ${msg}`);
                      }}
                      className="px-4 py-2 bg-white border border-slate-200 rounded-2xl text-xs font-bold arabic-text text-slate-600 hover:bg-primary hover:text-white hover:border-primary transition-all"
                    >
                      {msg}
                    </button>
                  ))}
               </div>
            </div>

            <div className="pt-4 flex flex-col gap-4">
              <button 
                onClick={() => setIsReviewing(true)}
                className="w-full py-5 bg-slate-100 text-slate-800 rounded-3xl font-black arabic-text text-xl flex items-center justify-center gap-3 shadow-xl hover:bg-slate-200 transition-all"
              >
                مراجعة الإجابات 📖
              </button>
              <button 
                onClick={onClose}
                className="w-full py-5 bg-primary text-white rounded-3xl font-black arabic-text text-xl flex items-center justify-center gap-3 shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
              >
                العودة للرئيسية
                <ArrowRight size={24} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (isReviewing) {
    return (
      <div className="fixed inset-0 bg-[#F8FAFC] z-[80] flex flex-col overflow-hidden">
        <div className="px-6 py-6 border-b border-slate-100 dark:border-slate-800 bg-surface flex items-center justify-between transition-colors duration-300">
          <button onClick={() => setIsReviewing(false)} className="w-12 h-12 flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-2xl">
            <X size={24} className="text-text-main" />
          </button>
          <h2 className="text-xl font-black arabic-text text-text-main">مراجعة الأخطاء 📖</h2>
          <div className="w-12" />
        </div>
        <div className="flex-1 overflow-y-auto p-6 bg-background">
          <div className="max-w-3xl mx-auto space-y-6">
            {questions.map((q, idx) => {
              const answer = answeredQuestions.find(aq => aq.questionId === q.id);
              const isCorrect = answer?.correct;
              return (
                <div key={idx} className={`p-6 rounded-[32px] border-2 bg-surface transition-colors duration-300 ${isCorrect ? 'border-green-100 dark:border-green-900/30' : 'border-red-100 dark:border-red-900/30'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-4 py-1 rounded-full text-[10px] font-black arabic-text ${isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {isCorrect ? 'إجابة صحيحة' : 'إجابة خاطئة'}
                    </span>
                    <span className="text-text-muted font-bold text-sm">سؤال {idx + 1}</span>
                  </div>
                  <h3 className="text-lg font-black arabic-text text-right mb-6 text-text-main">{q.text}</h3>
                    <div className="space-y-3">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className={`p-4 rounded-2xl border-2 text-right arabic-text font-bold transition-all
                          ${oIdx === q.correctAnswer ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400' : 
                            oIdx === answer?.answerIndex && !isCorrect ? 'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400' : 'bg-slate-50/50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 text-text-muted'}
                        `}>
                          {opt}
                        </div>
                      ))}
                    </div>
                  {q.explanation && (
                    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl text-right arabic-text text-sm text-blue-600 dark:text-blue-400 leading-relaxed">
                      <strong>الشرح:</strong> {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="p-6 bg-surface border-t border-slate-100 dark:border-slate-800 transition-colors duration-300">
           <button onClick={onClose} className="w-full py-4 bg-primary text-white rounded-2xl font-black arabic-text shadow-lg">إنهاء المراجعة 🚀</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background z-[60] flex flex-col overflow-hidden transition-colors duration-300">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-full h-[300px] bg-primary/5 -skew-y-3 origin-top-right -z-10" />

      {/* Header with Opponent Info */}
      <div className="px-6 py-4 flex items-center justify-between bg-surface border-b transition-colors duration-300 shadow-sm z-10">
        <div className="flex items-center gap-4 flex-row-reverse">
          <div className="relative">
            <div className="absolute -inset-1 bg-primary/30 rounded-2xl blur-sm animate-pulse"></div>
            <img src={profile?.photoURL} className="relative w-12 h-12 rounded-2xl border-2 border-primary shadow-lg" alt="Me" />
            <div className="absolute -top-2 -right-2 bg-primary text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg border border-white">أنت 👤</div>
            {isDoubleActive && (
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -bottom-2 -left-2 bg-amber-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white shadow-lg"
              >
                2x
              </motion.div>
            )}
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-text-main tabular-nums">{score}</div>
          </div>
        </div>

        <div className="flex flex-col items-center">
           <div className={`
              flex items-center gap-3 px-6 py-1.5 rounded-full border-2 transition-all shadow-inner relative
              ${timer < 5 ? 'bg-red-50 border-red-500 text-red-500 animate-pulse' : isFrozen ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 text-blue-500' : 'bg-surface border-slate-200 dark:border-slate-700 text-text-main'}
            `}>
              {isFrozen && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-blue-400/20 rounded-full backdrop-blur-[2px]"
                />
              )}
              {isFrozen ? <Snowflake className="animate-spin" size={16} /> : <Timer size={16} />}
              <span className="font-mono text-lg font-black tracking-tighter">
                {timer.toString().padStart(2, '0')}s
              </span>
            </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-left">
            <div className="text-2xl font-black text-text-main tabular-nums">{opponent?.isBot ? botScore : '...'}</div>
            {opponent?.isBot && (
              <div className="text-[9px] font-black arabic-text uppercase tracking-tighter h-3">
                {botStatus === 'thinking' && <span className="text-blue-500 animate-pulse">يفكر... 🧠</span>}
                {botStatus === 'answered' && <span className="text-green-500">أجاب! ✅</span>}
              </div>
            )}
          </div>
          <div className="relative">
            <div className={`absolute -inset-1 rounded-2xl blur-sm ${opponent?.isBot ? 'bg-purple-400/30' : 'bg-slate-400/30'}`}></div>
            <img src={opponent?.photoURL} className="relative w-12 h-12 rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-lg object-cover" alt="Opponent" />
            <div className={`absolute -top-2 -left-2 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg border border-white ${opponent?.isBot ? 'bg-purple-600' : 'bg-slate-600'}`}>
              {opponent?.isBot ? 'ذكاء اصطناعي 🤖' : 'الخصم 👤'}
            </div>
          </div>
        </div>
      </div>

      {/* Duel Progress Tracks - Enhanced Color Bar Design */}
      <div className="w-full bg-surface px-6 py-5 flex flex-col gap-4 border-b border-slate-100 dark:border-slate-800 transition-colors duration-300 shadow-inner">
        {/* User Track */}
        <div className="flex flex-row-reverse items-center gap-4">
          <div className="w-10 text-[10px] font-black text-primary arabic-text">أنت</div>
          <div className="relative h-3 bg-slate-100 dark:bg-slate-800 rounded-full flex-1 overflow-visible shadow-inner border border-slate-50 dark:border-slate-800">
            <motion.div 
              animate={{ width: `${((currentQuestionIndex) / questions.length) * 100}%` }}
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-blue-400 rounded-full transition-all shadow-[0_0_8px_rgba(59,130,246,0.5)]"
            />
            <motion.div 
              animate={{ left: `${((currentQuestionIndex) / questions.length) * 100}%` }}
              className="absolute -top-1.5 -translate-x-1/2 w-6 h-6 bg-white dark:bg-slate-800 border-4 border-primary rounded-xl shadow-xl z-10 flex items-center justify-center transition-colors duration-300"
            >
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-ping" />
            </motion.div>
          </div>
        </div>
        
        {/* Opponent Track */}
        <div className="flex flex-row-reverse items-center gap-4">
          <div className="w-10 text-[10px] font-black text-text-muted arabic-text">الخصم</div>
          <div className="relative h-3 bg-slate-100 dark:bg-slate-800 rounded-full flex-1 overflow-visible shadow-inner border border-slate-50 dark:border-slate-800">
            <motion.div 
              animate={{ width: `${(opponent?.isBot ? (botQuestionIndex / questions.length) * 100 : 0)}%` }}
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-slate-400 to-slate-600 rounded-full transition-all shadow-[0_0_8px_rgba(71,85,105,0.3)]"
            />
            <motion.div 
              animate={{ left: `${(opponent?.isBot ? (botQuestionIndex / questions.length) * 100 : 0)}%` }}
              className="absolute -top-1.5 -translate-x-1/2 w-6 h-6 bg-white dark:bg-slate-800 border-4 border-slate-400 rounded-xl shadow-xl z-10 flex items-center justify-center transition-colors duration-300"
            >
               <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-6 pb-24 relative">
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center lg:min-h-[500px]">
          
          {/* Power Ups Sidebar - Desktop */}
          <div className="lg:col-span-1 hidden lg:flex flex-col gap-4">
              <button 
                onClick={() => usePowerUp('freeze')}
                disabled={powerUps.freeze === 0 || isFrozen || selectedOption !== null}
                className={`p-4 rounded-3xl border-2 transition-all flex flex-col items-center gap-2 group relative
                  ${powerUps.freeze > 0 ? 'bg-surface border-blue-100 dark:border-blue-900 text-blue-500 hover:scale-110 shadow-xl shadow-blue-500/5' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600'}
                `}
              >
                <Snowflake size={28} className={isFrozen ? 'animate-spin' : ''} />
                {powerUps.freeze > 0 && <span className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white dark:border-slate-800">{powerUps.freeze}</span>}
              </button>
              <button 
                onClick={() => usePowerUp('double')}
                disabled={powerUps.double === 0 || isDoubleActive || selectedOption !== null}
                className={`p-4 rounded-3xl border-2 transition-all flex flex-col items-center gap-2 group relative
                  ${powerUps.double > 0 ? 'bg-surface border-amber-100 dark:border-amber-900 text-amber-500 hover:scale-110 shadow-xl shadow-amber-500/5' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600'}
                `}
              >
                <Zap size={28} className={isDoubleActive ? 'animate-pulse' : ''} />
                {powerUps.double > 0 && <span className="absolute -top-2 -right-2 w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white dark:border-slate-800">{powerUps.double}</span>}
              </button>
              <button 
                onClick={() => usePowerUp('heart')}
                disabled={powerUps.heart === 0 || selectedOption !== null}
                className={`p-4 rounded-3xl border-2 transition-all flex flex-col items-center gap-2 group relative
                  ${powerUps.heart > 0 ? 'bg-surface border-red-100 dark:border-red-900 text-red-500 hover:scale-110 shadow-xl shadow-red-500/5' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600'}
                `}
              >
                <Heart size={28} />
                {powerUps.heart > 0 && <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white dark:border-slate-800">{powerUps.heart}</span>}
              </button>
          </div>

          {/* Question Hub */}
          <div className="lg:col-span-11 w-full space-y-8">
            <AnimatePresence mode="wait">
              <motion.div 
                key={currentQuestionIndex}
                initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
                className="w-full"
              >
                <div className="bg-surface p-8 md:p-12 rounded-[40px] shadow-2xl shadow-primary/5 border border-slate-100 dark:border-slate-800 mb-8 relative transition-colors duration-300">
                  {isDoubleActive && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white px-4 py-1 rounded-full text-[10px] font-black arabic-text shadow-lg shadow-amber-500/40">
                      قوة مضاعفة النقاط نشطة! ⚡
                    </div>
                  )}
                  <div className="flex flex-row-reverse items-center gap-3 mb-6">
                    <div className={`w-3 h-8 rounded-full ${subject?.color}`}></div>
                    <span className="text-sm font-black arabic-text text-text-muted uppercase tracking-widest">
                      {subject?.nameAr}
                    </span>
                  </div>
                  <h2 className="text-2xl md:text-4xl font-black arabic-text leading-relaxed text-right text-text-main transition-colors duration-300">
                    {currentQuestion.text}
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentQuestion.options.map((option, idx) => {
                    let statusClass = "bg-surface border-slate-100 dark:border-slate-800 hover:border-primary hover:bg-blue-50/10 dark:hover:bg-primary/5 hover:shadow-lg hover:-translate-y-0.5 text-text-main";
                    let icon = null;
                    let labelClass = "bg-slate-50 dark:bg-slate-800 text-text-muted";

                    if (selectedOption !== null) {
                      if (idx === currentQuestion.correctAnswer) {
                        statusClass = "bg-gradient-to-br from-green-400 to-green-600 border-green-300 text-white shadow-2xl shadow-green-500/30 ring-4 ring-green-100 dark:ring-green-900/40";
                        icon = <CheckCircle2 size={24} className="text-white" />;
                        labelClass = "bg-white/20 text-white";
                      } else if (idx === selectedOption) {
                        statusClass = "bg-gradient-to-br from-red-500 to-red-700 border-red-400 text-white shadow-2xl shadow-red-500/30 ring-4 ring-red-100 dark:ring-red-900/40";
                        icon = <Skull size={24} className="text-white" />;
                        labelClass = "bg-white/20 text-white";
                      } else {
                        statusClass = "bg-slate-50 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 opacity-40 grayscale text-text-muted cursor-not-allowed transform scale-[0.98]";
                      }
                    }

                    return (
                      <motion.button
                        key={idx}
                        whileTap={selectedOption === null ? { scale: 0.98 } : {}}
                        onClick={() => handleOptionSelect(idx)}
                        disabled={selectedOption !== null}
                        className={`
                          w-full p-6 h-full min-h-[100px] rounded-[32px] border-2 flex flex-row-reverse items-center justify-between transition-all duration-300
                          ${statusClass}
                        `}
                      >
                        <span className="text-lg md:text-xl font-black arabic-text leading-snug flex-1 text-right">{option}</span>
                        <div className="flex items-center gap-4">
                           {icon}
                           <div className={`
                            w-10 h-10 rounded-2xl flex items-center justify-center font-black transition-all
                            ${labelClass}
                           `}>
                            {String.fromCharCode(65 + idx)}
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Mobile Power Ups Overlay */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-6 bg-surface/90 backdrop-blur-2xl p-5 rounded-[36px] border border-white/20 dark:border-slate-800 shadow-2xl shadow-primary/20 z-50 transition-all duration-300">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => usePowerUp('freeze')}
            disabled={powerUps.freeze === 0 || isFrozen || selectedOption !== null}
            className={`w-14 h-14 flex items-center justify-center rounded-2xl transition-all relative
              ${powerUps.freeze > 0 ? 'bg-blue-100 text-blue-600 shadow-lg shadow-blue-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-300 opacity-50'}
              ${isFrozen ? 'ring-4 ring-blue-400 ring-offset-2 dark:ring-offset-slate-900 border-none' : ''}
            `}
          >
            <Snowflake size={28} className={isFrozen ? 'animate-spin' : ''} />
            <div className="absolute -top-2 -right-2 flex flex-col items-center">
              {powerUps.freeze > 0 && <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-[10px] font-black border-2 border-surface shadow-lg">{powerUps.freeze}</span>}
            </div>
            {isFrozen && (
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-black text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full">
                مجمد! ❄️
              </div>
            )}
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => usePowerUp('double')}
            disabled={powerUps.double === 0 || isDoubleActive || selectedOption !== null}
            className={`w-14 h-14 flex items-center justify-center rounded-2xl transition-all relative
              ${powerUps.double > 0 ? 'bg-amber-100 text-amber-600 shadow-lg shadow-amber-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-300 opacity-50'}
              ${isDoubleActive ? 'ring-4 ring-amber-400 ring-offset-2 dark:ring-offset-slate-900 border-none' : ''}
            `}
          >
            <Zap size={28} className={isDoubleActive ? 'animate-pulse' : ''} />
            <div className="absolute -top-2 -right-2">
              {powerUps.double > 0 && <span className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-[10px] font-black border-2 border-surface shadow-lg">{powerUps.double}</span>}
            </div>
            {isDoubleActive && (
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-black text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">
                مضاعف ⚡
              </div>
            )}
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => usePowerUp('heart')}
            disabled={powerUps.heart === 0 || hearts >= 5 || selectedOption !== null}
            className={`w-14 h-14 flex items-center justify-center rounded-2xl transition-all relative
              ${powerUps.heart > 0 ? 'bg-red-100 text-red-600 shadow-lg shadow-red-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-300 opacity-50'}
            `}
          >
            <Heart size={28} />
            <div className="absolute -top-2 -right-2">
              {powerUps.heart > 0 && <span className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-black border-2 border-surface shadow-lg">{powerUps.heart}</span>}
            </div>
          </motion.button>
      </div>
    </div>
  );
}
