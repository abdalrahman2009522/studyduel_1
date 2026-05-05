import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User, MessageSquare, X, Reply } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, limit, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { soundManager } from '../lib/soundManager';
import { toast } from 'react-hot-toast';

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  senderName: string;
  text: string;
  timestamp: any;
  read: boolean;
  replyTo?: {
    id: string;
    text: string;
  };
}

export function MessagingSystem() {
  const { user, profile } = useAuth();
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [activeChat, setActiveChat] = React.useState<string | null>(null);
  const [newMessage, setNewMessage] = React.useState('');
  const [replyingTo, setReplyingTo] = React.useState<Message | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'messages'),
      where('receiverId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [user]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || !newMessage.trim() || !activeChat) return;

    try {
      await addDoc(collection(db, 'messages'), {
        senderId: user.uid,
        receiverId: activeChat,
        senderName: profile.displayName,
        text: newMessage,
        read: false,
        timestamp: serverTimestamp(),
        ...(replyingTo && {
          replyTo: {
            id: replyingTo.id,
            text: replyingTo.text
          }
        })
      });

      setNewMessage('');
      setReplyingTo(null);
      soundManager.playClick();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReply = (msg: Message) => {
    setActiveChat(msg.senderId);
    setReplyingTo(msg);
  };

  const handleFirestoreError = (error: unknown, operationType: string, path: string | null) => {
    console.error(`Firestore ${operationType} failed at ${path}:`, error);
    toast.error('لم يتم حذف الرسالة: خطأ في الصلاحيات');
  };

  const deleteMessage = async (msgId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الرسالة؟')) return;
    try {
      console.log('Attempting to delete message:', msgId);
      await deleteDoc(doc(db, 'messages', msgId));
      console.log('Successfully deleted message');
      toast.success('تم حذف الرسالة');
      soundManager.playClick();
    } catch (err) {
      handleFirestoreError(err, 'delete', `messages/${msgId}`);
    }
  };

  if (!user) return null;

  return (
    <div className="bg-white rounded-[40px] p-6 shadow-xl border border-slate-100 h-[600px] flex flex-col">
      <div className="flex flex-row-reverse items-center justify-between mb-6">
        <div className="flex flex-row-reverse items-center gap-3">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-primary">
            <MessageSquare size={24} />
          </div>
          <div className="text-right">
            <h3 className="font-black arabic-text text-xl">الرسائل والمحادثات 💬</h3>
            <p className="text-[10px] font-black text-slate-400 arabic-text uppercase">تواصل مع أصدقائك</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2 custom-scrollbar" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-300 font-bold arabic-text italic">
            لا توجد رسائل واردة حالياً
          </div>
        ) : (
          messages.map(msg => (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              key={msg.id}
              className={`p-4 rounded-[28px] border-2 transition-all max-w-[85%] ml-auto text-right
                ${msg.read ? 'bg-slate-50 border-slate-100' : 'bg-white border-primary/20 shadow-lg'}
              `}
            >
              <div className="flex flex-row-reverse items-center justify-between mb-2">
                <span className="font-black arabic-text text-xs text-primary">{msg.senderName}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono text-slate-400">
                    {msg.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {msg.senderId === user.uid && (
                    <button onClick={() => deleteMessage(msg.id)} className="text-red-400 hover:text-red-600 transition-colors">
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>
              
              {msg.replyTo && (
                <div className="mb-3 p-3 bg-slate-100 rounded-2xl text-[10px] border-r-4 border-primary text-slate-500 arabic-text">
                  <p className="opacity-50 text-[8px] font-black uppercase mb-1">رداً على:</p>
                  {msg.replyTo.text}
                </div>
              )}
              
              <p className="arabic-text text-sm font-bold text-slate-700 leading-relaxed mb-3">
                {msg.text}
              </p>
              
              <button 
                onClick={() => handleReply(msg)}
                className="flex flex-row-reverse items-center gap-2 text-primary hover:text-blue-700 transition-colors mr-auto"
              >
                <Reply size={14} />
                <span className="text-[10px] font-black arabic-text">رد على الرسالة</span>
              </button>
            </motion.div>
          ))
        )}
      </div>

      <form onSubmit={sendMessage} className="relative mt-auto">
        <AnimatePresence>
          {replyingTo && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-full left-0 right-0 mb-2 p-3 bg-primary/5 rounded-2xl border border-primary/10 flex flex-row-reverse items-center justify-between"
            >
              <div className="text-right text-[10px] font-bold arabic-text text-primary">
                الرد على: <span className="opacity-70">{replyingTo.text.substring(0, 30)}...</span>
              </div>
              <button onClick={() => setReplyingTo(null)} className="text-primary/50 hover:text-primary">
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="flex flex-row-reverse gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={!activeChat}
            placeholder={activeChat ? "اكتب رسالتك هنا..." : "اضغط على رد للمراسلة"}
            className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-[20px] px-6 py-4 text-right arabic-text font-bold text-sm focus:border-primary focus:outline-none transition-all"
          />
          <button 
            type="submit"
            disabled={!newMessage.trim() || !activeChat}
            className="w-14 h-14 bg-primary text-white rounded-[20px] flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 disabled:opacity-50 transition-all"
          >
            <Send size={24} className="transform rotate-180" />
          </button>
        </div>

        {activeChat && (
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            {['أهلاً بك! 👋', 'شكراً لك 🙏', 'بالتوفيق في التحدي 💪', 'اللهم بارك 🇸🇦'].map(quickMsg => (
              <button
                key={quickMsg}
                type="button"
                onClick={() => setNewMessage(quickMsg)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold arabic-text text-slate-500 hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-all"
              >
                {quickMsg}
              </button>
            ))}
          </div>
        )}
      </form>
    </div>
  );
}
