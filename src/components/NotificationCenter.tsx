import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, Info, Trophy, UserPlus, Zap, BellOff } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, limit, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { soundManager } from '../lib/soundManager';
import { useLanguage } from '../context/LanguageContext';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'challenge' | 'friend';
  read: boolean;
  timestamp: any;
}

export function NotificationCenter() {
  const { user, profile } = useAuth();
  const { isRTL } = useLanguage();
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [isOpen, setIsOpen] = React.useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  const isFirstLoad = React.useRef(true);

  React.useEffect(() => {
    if (!user || !profile) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Play sound if new notification arrives and it's not the initial load
      const hasAddedDocs = snapshot.docChanges().some(change => change.type === 'added');
      if (hasAddedDocs && !snapshot.metadata.hasPendingWrites && !isFirstLoad.current) {
        soundManager.playClick();
      }
      
      if (isFirstLoad.current) {
        isFirstLoad.current = false;
      }

      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
      setNotifications(data);
    }, (error) => {
      console.error("Notifications listener error:", error);
    });

    return () => unsubscribe();
  }, [user?.uid, profile?.id]);

  const markAllAsRead = async () => {
    try {
      const unread = notifications.filter(n => !n.read);
      await Promise.all(unread.map(n => updateDoc(doc(db, 'notifications', n.id), { read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (n: Notification) => {
    if (!n.read) {
      await markAsRead(n.id);
    }
    
    // Custom action based on type
    if (n.type === 'friend') {
      window.dispatchEvent(new CustomEvent('changeTab', { detail: 'friends' }));
    } else if (n.type === 'challenge') {
      window.dispatchEvent(new CustomEvent('changeTab', { detail: 'dashboard' }));
    }
    
    setIsOpen(false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <Trophy className="text-green-500" size={16} />;
      case 'challenge': return <Zap className="text-amber-500" size={16} />;
      case 'friend': return <UserPlus className="text-blue-500" size={16} />;
      default: return <Info className="text-slate-400" size={16} />;
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center w-12 h-12 transition-all border shadow-sm group bg-white dark:bg-slate-800 rounded-2xl border-slate-100 dark:border-slate-700 hover:border-primary/30 hover:shadow-md active:scale-95"
      >
        <Bell size={22} className={`${unreadCount > 0 ? 'text-primary animate-ring' : 'text-slate-400'} group-hover:scale-110 transition-all`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] px-1 items-center justify-center bg-gradient-to-br from-red-500 to-rose-600 text-white text-[10px] font-black rounded-full border-2 border-white dark:border-slate-800 shadow-lg shadow-red-500/20 group-hover:scale-110 transition-transform">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200]"
            />
            
            {/* Side Drawer - Always on the Right side to prevent layout issues */}
            <motion.div
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 right-0 w-full sm:w-[400px] bg-white dark:bg-slate-900 shadow-2xl z-[201] flex flex-col border-l border-slate-200 dark:border-slate-800"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-row-reverse">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <Bell size={20} />
                  </div>
                  <div className="text-right">
                    <h3 className="font-black text-lg arabic-text">{isRTL ? 'الإشعارات' : 'Notifications'}</h3>
                    <p className="text-[10px] text-slate-400 font-bold arabic-text">{unreadCount} {isRTL ? 'غير مقروءة' : 'Unread'}</p>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <motion.div
                      key={n.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => handleNotificationClick(n)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        n.read ? 'bg-transparent border-transparent opacity-60' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 shadow-sm'
                      }`}
                    >
                      <div className={`flex gap-4 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                          n.type === 'success' ? 'bg-green-100 text-green-600' :
                          n.type === 'challenge' ? 'bg-amber-100 text-amber-600' :
                          n.type === 'friend' ? 'bg-blue-100 text-blue-600' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {getIcon(n.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-black text-slate-800 dark:text-white arabic-text">{n.title}</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 arabic-text leading-relaxed line-clamp-2">{n.message}</p>
                        </div>
                        {!n.read && <div className="w-2 h-2 bg-primary rounded-full shrink-0" />}
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-30">
                    <BellOff size={64} />
                    <p className="mt-4 font-black arabic-text">{isRTL ? 'لا توجد إشعارات' : 'No notifications'}</p>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col gap-2">
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="w-full py-3 text-xs font-black text-primary hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all arabic-text">
                    {isRTL ? 'تحديد الكل كمقروء' : 'Mark all read'}
                  </button>
                )}
                <button onClick={() => setIsOpen(false)} className="w-full py-3 text-xs font-black text-slate-400 hover:text-slate-600 transition-all arabic-text">
                  {isRTL ? 'إغلاق' : 'Close'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
