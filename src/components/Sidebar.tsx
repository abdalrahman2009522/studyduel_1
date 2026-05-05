import React from 'react';
import { motion } from 'motion/react';
import { 
  Trophy, 
  Users, 
  User,
  BookOpen, 
  Settings, 
  LogOut, 
  LayoutDashboard,
  Menu,
  X,
  MessageCircle,
  ShieldCheck,
  History,
  GraduationCap,
  Zap,
  ShoppingBag,
  TrendingUp,
  Lightbulb,
  Wifi,
  WifiOff,
  Bell,
  Archive
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ProfileAvatar } from './ProfileAvatar';
import { useSocket } from '../context/SocketContext';
import { useLanguage } from '../context/LanguageContext';
import { logout } from '../lib/firebase';
import { SHOP_ITEMS } from '../lib/gameLogic';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const { profile, isAdmin } = useAuth();
  const { isConnected } = useSocket();
  const { isRTL } = useLanguage();

  const navItems = [
    { id: 'dashboard', label: isRTL ? 'الرئيسية' : 'Dashboard', icon: LayoutDashboard },
    { id: 'review', label: isRTL ? 'مركز المراجعة' : 'Review Center', icon: History },
    { id: 'leaderboard', label: isRTL ? 'المتصدرون' : 'Leaderboard', icon: Trophy },
    { id: 'shop', label: isRTL ? 'المتجر' : 'Shop', icon: ShoppingBag },
    { id: 'vault', label: isRTL ? 'الخزنة' : 'Vault', icon: Archive },
    { id: 'analysis', label: isRTL ? 'تحليل المهارات' : 'Skill Analysis', icon: TrendingUp },
    { id: 'community', label: isRTL ? 'الدردشة العامة' : 'Public Chat', icon: MessageCircle },
    { id: 'suggestions', label: isRTL ? 'الاقتراحات' : 'Suggestions', icon: Lightbulb },
  ];

  if (isAdmin) {
    navItems.push({ id: 'admin', label: isRTL ? 'لوحة التحكم' : 'Admin Panel', icon: ShieldCheck });
  }

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`lg:hidden fixed top-4 ${isRTL ? 'right-4' : 'left-4'} z-50 p-2 bg-surface rounded-lg shadow-md border border-slate-100 dark:border-slate-800 transition-colors duration-300`}
      >
        {isOpen ? <X size={24} className="text-text-main" /> : <Menu size={24} className="text-text-main" />}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-primary/20 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 ${isRTL ? 'right-0 border-l' : 'left-0 border-r'} z-40 w-72 bg-surface shadow-2xl shadow-primary/10 border-slate-100 dark:border-slate-800
        transform transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : (isRTL ? 'translate-x-full lg:translate-x-0' : '-translate-x-full lg:translate-x-0')}
      `}>
        <div className="flex flex-col h-full py-10 px-6">
          <div className="flex flex-row-reverse items-center justify-between px-2 mb-12">
            <div className="flex flex-row-reverse items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/30 transform rotate-3">
                <Zap size={32} />
              </div>
              <div className="flex flex-col items-end leading-none">
                <span className="text-2xl font-black bg-gradient-to-l from-primary to-blue-600 bg-clip-text text-transparent arabic-text tracking-tight transition-colors duration-300">Study Duel ⚔️</span>
                <span className="text-[10px] font-black arabic-text text-text-muted/60 uppercase tracking-[0.2em] mt-1 mr-1">المستقبل يبدأ هنا</span>
              </div>
            </div>
          </div>

          <div className="flex flex-row-reverse items-center justify-between px-2 mb-6">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-colors duration-300 ${isConnected ? 'bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-800 text-green-600' : 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-800 text-red-600'}`}>
               <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`} />
               <span className="text-[10px] font-black arabic-text uppercase">{isConnected ? 'متصل' : 'أوفلاين'}</span>
            </div>
          </div>

          {profile && (
            <div className="px-2 mb-10 group cursor-pointer" onClick={() => setActiveTab('settings')}>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-[28px] border border-slate-100 dark:border-slate-800 flex flex-row-reverse items-center gap-4 hover:border-primary/20 hover:bg-surface dark:hover:bg-slate-800 hover:shadow-lg transition-all duration-300">
                <div className="relative">
                   <ProfileAvatar 
                     uid={profile.uid}
                     photoURL={profile.photoURL}
                     inventory={profile.inventory}
                     size="md"
                     className="group-hover:rotate-6"
                   />
                  {isConnected && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full z-10" />}
                </div>
                <div className="text-right flex-1 min-w-0">
                  <div className="text-sm font-black text-text-main arabic-text leading-tight truncate transition-colors duration-300">{profile.displayName}</div>
                  <div className="text-[10px] text-text-muted font-bold arabic-text uppercase mt-0.5">
                    {profile.role === 'admin' ? 'الإدارة' : 'طالب متميز'}
                  </div>
                </div>
              </div>
            </div>
          )}

          <nav className="flex-1 space-y-2.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsOpen(false);
                  }}
                  className={`
                    w-full flex flex-row-reverse items-center gap-4 px-5 py-4 rounded-[24px] transition-all duration-300 arabic-text font-black text-base group
                    ${isActive 
                      ? 'bg-primary text-white shadow-xl shadow-primary/30 border border-primary/50' 
                      : 'text-text-muted hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-text-main hover:translate-x-[-4px]'}
                  `}
                >
                  <div className={`
                    w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300
                    ${isActive ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800/50 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 group-hover:rotate-6'}
                  `}>
                    <Icon size={20} className={isActive ? 'text-white' : 'text-text-muted group-hover:text-primary'} />
                  </div>
                  <span className={isActive ? 'translate-x-[-2px]' : ''}>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="pt-8 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <button 
              onClick={() => setActiveTab('settings')}
              className={`
                 w-full flex flex-row-reverse items-center gap-4 px-5 py-4 rounded-[24px] transition-all arabic-text font-black text-base
                 ${activeTab === 'settings' 
                    ? 'bg-slate-800 dark:bg-slate-700 text-white shadow-xl' 
                    : 'text-text-muted hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-text-main'}
              `}
            >
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                 <Settings size={18} className={activeTab === 'settings' ? 'text-white' : 'text-text-muted'} />
              </div>
              <span>الإعدادات</span>
            </button>
            <button 
              onClick={() => {
                if (window.confirm('هل أنت متأكد من تسجيل الخروج؟')) {
                  logout();
                }
              }}
              className="w-full flex flex-row-reverse items-center gap-4 px-5 py-4 rounded-[24px] text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all arabic-text font-black text-base mt-2"
            >
              <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                 <LogOut size={18} className="text-red-500" />
              </div>
              <span>خروج</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
