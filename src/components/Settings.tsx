import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  User, 
  Palette, 
  Save, 
  Music,
  Play,
  Pause,
  ShieldCheck,
  Lock,
  Moon,
  Sun,
  Upload
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'react-hot-toast';
import { SHOP_ITEMS } from '../lib/gameLogic';

const RECITERS = [
  { id: 'mishary', name: 'مشاري العفاسي', url: 'https://server8.mp3quran.net/afs/001.mp3' },
  { id: 'shuraim', name: 'سعود الشريم', url: 'https://server7.mp3quran.net/shur/001.mp3' },
  { id: 'sudais', name: 'عبد الرحمن السديس', url: 'https://server11.mp3quran.net/sds/001.mp3' },
  { id: 'ghamdi', name: 'سعد الغامدي', url: 'https://server7.mp3quran.net/s_gmd/001.mp3' },
  { id: 'aldusari', name: 'ياسر الدوسري', url: 'https://server11.mp3quran.net/yasser/001.mp3' },
  { id: 'almuaiqly', name: 'ماهر المعيقلي', url: 'https://server12.mp3quran.net/maher/001.mp3' },
];

const AVATARS = [
  'pixel-art', 'bottts', 'adventurer', 'avataaars', 'big-smile', 'fun-emoji'
];

export function Settings() {
  const { profile } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  
  const [formData, setFormData] = useState({
    displayName: profile?.displayName || '',
    photoURL: profile?.photoURL || '',
    bio: profile?.bio || '',
    quranEnabled: profile?.settings?.quranEnabled || false,
    quranReciter: profile?.settings?.quranReciter || 'mishary',
    isPublic: profile?.settings?.isPublic ?? true,
    autoSync: profile?.settings?.autoSync ?? true,
    mfaEnabled: profile?.settings?.mfaEnabled ?? false,
    activeFrame: profile?.inventory?.activeFrame || '',
    activeEffect: profile?.inventory?.activeEffect || ''
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [showAvatarGallery, setShowAvatarGallery] = useState(false);
  const [audioState, setAudioState] = useState<{ playing: boolean, id: string | null }>({ playing: false, id: null });
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit for base64
        toast.error('الصورة كبيرة جداً، يرجى اختيار صورة أقل من 1 ميجابايت');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, photoURL: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', profile.uid), {
        displayName: formData.displayName,
        photoURL: formData.photoURL,
        bio: formData.bio,
        'inventory.activeFrame': formData.activeFrame,
        'inventory.activeEffect': formData.activeEffect,
        settings: {
          quranEnabled: formData.quranEnabled,
          quranReciter: formData.quranReciter,
          isPublic: formData.isPublic,
          autoSync: formData.autoSync,
          mfaEnabled: formData.mfaEnabled
        }
      });
      toast.success(t('settings_saved') || 'تم حفظ الإعدادات بنجاح! ✨');
    } catch (err) {
      console.error('Update settings failed:', err);
      toast.error('حدث خطأ أثناء الحفظ');
    } finally {
      setIsSaving(false);
    }
  };

  const selectAvatar = (style: string) => {
    const newAvatar = `https://api.dicebear.com/7.x/${style}/svg?seed=${profile?.uid || 'default'}`;
    setFormData({ ...formData, photoURL: newAvatar });
    setShowAvatarGallery(false);
  };

  const togglePreview = (reciter: any) => {
    if (audioState.id === reciter.id && audioState.playing) {
       audioRef.current?.pause();
       setAudioState({ playing: false, id: null });
    } else {
       if (audioRef.current) {
         audioRef.current.src = reciter.url;
         audioRef.current.play();
         setAudioState({ playing: true, id: reciter.id });
       }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <audio ref={audioRef} />
      
      <div className="flex flex-row-reverse items-center justify-between">
        <h1 className="text-3xl font-black arabic-text">{t('settings') || 'الإعدادات'} ⚙️</h1>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-2xl font-bold arabic-text shadow-lg shadow-primary/20 hover:scale-105 transition-all disabled:opacity-50"
        >
          {isSaving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
          <Save size={18} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-[40px] border border-slate-100 dark:border-slate-700 shadow-xl shadow-primary/5 text-center">
             <div className="relative inline-block mb-6 pt-4 px-4">
                <div className={`relative w-32 h-32 rounded-full mx-auto transition-all`}>
                  {/* Active Effect Overlay */}
                  {formData.activeEffect && (
                    <div className={`absolute inset-0 rounded-full z-10 pointer-events-none ${SHOP_ITEMS.find(i => i.id === formData.activeEffect)?.image}`} />
                  )}
                  {/* Active Frame Overlay */}
                  {formData.activeFrame && (
                    <div className={`absolute -inset-2 rounded-full z-20 pointer-events-none ring-4 ${SHOP_ITEMS.find(i => i.id === formData.activeFrame)?.image}`} />
                  )}
                  <img 
                    src={formData.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.uid}`} 
                    alt="Avatar" 
                    className="w-full h-full rounded-full object-cover shadow-lg" 
                  />
                </div>
             </div>
             
             <div className="text-right space-y-4">
                <div>
                   <label className="text-[10px] font-black arabic-text text-slate-400 block mb-1">تحديث الصورة الشخصية</label>
                   <input 
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                   />
                   <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-center text-xs arabic-text dark:text-white hover:border-primary/50 transition-all flex items-center justify-center gap-2 group"
                   >
                      <Upload size={16} className="text-slate-400 group-hover:text-primary" />
                      <span>رفع صورة من الجهاز</span>
                   </button>
                </div>

                <div className="grid grid-cols-1 gap-3">
                   <div>
                      <label className="text-[10px] font-black arabic-text text-slate-400 block mb-1">تفعيل الإطار</label>
                      <select 
                        value={formData.activeFrame}
                        onChange={e => setFormData({...formData, activeFrame: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-900 border-transparent rounded-xl px-4 py-2 text-right text-xs arabic-text dark:text-white"
                      >
                        <option value="">بدون إطار</option>
                        {profile?.inventory?.frames?.map(frameId => (
                          <option key={frameId} value={frameId}>{SHOP_ITEMS.find(i => i.id === frameId)?.nameAr || frameId}</option>
                        ))}
                      </select>
                   </div>
                   <div>
                      <label className="text-[10px] font-black arabic-text text-slate-400 block mb-1">تفعيل التأثير</label>
                      <select 
                        value={formData.activeEffect}
                        onChange={e => setFormData({...formData, activeEffect: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-900 border-transparent rounded-xl px-4 py-2 text-right text-xs arabic-text dark:text-white"
                      >
                        <option value="">بدون تأثير</option>
                        {profile?.inventory?.effects?.map(effectId => (
                          <option key={effectId} value={effectId}>{SHOP_ITEMS.find(i => i.id === effectId)?.nameAr || effectId}</option>
                        ))}
                      </select>
                   </div>
                </div>
             </div>

             <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700">
                <h3 className="text-xl font-black arabic-text text-slate-800 dark:text-white">{formData.displayName}</h3>
                <p className="text-sm text-slate-400 arabic-text mb-6">@{profile?.role}</p>
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700 text-xs arabic-text text-slate-500 dark:text-slate-400 leading-relaxed italic text-right">
                    "{formData.bio || 'لا يوجد وصف حالياً'}"
                </div>
             </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <section className="bg-white dark:bg-slate-800 p-8 rounded-[40px] border border-slate-100 dark:border-slate-700 shadow-xl shadow-primary/5">
            <div className="flex items-center flex-row-reverse gap-3 mb-8">
              <Palette className="text-primary" />
              <h2 className="text-xl font-bold arabic-text dark:text-white">واجهة المستخدم</h2>
            </div>

            <div className="space-y-6">
              <div className="flex flex-row-reverse items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700">
                <div className="text-right">
                  <div className="font-bold arabic-text text-slate-700 dark:text-slate-200">لغة الواجهة</div>
                  <div className="text-xs text-slate-400 arabic-text">اختر لغتك المفضلة للتصفح</div>
                </div>
                <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-100 dark:border-slate-700">
                  <button 
                    onClick={() => setLanguage('ar')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${language === 'ar' ? 'bg-primary text-white' : 'text-slate-400'}`}
                  >
                    العربية
                  </button>
                  <button 
                    onClick={() => setLanguage('en')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${language === 'en' ? 'bg-primary text-white' : 'text-slate-400'}`}
                  >
                    English
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white dark:bg-slate-800 p-8 rounded-[40px] border border-slate-100 dark:border-slate-700 shadow-xl shadow-primary/5">
            <div className="flex items-center flex-row-reverse gap-3 mb-6">
              <User className="text-primary" />
              <h2 className="text-xl font-bold arabic-text dark:text-white">البيانات الشخصية</h2>
            </div>
            <div className="space-y-4">
              <div className="text-right">
                <label className="text-xs font-bold arabic-text text-slate-400 block mb-2 px-1">الاسم المستعار</label>
                <input 
                  type="text" 
                  value={formData.displayName}
                  onChange={e => setFormData({...formData, displayName: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-900 border-transparent dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:border-primary/20 rounded-2xl px-6 py-3.5 text-right arabic-text dark:text-white outline-none transition-all font-bold"
                />
              </div>
              <div className="text-right">
                <label className="text-xs font-bold arabic-text text-slate-400 block mb-2 px-1">النبذة التعريفية</label>
                <textarea 
                  rows={3}
                  value={formData.bio}
                  onChange={e => setFormData({...formData, bio: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-900 border-transparent dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:border-primary/20 rounded-2xl px-6 py-3.5 text-right arabic-text dark:text-white outline-none transition-all font-bold resize-none"
                />
              </div>
            </div>
          </section>

          <section className="bg-white dark:bg-slate-800 p-8 rounded-[40px] border border-slate-100 dark:border-slate-700 shadow-xl shadow-primary/5">
            <div className="flex items-center flex-row-reverse gap-3 mb-8">
              <Music className="text-primary" />
              <h2 className="text-xl font-bold arabic-text dark:text-white">الخلفية الصوتية</h2>
            </div>
            
            <div className="space-y-8">
              <div className="flex flex-row-reverse items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700">
                <div className="text-right">
                  <div className="font-bold arabic-text text-slate-700 dark:text-slate-200">تفعيل القرآن الكريم</div>
                  <div className="text-xs text-slate-400 arabic-text">يعمل تلقائياً في خلفية الموقع بصوت هادئ</div>
                </div>
                <button 
                   onClick={() => setFormData({...formData, quranEnabled: !formData.quranEnabled})}
                   className={`w-14 h-8 rounded-full relative transition-colors duration-300 ${formData.quranEnabled ? 'bg-primary' : 'bg-slate-300'}`}
                >
                  <motion.div 
                    animate={{ x: formData.quranEnabled ? 28 : 4 }}
                    className="absolute top-1 left-0 w-6 h-6 bg-white rounded-full shadow-sm" 
                  />
                </button>
              </div>

              {formData.quranEnabled && (
                <div className="space-y-4">
                  <label className="text-xs font-bold arabic-text text-slate-400 block p-1 text-right">اختر القارئ المفضل</label>
                  <div className="grid grid-cols-2 gap-3">
                    {RECITERS.map(reciter => (
                      <div 
                        key={reciter.id}
                        onClick={() => setFormData({...formData, quranReciter: reciter.id})}
                        className={`
                          p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-row-reverse items-center justify-between
                          ${formData.quranReciter === reciter.id ? 'border-primary bg-blue-50/50 dark:bg-primary/10' : 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:border-slate-200'}
                        `}
                      >
                         <span className={`font-bold arabic-text ${formData.quranReciter === reciter.id ? 'text-primary' : 'text-slate-600 dark:text-slate-300'}`}>{reciter.name}</span>
                         <button 
                            onClick={(e) => { e.stopPropagation(); togglePreview(reciter); }}
                            className={`p-2 rounded-xl ${audioState.id === reciter.id ? 'bg-primary text-white' : 'bg-white dark:bg-slate-800 text-slate-400 shadow-sm'}`}
                         >
                           {audioState.id === reciter.id ? <Pause size={14} /> : <Play size={14} />}
                         </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
