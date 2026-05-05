import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'ar' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const translations: Record<Language, Record<string, string>> = {
  ar: {
    'dashboard': 'لوحة التحكم',
    'review': 'المراجعة',
    'leaderboard': 'المتصدرين',
    'shop': 'المتجر',
    'vault': 'الخزنة',
    'analysis': 'التحليل',
    'community': 'المجتمع',
    'suggestions': 'الاقتراحات',
    'settings': 'الإعدادات',
    'admin': 'لوحة الإدارة',
    'smart_guide': 'الدليل الذكي',
    'start_learning': 'ابدأ رحلة التعلم',
    'my_resume': 'سيرتي الذاتية',
    'daily_goals': 'أهداف اليوم',
    'ai_tip': 'نصيحة المعلم الذكي الـ AI',
    'delete_message': 'حذف الرسالة',
    'banned_word_error': 'تحتوي الرسالة على كلمات غير مسموح بها.',
    'search_placeholder': 'ابحث...',
    'welcome': 'مرحباً',
    'level': 'المستوى',
    'xp': 'الخبرة',
    'wins': 'الانتصارات',
    'total_duels': 'التحديات',
    'streak': 'السلسلة',
    'online': 'متصل',
    'offline': 'أوفلاين',
    'logout': 'خروج',
    'delete_confirm': 'هل أنت متأكد من الحذف؟',
    'send': 'إرسال',
    'edit': 'تعديل',
    'save': 'حفظ',
    'cancel': 'إلغاء',
    'user_info': 'بيانات المستخدم',
    'recent_activity': 'نشاط الطلاب الأخير',
    'rank': 'الرتبة',
    'status': 'الحالة',
    'active': 'نشط',
    'blocked': 'محظور',
  },
  en: {
    'dashboard': 'Dashboard',
    'review': 'Review',
    'leaderboard': 'Leaderboard',
    'shop': 'Shop',
    'vault': 'Vault',
    'analysis': 'Analysis',
    'community': 'Community',
    'suggestions': 'Suggestions',
    'settings': 'Settings',
    'admin': 'Admin Panel',
    'smart_guide': 'Smart Guide',
    'start_learning': 'Start Learning',
    'my_resume': 'My Resume',
    'daily_goals': 'Daily Goals',
    'ai_tip': 'AI Smart Tip',
    'delete_message': 'Delete Message',
    'banned_word_error': 'Message contains forbidden words.',
    'search_placeholder': 'Search...',
    'welcome': 'Welcome',
    'level': 'Level',
    'xp': 'XP',
    'wins': 'Wins',
    'total_duels': 'Duels',
    'streak': 'Streak',
    'online': 'Online',
    'offline': 'Offline',
    'logout': 'Logout',
    'delete_confirm': 'Are you sure you want to delete?',
    'send': 'Send',
    'edit': 'Edit',
    'save': 'Save',
    'cancel': 'Cancel',
    'user_info': 'User Info',
    'recent_activity': 'Recent Activity',
    'rank': 'Rank',
    'status': 'Status',
    'active': 'Active',
    'blocked': 'Blocked',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('language') as Language) || 'ar';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  const isRTL = language === 'ar';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
