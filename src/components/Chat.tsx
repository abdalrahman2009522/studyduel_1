import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Smile, 
  Sword, 
  Trash2, 
  Edit2, 
  Heart, 
  Reply, 
  X, 
  Check,
  Flag,
  User,
  Zap,
  Ban,
  MessageSquare,
  Crown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { soundManager } from '../lib/soundManager';
import { auth, db } from '../lib/firebase';
import { doc, onSnapshot, deleteDoc, collection, query, orderBy, limit, updateDoc, arrayUnion, addDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderLevel?: number;
  senderRole?: 'admin' | 'moderator' | 'user';
  timestamp: string;
  likes: string[];
  replyTo?: {
    id: string;
    text: string;
    senderName: string;
  };
  isChallenge?: boolean;
  isEdited?: boolean;
}

const EMOJIS = ['🤝', '🔥', '⚔️', '✨', '📚', '💡', '🚀', '💯', '👏', '🎯', '🏅'];

const MessageBubble = React.memo(({ msg, isMe, isViewerAdmin, hasLiked, onReply, onEdit, onDelete, onToggleLike, onBlock, onReport }: { 
  msg: Message, 
  isMe: boolean, 
  isViewerAdmin: boolean,
  hasLiked: boolean, 
  onReply: (m: Message) => void,
  onEdit: (m: Message) => void,
  onDelete: (id: string) => void,
  onToggleLike: (id: string) => void,
  onBlock: (userId: string) => void,
  onReport: (m: Message) => void,
}) => {
  const isSenderAdmin = msg.senderRole === 'admin' || msg.senderRole === 'moderator' || (isMe && isViewerAdmin);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className={`flex ${isMe ? 'flex-row-reverse' : 'flex-row'} items-start gap-4 group px-2`}
    >
      <div className="relative shrink-0">
        <img 
          src={msg.senderAvatar} 
          alt="Avatar" 
          className={`w-10 h-10 rounded-[14px] shadow-lg border-2 transition-all duration-500 ${isSenderAdmin ? 'border-amber-400 scale-110 shadow-amber-200' : 'border-white'}`} 
        />
        {isSenderAdmin && (
          <div className="absolute -top-3 -right-2 bg-gradient-to-br from-yellow-400 to-amber-600 text-white rounded-full p-2 shadow-md shadow-amber-300 animate-bounce transition-transform duration-300">
            <Crown size={14} fill="currentColor" />
          </div>
        )}
      </div>

      <div className={`max-w-[80%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
        {!isMe && (
          <div className="flex flex-row-reverse items-center gap-2 mb-1 px-1">
            <span className={`text-[10px] font-black arabic-text ${isSenderAdmin ? 'text-amber-600 font-black tracking-wide' : 'text-slate-500'}`}>
              {isSenderAdmin && "✨ "}
              {msg.senderName} 
              {isSenderAdmin && (msg.senderRole === 'admin' || (isMe && isViewerAdmin) ? ' (أدمن)' : ' (مشرف)')}
            </span>
          </div>
        )}

        <div className={`relative group/bubble flex items-center gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
          <div className={`
            px-5 py-3.5 rounded-[24px] shadow-sm relative transition-all duration-500 overflow-hidden border
            ${isMe 
              ? (isSenderAdmin ? 'bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 shadow-[0_10px_40px_-10px_rgba(245,158,11,0.5)] border-amber-300/50 rounded-tr-none text-white' : 'bg-primary text-white rounded-tr-none shadow-lg shadow-primary/20 border-transparent')
              : (isSenderAdmin ? 'bg-gradient-to-br from-amber-50 via-yellow-50 to-white border-amber-300 shadow-xl shadow-amber-200/50 rounded-tl-none' : 'bg-white text-slate-800 rounded-tl-none border-slate-200 shadow-md shadow-slate-200/20 shadow-sm border-transparent')
            }
          `}>
            {isSenderAdmin && (
              <div className="absolute -right-6 -bottom-6 opacity-[0.2] rotate-12 pointer-events-none transition-transform duration-700 group-hover/bubble:rotate-0 group-hover/bubble:scale-125">
                <Crown size={100} fill="currentColor" className="text-amber-500" />
              </div>
            )}

            {isSenderAdmin && (
              <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-[0.05] bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,1),transparent)]" />
            )}

            {msg.replyTo && (
              <div className={`mb-3 p-3 rounded-2xl text-[10px] border-r-4 italic overflow-hidden ${isMe ? 'bg-white/10 border-white/50 text-white/80' : 'bg-slate-50 border-primary text-slate-500'}`}>
                <div className="font-black uppercase mb-1 opacity-60">رداً على: {msg.replyTo.senderName}</div>
                <p className="truncate">{msg.replyTo.text}</p>
              </div>
            )}
            
            <p className={`arabic-text font-bold leading-relaxed whitespace-pre-wrap relative z-10 ${isMe ? 'text-white' : (isSenderAdmin ? 'text-amber-900' : 'text-slate-700')}`}>
              {msg.text}
            </p>
          </div>

          <div className={`flex items-center gap-1 opacity-0 group-hover/bubble:opacity-100 transition-all duration-200 ${isMe ? 'mr-2' : 'ml-2'}`}>
            <button onClick={() => onReply(msg)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-primary transition-all">
              <Reply size={14} />
            </button>
            {(isMe || isViewerAdmin) && (
              <>
                {isMe && (
                  <button onClick={() => onEdit(msg)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-emerald-500 transition-all">
                    <Edit2 size={14} />
                  </button>
                )}
                <button onClick={() => onDelete(msg.id)} className="p-2 hover:bg-red-50 rounded-xl text-slate-400 hover:text-red-500 transition-all">
                  <Trash2 size={14} />
                </button>
              </>
            )}
            <button
              onClick={() => onToggleLike(msg.id)}
              className={`p-2 rounded-xl transition-all ${hasLiked ? 'bg-red-50 text-red-500' : 'hover:bg-slate-100 text-slate-400 hover:text-red-500'}`}
            >
              <Heart size={14} className={hasLiked ? 'fill-current' : ''} />
            </button>
            {!isMe && (
              <>
                <button 
                  onClick={() => onBlock(msg.senderId)} 
                  title="حظر المستخدم"
                  className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-800 transition-all"
                >
                  <Ban size={14} />
                </button>
                <button 
                  onClick={() => onReport(msg)} 
                  title="إبلاغ عن الرسالة"
                  className="p-2 hover:bg-red-50 rounded-xl text-slate-400 hover:text-red-500 transition-all"
                >
                  <Flag size={14} className="rotate-180" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

export function Chat() {
  const { profile, isAdmin, isModerator } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMsg, setEditingMsg] = useState<Message | null>(null);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [bannedWords, setBannedWords] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'banned_words'), (docSnap) => {
      if (docSnap.exists()) {
        setBannedWords(docSnap.data().words || []);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Real-time messages listener from Firestore (Fixes automatic deletion issue)
    const q = query(
      collection(db, 'chat_messages'),
      orderBy('timestamp', 'asc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(msgs);
      
      // Auto scroll only on new messages
      if (snapshot.docChanges().some(change => change.type === 'added') && !isFirstLoad.current) {
        soundManager.playClick();
      }
      isFirstLoad.current = false;
    });

    return () => unsubscribe();
  }, []);

  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const blockUser = async (userId: string) => {
    if (!profile || !window.confirm('هل أنت متأكد من حظر هذا المستخدم؟ لن ترى رسائله بعد الآن.')) return;
    try {
      await updateDoc(doc(db, 'users', profile.uid), {
        blockedUsers: arrayUnion(userId)
      });
      toast.success('تم حظر المستخدم');
    } catch (err) {
      console.error(err);
      toast.error('فشل في حظر المستخدم');
    }
  };

  const filteredMessages = useMemo(() => {
    if (!profile?.blockedUsers) return messages;
    return messages.filter(m => !profile.blockedUsers?.includes(m.senderId));
  }, [messages, profile?.blockedUsers]);

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !socket || !profile) return;

    // Check banned words
    const containsBannedWord = bannedWords.some(word => inputText.toLowerCase().includes(word.toLowerCase()));
    if (containsBannedWord) {
      toast.error('هذه الرسالة تحتوي على كلمات غير لائقة ولا يمكن إرسالها.');
      return;
    }

    if (editingMsg) {
      const updateMsg = async () => {
        try {
          await updateDoc(doc(db, 'chat_messages', editingMsg.id), {
            text: inputText,
            isEdited: true
          });
          socket?.emit('chat:edit', { messageId: editingMsg.id, text: inputText });
          toast.success('تم تعديل الرسالة بنجاح');
        } catch (err) {
          console.error('Edit failed', err);
          toast.error('فشل في تعديل الرسالة');
        }
      };
      updateMsg();
      setEditingMsg(null);
    } else {
      const saveMessage = async () => {
        try {
          const role = isAdmin ? 'admin' : (isModerator ? 'moderator' : (profile.role || 'user'));
          await addDoc(collection(db, 'chat_messages'), {
            text: inputText,
            senderId: profile.uid,
            senderName: profile.displayName,
            senderAvatar: profile.photoURL,
            senderLevel: profile.stats?.level || 1,
            senderRole: role,
            timestamp: new Date(),
            likes: [],
            replyTo: replyingTo ? { id: replyingTo.id, text: replyingTo.text, senderName: replyingTo.senderName } : null
          });
          // Optional: still notify via socket for legacy/real-time signaling if needed
          socket?.emit('chat:message', {
             text: inputText,
             senderId: profile.uid,
             senderName: profile.displayName,
             senderAvatar: profile.photoURL
          });
          toast.success('تم إرسال الرسالة', { icon: '✈️' });
        } catch (err) {
          console.error('Save failed', err);
          toast.error('فشل في إرسال الرسالة');
        }
      };
      saveMessage();
    }

    setInputText('');
    setReplyingTo(null);
    setShowEmojiPicker(false);
  };

  const deleteMessage = useCallback(async (msgId: string) => {
    setMessageToDelete(null);
    const loadingToast = toast.loading('جاري الحذف...');
    try {
      await deleteDoc(doc(db, 'chat_messages', msgId));
      socket?.emit('chat:delete', msgId);
      toast.dismiss(loadingToast);
      toast.success('تم حذف الرسالة');
    } catch (e) {
      toast.dismiss(loadingToast);
      console.error('Firebase delete failed', e);
      handleFirestoreError(e, OperationType.DELETE, `chat_messages/${msgId}`);
      toast.error('خطأ في الصلاحيات: لم يتم حذف الرسالة');
    }
  }, [socket]);

  const confirmDelete = (msgId: string) => {
    setMessageToDelete(msgId);
  };

  const toggleLike = useCallback((msgId: string) => {
     socket?.emit('chat:like', { messageId: msgId, userId: profile?.uid });
  }, [socket, profile]);

  const reportMessage = async (msg: Message) => {
    if (!profile || !window.confirm('هل تريد الإبلاغ عن هذه الرسالة؟')) return;
    try {
      await addDoc(collection(db, 'chat_reports'), {
        messageId: msg.id,
        content: msg.text,
        reportedId: msg.senderId,
        reportedName: msg.senderName,
        reporterId: profile.uid,
        reporterName: profile.displayName,
        timestamp: new Date(),
        status: 'pending'
      });
      toast.success('تم إرسال البلاغ');
    } catch (err) {
      console.error(err);
      toast.error('فشل في إرسال البلاغ');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden border border-slate-100 dark:border-slate-800 shadow-2xl relative transition-colors duration-300">
      <div className="p-6 border-b border-slate-50 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between z-10">
        <h3 className="font-black arabic-text text-xl text-slate-800 dark:text-white transition-colors duration-300">المجلس العام 🏛️</h3>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30 dark:bg-slate-900/30 custom-scrollbar">
        {filteredMessages.map((msg, idx) => (
          <MessageBubble 
            key={msg.id || idx} 
            msg={msg} 
            isMe={msg.senderId === profile?.uid}
            isViewerAdmin={isAdmin}
            hasLiked={msg.likes?.includes(profile?.uid || '')}
            onReply={setReplyingTo}
            onEdit={(m) => { setEditingMsg(m); setInputText(m.text); }}
            onDelete={confirmDelete}
            onToggleLike={toggleLike}
            onBlock={blockUser}
            onReport={reportMessage}
          />
        ))}
      </div>
      <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-50 dark:border-slate-800 flex items-center gap-4">
        <form onSubmit={handleSendMessage} className="relative flex-1 group">
          <input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="شارك الجميع بأفكارك..."
            className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary/20 focus:bg-white dark:focus:bg-slate-700 rounded-[24px] px-6 py-4 text-right arabic-text font-bold text-lg outline-none transition-all shadow-inner text-slate-900 dark:text-white"
          />
        </form>
        <button onClick={handleSendMessage} className="w-16 h-16 bg-primary text-white rounded-[24px] shadow-xl hover:scale-[1.05] transition-all flex items-center justify-center shrink-0">
          <Send size={28} className="rotate-180" />
        </button>
      </div>

      <AnimatePresence>
        {messageToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl text-center"
            >
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-100">
                <Trash2 size={40} />
              </div>
              <h4 className="text-2xl font-black text-slate-800 mb-3 arabic-text">تأكيد الحذف</h4>
              <p className="text-slate-500 font-bold mb-8 arabic-text leading-relaxed">هل أنت متأكد من رغبتك في حذف هذه الرسالة نهائياً؟ لا يمكن التراجع عن هذا الإجراء.</p>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => deleteMessage(messageToDelete)}
                  className="w-full py-4 bg-red-500 text-white rounded-2xl font-black text-lg hover:bg-red-600 transition-all shadow-lg shadow-red-200 active:scale-95"
                >
                  نعم، احذفها
                </button>
                <button
                  onClick={() => setMessageToDelete(null)}
                  className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-lg hover:bg-slate-200 transition-all active:scale-95"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
