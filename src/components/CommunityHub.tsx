import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Heart, Share2, Send, Filter, MoreHorizontal, Image as ImageIcon, Video, X, Trash2, Edit2, Flag, Ban, Flame } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, getDocs, onSnapshot, addDoc, serverTimestamp, updateDoc, doc, deleteDoc, arrayUnion, arrayRemove, Timestamp, limit } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { CommunityPost } from '../types';
import { toast } from 'react-hot-toast';
import { ProfileAvatar } from './ProfileAvatar';
import { LevelBadge } from './LevelBadge';
import { calculateLevel } from '../lib/gameLogic';

export function CommunityHub() {
  const { user, profile } = useAuth();
  const [posts, setPosts] = React.useState<CommunityPost[]>([]);
  const [newPost, setNewPost] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [replyTo, setReplyTo] = React.useState<CommunityPost | null>(null);
  const [mediaPreview, setMediaPreview] = React.useState<string | null>(null);
  const [mediaType, setMediaType] = React.useState<'image' | 'video' | null>(null);
  const [editingPostId, setEditingPostId] = React.useState<string | null>(null);
  const [editingContent, setEditingContent] = React.useState('');
  const [postToDelete, setPostToDelete] = React.useState<string | null>(null);
  const [activeUsers, setActiveUsers] = React.useState<{uid: string, photoURL: string}[]>([]);
  const [filter, setFilter] = React.useState<'latest' | 'popular' | 'views'>('latest');
  const [bannedWords, setBannedWords] = React.useState<string[]>([]);

  React.useEffect(() => {
    const unsubscribeBanned = onSnapshot(doc(db, 'settings', 'banned_words'), (docSnap) => {
      if (docSnap.exists()) {
        setBannedWords(docSnap.data().words || []);
      }
    });

    const q = query(collection(db, 'community_posts'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CommunityPost));
      setPosts(data);
      setLoading(false);
    }, (err) => {
      console.error("Failed to fetch community data:", err);
      setLoading(false);
    });

    // Fetch actual users with avatars
    const fetchUsers = async () => {
      const usersQ = query(collection(db, 'users'), limit(8));
      const usersSnap = await getDocs(usersQ);
      setActiveUsers(usersSnap.docs.map(d => ({ uid: d.id, photoURL: d.data().photoURL })));
    };
    fetchUsers();

    return () => {
      unsubscribe();
      unsubscribeBanned();
    };
  }, []);

  const filteredPosts = React.useMemo(() => {
    if (!profile?.blockedUsers) return posts;
    return posts.filter(p => !profile.blockedUsers?.includes(p.authorId));
  }, [posts, profile?.blockedUsers]);

  const totalInteractingStudents = new Set(filteredPosts.map(p => p.authorId)).size;

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      alert('حجم الملف كبير جداً. يرجى اختيار ملف أقل من 500 كيلوبايت.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setMediaPreview(reader.result as string);
      setMediaType(type);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || (!newPost.trim() && !mediaPreview) || isSubmitting) return;

    setIsSubmitting(true);

    // Check banned words
    const containsBannedWord = bannedWords.some(word => 
      newPost.toLowerCase().includes(word.toLowerCase())
    );

    if (containsBannedWord) {
      toast.error('المحتوى يحتوي على كلمات غير لائقة ولا يمكن نشره.');
      setIsSubmitting(false);
      return;
    }

    try {
      const postData: any = {
        authorId: user.uid,
        authorName: profile?.displayName || 'طالب مجهول',
        authorPhotoURL: profile?.photoURL || null,
        authorLevel: calculateLevel(profile?.stats?.xp || 0),
        authorStreak: profile?.stats?.streak || 0,
        authorInventory: profile?.inventory || null,
        content: newPost,
        likes: [],
        views: 0,
        timestamp: serverTimestamp(),
      };

      if (replyTo) {
        postData.parentId = replyTo.id;
        postData.replyToName = replyTo.authorName;
        // Group all replies under a root post for easier fetching
        postData.rootId = replyTo.rootId || replyTo.id;
      }

      if (mediaPreview) {
        postData.mediaUrl = mediaPreview;
        postData.mediaType = mediaType;
      }

      const docRef = await addDoc(collection(db, 'community_posts'), postData);
      
      const newPostEntry: CommunityPost = {
        id: docRef.id,
        authorId: user.uid,
        authorName: profile?.displayName || 'طالب مجهول',
        authorPhotoURL: profile?.photoURL || undefined,
        authorInventory: profile?.inventory || undefined,
        content: newPost,
        likes: [],
        views: 0,
        timestamp: new Date(),
        parentId: replyTo?.id,
        replyToName: replyTo?.authorName,
        rootId: replyTo?.rootId || replyTo?.id,
        mediaUrl: mediaPreview || undefined,
        mediaType: mediaType || undefined
      };
      
      setPosts([newPostEntry, ...posts]);
      setNewPost('');
      setReplyTo(null);
      setMediaPreview(null);
      setMediaType(null);
    } catch (err) {
      console.error("Failed to post:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (postId: string, hasLiked: boolean) => {
    if (!user) return;
    const postRef = doc(db, 'community_posts', postId);
    try {
      await updateDoc(postRef, {
        likes: hasLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
      });
      setPosts(posts.map(p => 
        p.id === postId 
          ? { ...p, likes: hasLiked ? p.likes.filter(id => id !== user.uid) : [...p.likes, user.uid] }
          : p
      ));
    } catch (err) {
      console.error("Failed to like:", err);
    }
  };

  const handleDeletePost = async (postId: string) => {
    setPostToDelete(null);
    const loadingToast = toast.loading('جاري الحذف...');
    try {
      await deleteDoc(doc(db, 'community_posts', postId));
      // Local state update since snapshot might lag
      setPosts(posts.filter(p => p.id !== postId && p.rootId !== postId && p.parentId !== postId));
      toast.dismiss(loadingToast);
      toast.success('تم حذف المشاركة');
    } catch (err) {
      toast.dismiss(loadingToast);
      console.error("Failed to delete post", err);
      toast.error('لم يتم حذف المشاركة: خطأ في الصلاحيات');
    }
  };

  const confirmDelete = (postId: string) => {
    setPostToDelete(postId);
  };

  const handleEditSubmit = async (postId: string) => {
    if (!editingContent.trim() || !user) return;

    // Check banned words
    const containsBannedWord = bannedWords.some(word => 
      editingContent.toLowerCase().includes(word.toLowerCase())
    );

    if (containsBannedWord) {
      toast.error('المحتوى يحتوي على كلمات غير لائقة ولا يمكن حفظ التعديل.');
      return;
    }

    try {
      await updateDoc(doc(db, 'community_posts', postId), {
        content: editingContent,
        isEdited: true
      });
      setPosts(posts.map(p => p.id === postId ? { ...p, content: editingContent, isEdited: true } : p));
      setEditingPostId(null);
    } catch (err) {
      console.error("Failed to edit post", err);
    }
  };

  const blockUser = async (userId: string) => {
    if (!profile || !window.confirm('هل أنت متأكد من حظر هذا الطالب؟ لن ترى منشوراته بعد الآن.')) return;
    try {
      await updateDoc(doc(db, 'users', profile.uid), {
        blockedUsers: arrayUnion(userId)
      });
      toast.success('تم حظر الطالب');
    } catch (err) {
      console.error(err);
      toast.error('فشل في حظر الطالب');
    }
  };

  const reportPost = async (post: CommunityPost) => {
    if (!profile || !window.confirm('هل تريد الإبلاغ عن هذا المحتوى؟')) return;
    
    // Check if already reported by this user (locally)
    if (post.reports?.includes(profile.uid)) {
      toast.error('لقد قمت بالإبلاغ عن هذا المحتوى مسبقاً');
      return;
    }

    try {
      // 1. Create a record in flagged_content
      await addDoc(collection(db, 'flagged_content'), {
        content: post.content,
        postId: post.id || '',
        authorId: post.authorId,
        authorName: post.authorName,
        reporterId: profile.uid,
        reporterName: profile.displayName,
        timestamp: new Date(),
        status: 'pending',
        type: post.parentId ? 'reply' : 'post'
      });

      // 2. Persist reporter on the post itself
      await updateDoc(doc(db, 'community_posts', post.id), {
        reports: arrayUnion(profile.uid)
      });

      setPosts(posts.map(p => p.id === post.id ? { ...p, reports: [...(p.reports || []), profile.uid] } : p));
      toast.success('تم إرسال البلاغ بنجاح');
    } catch (err) {
      console.error(err);
      toast.error('فشل في إرسال البلاغ');
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row-reverse gap-8 pb-12 px-4 md:px-0">
      {/* Main Feed Column */}
      <div className="flex-1 space-y-8">
        <div className="text-right">
          <h1 className="text-4xl font-black text-text-main arabic-text mb-2 transition-colors duration-300">الدردشة العامة 💬</h1>
          <p className="text-text-muted arabic-text font-bold transition-colors duration-300">تواصل مع زملائك، شارك نصائحك، وانشر إنجازاتك</p>
        </div>

        {/* Pinned Message */}
        <div className="bg-gradient-to-r from-primary/5 to-blue-600/5 p-6 rounded-[32px] border border-primary/10 flex flex-row-reverse justify-between items-center group overflow-hidden relative">
           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-150 transition-transform duration-1000">
              <MessageSquare size={80} />
           </div>
           <div className="text-right flex-1">
              <div className="flex flex-row-reverse items-center gap-2 mb-1">
                 <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                 <span className="text-[10px] font-black text-primary arabic-text uppercase">إعلان مثبت</span>
              </div>
              <p className="text-sm font-bold text-text-muted arabic-text transition-colors duration-300">مرحباً بكم في منصة ستادي دويل! نذكركم بالالتزام بالروح الرياضية والتعاون مع زملائكم. بالتوفيق للجميع في امتحانات التوجيهي!</p>
           </div>
        </div>

        {/* Create Post */}
        <div id="publish-box" className="bg-surface p-6 rounded-[40px] border-2 border-slate-50 dark:border-slate-800 shadow-xl shadow-primary/5 relative overflow-hidden group transition-all duration-300">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-blue-600 opacity-20" />
          
          <AnimatePresence>
            {replyTo && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mb-4 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex flex-row-reverse justify-between items-center rounded-3xl"
              >
                 <div className="text-right">
                    <p className="text-[10px] font-black text-primary arabic-text uppercase">الرد على {replyTo.authorName}</p>
                    <p className="text-xs text-text-muted arabic-text line-clamp-1">{replyTo.content}</p>
                 </div>
                 <button onClick={() => setReplyTo(null)} className="text-text-muted hover:text-text-main transition-colors">
                    <X size={16} />
                 </button>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-row-reverse gap-4">
               <img src={profile?.photoURL} className="w-12 h-12 rounded-2xl border-2 border-white shadow-md" alt="Avatar" />
               <div className="flex-1 space-y-4">
                 <textarea
                   value={newPost}
                   onChange={(e) => setNewPost(e.target.value)}
                   placeholder={replyTo ? "اكتب ردك هنا..." : "ماذا يدور في ذهنك اليوم؟ شارك زملائك..."}
                   className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-3xl p-5 text-right arabic-text font-bold focus:ring-2 focus:ring-primary/20 min-h-[120px] resize-none transition-all text-slate-900 dark:text-white"
                 />
                 
                 {mediaPreview && (
                   <div className="relative rounded-2xl overflow-hidden border border-slate-100 group/media">
                      {mediaType === 'image' ? (
                        <img src={mediaPreview} className="w-full max-h-64 object-cover" alt="Preview" />
                      ) : (
                        <video src={mediaPreview} className="w-full max-h-64 object-cover" controls />
                      )}
                      <button 
                        type="button"
                        onClick={() => { setMediaPreview(null); setMediaType(null); }}
                        className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-all"
                      >
                         <X size={16} />
                      </button>
                   </div>
                 )}
               </div>
            </div>
            
            <div className="flex flex-row-reverse justify-between items-center pr-16 gap-4">
              <div className="flex flex-row-reverse items-center gap-4">
                <button
                  type="submit"
                  disabled={isSubmitting || (!newPost.trim() && !mediaPreview)}
                  className="bg-primary text-white lg:px-10 px-6 py-4 rounded-2xl font-black arabic-text flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/30 disabled:opacity-50 disabled:scale-100"
                >
                  {isSubmitting ? 'جاري النشر...' : (replyTo ? 'إرسال الرد' : 'نشر المشاركة')}
                  <Send size={20} />
                </button>
                
                <div className="flex flex-row-reverse items-center gap-2">
                  <label className="cursor-pointer p-3 bg-slate-50 text-slate-500 rounded-2xl hover:bg-slate-100 transition-all border border-slate-100">
                    <ImageIcon size={20} />
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleMediaSelect(e, 'image')} />
                  </label>
                  <label className="cursor-pointer p-3 bg-slate-50 text-slate-500 rounded-2xl hover:bg-slate-100 transition-all border border-slate-100">
                    <Video size={20} />
                    <input type="file" accept="video/*" className="hidden" onChange={(e) => handleMediaSelect(e, 'video')} />
                  </label>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-2 text-text-muted">
                 <span className="text-xs font-black arabic-text">نشر كـ {profile?.displayName}</span>
              </div>
            </div>
          </form>
        </div>

        {/* Feed Filter */}
        <div className="flex flex-row-reverse items-center gap-4 px-2">
           <button 
             onClick={() => setFilter('latest')}
             className={`px-6 py-2.5 rounded-full text-xs font-black arabic-text transition-all ${filter === 'latest' ? 'bg-slate-900 dark:bg-slate-700 text-white shadow-lg' : 'bg-surface text-text-muted border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
           >
             الأحدث
           </button>
           <button 
             onClick={() => setFilter('popular')}
             className={`px-6 py-2.5 rounded-full text-xs font-black arabic-text transition-all ${filter === 'popular' ? 'bg-slate-900 dark:bg-slate-700 text-white shadow-lg' : 'bg-surface text-text-muted border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
           >
             الأكثر تفاعلاً
           </button>
           <button 
             onClick={() => setFilter('views')}
             className={`px-6 py-2.5 rounded-full text-xs font-black arabic-text transition-all ${filter === 'views' ? 'bg-slate-900 dark:bg-slate-700 text-white shadow-lg' : 'bg-surface text-text-muted border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
           >
             الأكثر مشاهدة
           </button>
        </div>

        {/* Feed */}
        <div className="space-y-8">
          {loading ? (
            <div className="flex justify-center py-20">
               <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-xl"></div>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="bg-surface p-20 rounded-[40px] text-center border-2 border-dashed border-slate-100 dark:border-slate-800">
               <MessageSquare size={48} className="mx-auto text-text-muted/20 mb-4" />
               <h3 className="text-xl font-black text-text-muted arabic-text">لا توجد مشاركات بعد. كن أول من ينشر!</h3>
            </div>
          ) : filteredPosts.filter(p => !p.parentId)
             .sort((a, b) => {
               if (filter === 'latest') return (b.timestamp?.toDate ? b.timestamp.toDate() : 0) - (a.timestamp?.toDate ? a.timestamp.toDate() : 0);
               if (filter === 'popular') return b.likes.length - a.likes.length;
               if (filter === 'views') return (b.views || 0) - (a.views || 0);
               return 0;
             })
             .map((post, idx) => {
          const hasLiked = user ? post.likes.includes(user.uid) : false;
          const replies = filteredPosts.filter(r => r.rootId === post.id).sort((a,b) => {
            const timeA = a.timestamp?.toDate ? a.timestamp.toDate() : a.timestamp;
            const timeB = b.timestamp?.toDate ? b.timestamp.toDate() : b.timestamp;
            return timeA - timeB; // Oldest first for replies
          });

          return (
            <div key={post.id} className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-surface p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm"
              >
                <div className="flex flex-row-reverse justify-between items-start mb-6">
                  <div className="flex flex-row-reverse items-center gap-3">
                    <ProfileAvatar 
                      uid={post.authorId}
                      photoURL={post.authorPhotoURL}
                      inventory={post.authorInventory}
                      level={post.authorLevel}
                      size="md"
                    />
                    <div className="text-right">
                      <div className="flex flex-row-reverse items-center justify-start gap-2">
                         <h3 className="font-black text-text-main arabic-text flex items-center gap-1">
                           {post.authorName}
                           {((post as any).authorStreak || 0) > 0 && (
                             <div className="flex items-center gap-0.5 text-orange-500" title="سلسلة فوز">
                               <Flame size={14} fill="currentColor" />
                               <span className="text-[10px] font-black">{(post as any).authorStreak}</span>
                             </div>
                           )}
                         </h3>
                         {post.authorLevel && (
                           <LevelBadge level={post.authorLevel} size="sm" />
                         )}
                      </div>
                      <p className="text-[10px] text-text-muted font-bold arabic-text mt-0.5 flex flex-row-reverse items-center gap-1">
                        <span>{new Date(post.timestamp?.toDate ? post.timestamp.toDate() : post.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                        {post.isEdited && <span className="text-slate-300 dark:text-slate-600">(معدل)</span>}
                      </p>
                    </div>
                  </div>
                  {(user?.uid === post.authorId || profile?.role === 'admin') ? (
                    <div className="flex gap-2">
                       {user?.uid === post.authorId && (
                         <button 
                           onClick={() => {
                             setEditingPostId(post.id);
                             setEditingContent(post.content);
                           }} 
                           className="text-text-muted hover:text-blue-500 transition-colors"
                         >
                           <Edit2 size={18} />
                         </button>
                       )}
                        <button onClick={() => confirmDelete(post.id)} className="text-text-muted hover:text-red-500 transition-colors">
                          <Trash2 size={18} />
                        </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => blockUser(post.authorId)} className="text-text-muted hover:text-red-500 transition-colors" title="حظر">
                          <Ban size={18} />
                      </button>
                      <button 
                        onClick={() => reportPost(post)} 
                        className={`transition-colors ${post.reports?.includes(profile?.uid || '') ? 'text-amber-500' : 'text-text-muted hover:text-amber-500'}`} 
                        title="إبلاغ"
                      >
                          <Flag size={18} fill={post.reports?.includes(profile?.uid || '') ? "currentColor" : "none"} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="text-right mb-6">
                  {editingPostId === post.id ? (
                    <div className="space-y-3">
                      <textarea
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-right arabic-text font-bold focus:ring-2 focus:ring-primary/20 min-h-[100px] resize-none text-slate-900 dark:text-white"
                      />
                      <div className="flex flex-row-reverse gap-2">
                        <button onClick={() => handleEditSubmit(post.id)} className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold arabic-text">حفظ</button>
                        <button onClick={() => setEditingPostId(null)} className="bg-slate-100 dark:bg-slate-800 text-text-muted px-4 py-2 rounded-xl text-sm font-bold arabic-text">إلغاء</button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-text-main arabic-text text-lg leading-relaxed whitespace-pre-wrap transition-colors duration-300">
                      {post.content}
                    </p>
                  )}
                  
                  {post.mediaUrl && (
                    <div className="mt-4 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800">
                       {post.mediaType === 'image' ? (
                         <img src={post.mediaUrl} className="w-full max-h-[400px] object-cover" alt="Post content" />
                       ) : (
                         <video src={post.mediaUrl} className="w-full max-h-[400px]" controls />
                       )}
                    </div>
                  )}
                </div>

                <div className="flex flex-row-reverse items-center gap-6 pt-6 border-t border-slate-50 dark:border-slate-800">
                  <button 
                    onClick={() => handleLike(post.id, hasLiked)}
                    className={`flex flex-row-reverse items-center gap-2 font-black arabic-text text-sm transition-colors ${hasLiked ? 'text-red-500' : 'text-text-muted hover:text-red-500'}`}
                  >
                    <Heart size={20} fill={hasLiked ? "currentColor" : "none"} />
                    <span>{post.likes.length} إعجاب</span>
                  </button>
                  <button 
                    onClick={() => {
                      setReplyTo(post);
                      document.getElementById('publish-box')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                    className="flex flex-row-reverse items-center gap-2 text-text-muted hover:text-primary font-black arabic-text text-sm transition-colors"
                  >
                    <MessageSquare size={20} />
                    <span>الرد</span>
                  </button>
                  <button className="flex flex-row-reverse items-center gap-2 text-text-muted hover:text-green-500 font-black arabic-text text-sm transition-colors mr-auto">
                    <Share2 size={20} />
                  </button>
                  <div className="flex flex-row-reverse items-center gap-2 text-text-muted font-black arabic-text text-sm mr-auto transition-colors">
                     <span>{post.views || Math.floor(Math.random() * 50) + 10} مشاهدة</span>
                  </div>
                </div>
              </motion.div>

              {/* Render Replies */}
              {replies.length > 0 && (
                <div className="mr-12 space-y-4 border-r-2 border-slate-50 dark:border-slate-800 pr-4">
                   {replies.map((reply) => {
                     const replyHasLiked = user ? reply.likes.includes(user.uid) : false;
                     return (
                       <div key={reply.id} className="bg-slate-50/50 dark:bg-slate-900/30 p-4 rounded-[24px] border border-slate-100 dark:border-slate-800 transition-colors duration-300">
                          <div className="flex flex-row-reverse justify-between items-start mb-2">
                            <div className="flex flex-row-reverse gap-3">
                               <ProfileAvatar 
                                 uid={reply.authorId}
                                 photoURL={reply.authorPhotoURL}
                                 inventory={reply.authorInventory}
                                 level={reply.authorLevel}
                                 size="sm"
                               />
                               <div className="text-right">
                                  <div className="flex flex-row-reverse items-center gap-2">
                                     <span className="text-sm font-black text-text-main arabic-text transition-colors duration-300">{reply.authorName}</span>
                                     {reply.authorLevel && (
                                       <LevelBadge level={reply.authorLevel} size="sm" />
                                     )}
                                     {reply.replyToName && (
                                       <span className="text-[9px] font-bold text-primary arabic-text">رد على {reply.replyToName}</span>
                                     )}
                                  </div>
                                  <p className="text-[9px] text-text-muted font-bold arabic-text flex flex-row-reverse items-center gap-1 transition-colors duration-300">
                                    <span>{new Date(reply.timestamp?.toDate ? reply.timestamp.toDate() : reply.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                                    {reply.isEdited && <span className="text-slate-300 dark:text-slate-600">(معدل)</span>}
                                  </p>
                               </div>
                            </div>
                            {(user?.uid === reply.authorId || profile?.role === 'admin') ? (
                              <div className="flex gap-2">
                                 {user?.uid === reply.authorId && (
                                   <button 
                                     onClick={() => {
                                       setEditingPostId(reply.id);
                                       setEditingContent(reply.content);
                                     }} 
                                     className="text-slate-300 hover:text-blue-500 transition-colors"
                                   >
                                     <Edit2 size={14} />
                                   </button>
                                 )}
                                 <button onClick={() => confirmDelete(reply.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                                   <Trash2 size={14} />
                                 </button>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <button onClick={() => blockUser(reply.authorId)} className="text-slate-200 hover:text-red-400 transition-colors" title="حظر">
                                    <Ban size={14} />
                                </button>
                                <button 
                                  onClick={() => reportPost(reply)} 
                                  className={`transition-colors ${reply.reports?.includes(profile?.uid || '') ? 'text-amber-400' : 'text-slate-200 hover:text-amber-400'}`} 
                                  title="إبلاغ"
                                >
                                    <Flag size={14} fill={reply.reports?.includes(profile?.uid || '') ? "currentColor" : "none"} />
                                </button>
                              </div>
                            )}
                          </div>
                          
                          {editingPostId === reply.id ? (
                            <div className="space-y-3 px-2 mb-3">
                              <textarea
                                value={editingContent}
                                onChange={(e) => setEditingContent(e.target.value)}
                                className="w-full bg-surface border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-right arabic-text text-sm font-bold focus:ring-2 focus:ring-primary/20 min-h-[80px] resize-none text-slate-900 dark:text-white"
                              />
                              <div className="flex flex-row-reverse gap-2">
                                <button onClick={() => handleEditSubmit(reply.id)} className="bg-primary text-white px-3 py-1.5 rounded-lg text-xs font-bold arabic-text">حفظ</button>
                                <button onClick={() => setEditingPostId(null)} className="bg-slate-200 dark:bg-slate-800 text-text-muted px-3 py-1.5 rounded-lg text-xs font-bold arabic-text">إلغاء</button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-text-muted arabic-text text-right mb-3 px-2 whitespace-pre-wrap transition-colors duration-300">{reply.content}</p>
                          )}
                          
                          {reply.mediaUrl && (
                            <div className="mb-3 rounded-2xl overflow-hidden border border-slate-200 w-fit ml-auto">
                               {reply.mediaType === 'image' ? (
                                 <img src={reply.mediaUrl} className="max-h-48 object-cover" alt="Reply content" />
                               ) : (
                                 <video src={reply.mediaUrl} className="max-h-48" controls />
                               )}
                            </div>
                          )}

                          <div className="flex flex-row-reverse items-center gap-4">
                             <button 
                               onClick={() => handleLike(reply.id, replyHasLiked)}
                               className={`flex flex-row-reverse items-center gap-1.5 text-[10px] font-black arabic-text ${replyHasLiked ? 'text-red-500' : 'text-slate-400'}`}
                             >
                                <Heart size={14} fill={replyHasLiked ? "currentColor" : "none"} />
                                <span>{reply.likes.length}</span>
                             </button>
                             <button 
                                onClick={() => {
                                  setReplyTo(reply);
                                  document.getElementById('publish-box')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }}
                                className="text-[10px] font-black text-slate-400 arabic-text hover:text-primary transition-all"
                             >
                               رد
                             </button>
                          </div>
                       </div>
                     );
                   })}
                </div>
              )}
            </div>
          );
        })}
      </div>
      </div>

      {/* Social Sidebar */}
      <div className="w-full lg:w-80 space-y-8">
         <div className="bg-surface p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-xl shadow-primary/5 transition-colors duration-300">
            <h3 className="text-lg font-black text-text-main arabic-text mb-6 text-right">إحصائيات المجتمع 📈</h3>
            <div className="space-y-4">
               {[
                 { label: 'إجمالي المشاركات', val: filteredPosts.length, color: 'text-primary', bg: 'bg-primary/5' },
                 { label: 'الطلاب المتفاعلين', val: totalInteractingStudents, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/10' },
                 { label: 'أوسمة منحت اليوم', val: Math.floor(filteredPosts.length / 5) + 3, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/10' },
               ].map((stat, i) => (
                 <div key={i} className={`p-4 ${stat.bg} rounded-2xl flex flex-row-reverse justify-between items-center`}>
                    <span className="text-xs font-black text-text-muted arabic-text">{stat.label}</span>
                    <span className={`text-sm font-black ${stat.color}`}>{stat.val}</span>
                 </div>
               ))}
            </div>
         </div>

         <div className="bg-slate-900 p-8 rounded-[40px] text-white overflow-hidden relative group">
            <div className="relative z-10">
               <h3 className="text-lg font-black arabic-text text-right mb-4">نشط الآن 🔥</h3>
               <div className="flex flex-wrap flex-row-reverse gap-2">
                  {activeUsers.map(u => (
                    <div key={u.uid} className="w-10 h-10 rounded-xl border-2 border-white/20 bg-white/10 flex items-center justify-center overflow-hidden hover:scale-110 transition-transform cursor-pointer">
                       <img src={u.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.uid}`} alt="active user" className="w-full h-full object-cover" />
                    </div>
                  ))}
                  <div className="w-10 h-10 rounded-xl border-2 border-white/20 bg-primary flex items-center justify-center text-[10px] font-black">+{Math.max(0, totalInteractingStudents - activeUsers.length)}</div>
               </div>
            </div>
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-primary/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
         </div>
      </div>

      <AnimatePresence>
        {postToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-surface rounded-[32px] p-8 max-w-sm w-full shadow-2xl text-center border border-slate-100 dark:border-slate-800 transition-colors duration-300"
            >
              <div className="w-20 h-20 bg-red-50 dark:bg-red-900/10 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-100 dark:shadow-none">
                <Trash2 size={40} />
              </div>
              <h4 className="text-2xl font-black text-text-main mb-3 arabic-text transition-colors duration-300">تأكيد الحذف</h4>
              <p className="text-text-muted font-bold mb-8 arabic-text leading-relaxed transition-colors duration-300">هل أنت متأكد من رغبتك في حذف هذه المشاركة نهائياً؟ لا يمكن التراجع عن هذا الإجراء.</p>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => handleDeletePost(postToDelete)}
                  className="w-full py-4 bg-red-500 text-white rounded-2xl font-black text-lg hover:bg-red-600 transition-all shadow-lg shadow-red-200 active:scale-95"
                >
                  نعم، احذفها
                </button>
                <button
                  onClick={() => setPostToDelete(null)}
                  className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-text-muted rounded-2xl font-black text-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
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
