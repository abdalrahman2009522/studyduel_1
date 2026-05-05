import React from 'react';
import { motion } from 'motion/react';
import { UserPlus, Search, UserMinus, MessageCircle, Play, Users, Zap, Trophy } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc, arrayUnion, arrayRemove, addDoc, serverTimestamp, orderBy, limit } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { AppUser } from '../types';

import { soundManager } from '../lib/soundManager';

export function FriendsSystem() {
  const { user, profile } = useAuth();
  const { onlineUsers, sendChallenge } = useSocket();
  const [friends, setFriends] = React.useState<AppUser[]>([]);
  const [searchResults, setSearchResults] = React.useState<AppUser[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [isSearching, setIsSearching] = React.useState(false);
  const [suggestedUsers, setSuggestedUsers] = React.useState<AppUser[]>([]);

  React.useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const q = query(collection(db, 'users'), orderBy('stats.xp', 'desc'), limit(10));
        const snapshot = await getDocs(q);
        const data = snapshot.docs
          .map(doc => doc.data() as AppUser)
          .filter(u => u.uid !== user?.uid && !profile?.friends?.includes(u.uid))
          .slice(0, 5);
        setSuggestedUsers(data);
      } catch (err) {
        console.error("Failed to fetch suggestions:", err);
      }
    };
    fetchSuggestions();
  }, [user?.uid, profile?.friends]);

  React.useEffect(() => {
    if (isSearching) {
      soundManager.playClick();
    }
  }, [isSearching]);

  React.useEffect(() => {
    if (!profile?.friends || profile.friends.length === 0) {
      setFriends([]);
      setLoading(false);
      return;
    }

    const fetchFriends = async () => {
      try {
        const q = query(collection(db, 'users'), where('uid', 'in', profile.friends));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => doc.data() as AppUser);
        setFriends(data);
      } catch (err) {
        console.error("Failed to fetch friends:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFriends();
  }, [profile?.friends]);

  React.useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.trim()) {
        performSearch();
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const performSearch = async () => {
    setIsSearching(true);
    try {
      const q = query(
        collection(db, 'users'), 
        where('displayName', '>=', searchTerm), 
        where('displayName', '<=', searchTerm + '\uf8ff')
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs
        .map(doc => doc.data() as AppUser)
        .filter(u => u.uid !== user?.uid);
      setSearchResults(data);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch();
  };

  const toggleFriend = async (friendId: string, isFriend: boolean) => {
    if (!user || !profile) return;
    soundManager.playClick();
    const userRef = doc(db, 'users', user.uid);
    try {
      await updateDoc(userRef, {
        friends: isFriend ? arrayRemove(friendId) : arrayUnion(friendId)
      });
      
      // If adding a friend, also notify them
      if (!isFriend) {
        await addDoc(collection(db, 'notifications'), {
          userId: friendId,
          title: 'صديق جديد! 👥',
          message: `${profile.displayName} قام بإضافتك لقائمة أصدقائه`,
          type: 'friend',
          read: false,
          timestamp: serverTimestamp()
        });
      }
    } catch (err) {
      console.error("Failed to update friends:", err);
    }
  };

  const isUserOnline = (uid: string) => onlineUsers.some(u => u.uid === uid);

  return (
    <div className="space-y-8 pb-12">
      <div className="text-right">
        <h1 className="text-4xl font-black text-slate-800 arabic-text mb-2">نظام الأصدقاء 👥</h1>
        <p className="text-slate-500 arabic-text font-bold">أضف أصدقاءك، وتابع نشاطهم، وتحداهم في أي وقت</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Search */}
        <div className="lg:col-span-4 space-y-6">
           <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
              <h3 className="text-lg font-black arabic-text text-right mb-4">البحث عن أصدقاء</h3>
                  <div className="relative group">
                     <input
                       type="text"
                       value={searchTerm}
                       onChange={(e) => setSearchTerm(e.target.value)}
                       placeholder="ابحث عن العباقرة... 🔍"
                       className="w-full bg-slate-50 border-2 border-transparent rounded-2xl p-5 pr-14 text-right arabic-text font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary/20 focus:bg-white transition-all shadow-inner"
                     />
                     <div className="absolute top-1/2 -translate-y-1/2 right-5 text-slate-300 group-focus-within:text-primary transition-colors">
                        <Search size={24} />
                     </div>
                     <button type="submit" className="hidden" />
                  </div>

              <div className="mt-6 space-y-4">
                 {isSearching ? (
                   <div className="flex justify-center py-4">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                   </div>
                 ) : (
                   <>
                     {searchTerm.trim() ? (
                        searchResults.map(u => {
                          const online = isUserOnline(u.uid);
                          return (
                              <div key={u.uid} className="flex flex-row-reverse items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-primary/20 transition-all">
                                 <div className="flex flex-row-reverse items-center gap-3">
                                    <div className="relative">
                                      <img src={u.photoURL} className="w-10 h-10 rounded-xl" alt="avatar" />
                                      {online && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />}
                                    </div>
                                    <div className="text-right">
                                      <span className="font-black arabic-text text-sm block">{u.displayName}</span>
                                      <span className="text-[10px] text-slate-400 font-bold arabic-text uppercase">المستوى {u.stats.level}</span>
                                    </div>
                                 </div>
                                  <div className="flex items-center gap-2">
                                    {online && (
                                      <button 
                                        onClick={() => {
                                          sendChallenge(u.uid, 'arabic');
                                          soundManager.playPowerUp();
                                        }}
                                        className="p-2 bg-primary text-white rounded-lg shadow-lg shadow-primary/10 hover:scale-110 active:scale-95 transition-all"
                                        title="تحدي الآن"
                                      >
                                        <Zap size={14} />
                                      </button>
                                    )}
                                    <button 
                                      onClick={() => toggleFriend(u.uid, profile?.friends?.includes(u.uid) || false)}
                                      className={`p-2 rounded-lg transition-all ${profile?.friends?.includes(u.uid) ? 'text-red-500 bg-red-50 hover:bg-red-500 hover:text-white' : 'text-primary bg-blue-50 hover:bg-primary hover:text-white'}`}
                                    >
                                        {profile?.friends?.includes(u.uid) ? <UserMinus size={18} /> : <UserPlus size={18} />}
                                    </button>
                                  </div>
                              </div>
                          );
                       })
                     ) : (
                       <div className="space-y-4">
                         <div className="flex flex-row-reverse items-center justify-between px-1">
                           <h4 className="text-[10px] font-black text-slate-400 arabic-text uppercase tracking-widest">طلاب قد تعرفهم</h4>
                           <Users size={12} className="text-slate-300" />
                         </div>
                         {suggestedUsers.map(u => (
                            <div key={u.uid} className="flex flex-row-reverse items-center justify-between p-3 rounded-2xl bg-primary/5 border border-primary/10 group hover:bg-white hover:border-primary/20 transition-all">
                               <div className="flex flex-row-reverse items-center gap-3">
                                  <img src={u.photoURL} className="w-10 h-10 rounded-xl" alt="avatar" />
                                  <div className="text-right">
                                    <span className="font-black arabic-text text-sm block">{u.displayName}</span>
                                    <span className="text-[10px] text-primary/60 font-black arabic-text uppercase">مستوى {u.stats.level}</span>
                                  </div>
                               </div>
                               <button 
                                 onClick={() => toggleFriend(u.uid, false)}
                                 className="p-2 rounded-lg bg-white text-primary shadow-sm hover:bg-primary hover:text-white transition-all"
                               >
                                   <UserPlus size={16} />
                               </button>
                            </div>
                         ))}
                       </div>
                     )}
                     {searchTerm && !isSearching && searchResults.length === 0 && <p className="text-center text-xs text-slate-400 font-bold arabic-text py-4">لا يوجد نتائج</p>}
                   </>
                 )}
              </div>
           </div>
        </div>

        {/* Friends List */}
        <div className="lg:col-span-8">
           <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm min-h-[400px]">
              <div className="flex flex-row-reverse items-center justify-between mb-8">
                 <h3 className="text-2xl font-black arabic-text text-slate-800">قائمة الأصدقاء</h3>
                 <span className="bg-slate-100 px-4 py-1 rounded-full text-xs font-black text-slate-500">{friends.length} صديق</span>
              </div>

              {loading ? (
                <div className="flex justify-center py-20">
                   <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : friends.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-3xl">
                   <Users size={64} className="mx-auto text-slate-200 mb-4" />
                   <h4 className="text-xl font-black arabic-text text-slate-400">لم تضف أي أصدقاء بعد</h4>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {friends.map((friend, idx) => {
                      const online = isUserOnline(friend.uid);
                      return (
                        <motion.div
                          key={friend.uid}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.05 }}
                          className="p-6 rounded-[32px] border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-2xl hover:scale-[1.03] transition-all group overflow-hidden relative"
                        >
                           <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-primary/10 transition-colors" />
                           
                           <div className="flex flex-row-reverse items-start gap-4 mb-6 relative">
                              <div className="relative shrink-0">
                                 <img src={friend.photoURL} className="w-20 h-20 rounded-[24px] shadow-xl border-4 border-white group-hover:rotate-3 transition-transform" alt="avatar" />
                                 <div className={`absolute -bottom-1 -right-1 w-6 h-6 ${online ? 'bg-green-500' : 'bg-slate-300'} border-4 border-white rounded-full shadow-lg`} />
                              </div>
                              <div className="text-right flex-1 pt-1">
                                 <h4 className="text-lg font-black text-slate-800 arabic-text mb-1">{friend.displayName}</h4>
                                 <div className="flex flex-row-reverse items-center gap-2 mb-2">
                                     <span className="bg-primary/10 text-primary px-3 py-0.5 rounded-full text-[10px] font-black arabic-text uppercase tracking-widest">المستوى {friend.stats.level}</span>
                                     <span className="bg-amber-50 text-amber-600 px-3 py-0.5 rounded-full text-[10px] font-black arabic-text uppercase tracking-widest">🏆 {friend.stats.wins} فوز</span>
                                 </div>
                                 <p className="text-xs text-slate-500 arabic-text line-clamp-2 leading-relaxed">
                                   {friend.bio || "لا يوجد نبذة شخصية بعد. طالب طموح يسعى للتميز..."}
                                 </p>
                              </div>
                           </div>
                           <div className="flex gap-3 relative">
                              <button className="flex-[2] py-3.5 bg-white border border-slate-200 rounded-2xl font-black arabic-text text-sm text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95">
                                 <MessageCircle size={18} />
                                 دردشة
                              </button>
                              <button 
                                onClick={() => sendChallenge(friend.uid, 'arabic')}
                                disabled={!online}
                                className={`flex-[3] py-3.5 ${online ? 'bg-primary text-white shadow-xl shadow-primary/20 hover:bg-blue-600' : 'bg-slate-200 text-slate-400 cursor-not-allowed'} rounded-2xl font-black arabic-text text-sm flex items-center justify-center gap-2 transition-all active:scale-95`}
                              >
                                 <Zap size={18} className={online ? 'animate-pulse' : ''} />
                                 تحدي الآن
                              </button>
                           </div>
                        </motion.div>
                      );
                   })}
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}
