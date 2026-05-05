import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Sidebar } from './components/Sidebar.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { QuizMode } from './components/QuizMode.tsx';
import { Leaderboard } from './components/Leaderboard.tsx';
import { Login } from './components/Login.tsx';
import { Chat } from './components/Chat.tsx';
import { Settings } from './components/Settings.tsx';
import { AdminPanel } from './components/AdminPanel.tsx';
import { QuranPlayer } from './components/QuranPlayer.tsx';
import { ReviewCenter } from './components/ReviewCenter.tsx';
import { Shop } from './components/Shop.tsx';
import { CommunityHub } from './components/CommunityHub.tsx';
import { Suggestions } from './components/Suggestions.tsx';
import { Vault } from './components/Vault.tsx';
import { SkillAnalysis } from './components/SkillAnalysis.tsx';
import { ChallengeNotification } from './components/ChallengeNotification.tsx';
import { MFAVerification } from './components/MFAVerification.tsx';
import { VirtualAssistant } from './components/VirtualAssistant.tsx';
import { Guide } from './components/Guide.tsx';
import { NotificationCenter } from './components/NotificationCenter.tsx';

import { useAuth } from './context/AuthContext.tsx';
import { useSocket } from './context/SocketContext.tsx';
import { useLanguage } from './context/LanguageContext.tsx';
import { useTheme } from './context/ThemeContext.tsx';

export default function App() {
  const [activeTab, setActiveTab] = React.useState('dashboard');
  const [activeDuelSubject, setActiveDuelSubject] = React.useState<string | null>(null);
  const { user, loading, isAdmin, profile, isMFAPending } = useAuth();
  const { socket } = useSocket();
  const { isRTL } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  
  React.useEffect(() => {
    if (!socket) return;
  
    socket.on('duel:found', (data) => {
      setActiveDuelSubject(data.subjectId || 'arabic'); 
    });
  
    socket.on('challenge:rejected', ({ from }) => {
      console.log('Challenge rejected by', from.displayName);
    });
  
    return () => {
      socket.off('duel:found');
      socket.off('challenge:rejected');
    };
  }, [socket]);
  
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  React.useEffect(() => {
    const handleTabChange = (e: any) => {
      setActiveTab(e.detail);
    };
    window.addEventListener('changeTab', handleTabChange);
    return () => window.removeEventListener('changeTab', handleTabChange);
  }, []);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Login />;
  }
  
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onStartDuel={setActiveDuelSubject} />;
      case 'review':
        return <ReviewCenter />;
      case 'leaderboard':
        return <Leaderboard />;
      case 'shop':
        return <Shop />;
      case 'vault':
        return <Vault />;
      case 'analysis':
        return <SkillAnalysis />;
      case 'community':
        return <CommunityHub />;
      case 'suggestions':
        return <Suggestions />;
      case 'settings':
        return <Settings />;
      case 'admin':
        return isAdmin ? <AdminPanel /> : <Dashboard onStartDuel={setActiveDuelSubject} />;
      default:
        return (
          <div className="max-w-4xl mx-auto py-10 text-center">
            <h2 className="text-3xl font-bold arabic-text mb-4 font-mono uppercase tracking-widest">{activeTab}</h2>
            <p className="text-gray-500 arabic-text">هذا القسم قيد التطوير حالياً.</p>
          </div>
        );
    }
  };
  
  return (
    <div className={`flex ${isRTL ? 'flex-row-reverse text-right' : 'flex-row text-left'} min-h-screen bg-background text-text-main transition-colors duration-300`}>
      <QuranPlayer />
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <div className={`flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6 ${isRTL ? 'md:flex-row-reverse' : ''}`}>
            <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="lg:hidden w-10 h-10 shrink-0" />
              <div className={isRTL ? 'text-right' : 'text-left'}>
                <h1 className="text-3xl font-black text-text-main arabic-text tracking-tighter transition-colors duration-300">
                  {activeTab === 'dashboard' ? (isRTL ? 'لوحة التحكم' : 'Dashboard') : 
                   activeTab === 'leaderboard' ? (isRTL ? 'قائمة المتصدرين' : 'Leaderboard') :
                   activeTab === 'shop' ? (isRTL ? 'المتجر المميز' : 'Premium Shop') :
                   activeTab === 'community' ? (isRTL ? 'المركز الاجتماعي' : 'Social Hub') :
                   (isRTL ? 'استكشف' : 'Explore')}
                </h1>
                <p className="text-sm text-text-muted font-bold arabic-text mt-1 transition-colors duration-300">
                  {isRTL ? 'أهلاً بك مجدداً، ' : 'Welcome back, '} {profile?.displayName} ✨
                </p>
              </div>
            </div>

            <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="flex items-center gap-3 px-5 py-3 bg-surface rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors duration-300">
                <div className={`w-2.5 h-2.5 rounded-full ${socket?.connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-xs font-black text-text-muted arabic-text uppercase tracking-wider">
                  {socket?.connected ? (isRTL ? 'أونلاين' : 'Online') : (isRTL ? 'أوفلاين' : 'Offline')}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleTheme}
                  className="w-12 h-12 flex items-center justify-center bg-surface rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 text-text-muted hover:text-primary transition-all hover:scale-105 active:scale-95"
                  title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                >
                  {theme === 'light' ? <Moon size={22} /> : <Sun size={22} />}
                </button>
                <NotificationCenter />
              </div>
            </div>
          </div>
          {renderContent()}
        </div>
      </main>

      <ChallengeNotification />
      <VirtualAssistant />
      <Guide />

      {isMFAPending && <MFAVerification />}

      {/* Duel Overlay */}
      {activeDuelSubject && (
        <QuizMode 
          subjectId={activeDuelSubject} 
          onClose={() => setActiveDuelSubject(null)} 
        />
      )}
    </div>
  );
}
