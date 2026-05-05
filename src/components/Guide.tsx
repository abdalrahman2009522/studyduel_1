import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, X, Sparkles, Navigation, ArrowRight } from 'lucide-react';

type GuideStep = {
  title: string;
  message: string;
  selector?: string; // CSS selector to highlight
};

const guideSteps: GuideStep[] = [
  { title: 'مرحباً!', message: 'أنا مساعدك الذكي وسأكون دليلك في Study Duel!' },
  { title: 'لوحة التحكم', message: 'هنا يمكنك متابعة تقدمك ومستواك الدراسي.', selector: '[data-tour="dashboard"]' },
  { title: 'التحديات', message: 'يمكنك الدخول في تحديات مباشرة مع زملائك من هنا.', selector: '[data-tour="quiz"]' },
  { title: 'المجتمع', message: 'تواصل مع أصدقائك وشارك أفكارك في المجتمع.', selector: '[data-tour="community"]' },
];

export function Guide() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const handleOpenGuide = () => {
      setIsOpen(true);
      setCurrentStep(0);
    };
    window.addEventListener('openGuide', handleOpenGuide);
    return () => window.removeEventListener('openGuide', handleOpenGuide);
  }, []);

  const nextStep = () => {
    if (currentStep < guideSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setIsOpen(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-24 left-24 z-[100] w-80 bg-white rounded-3xl shadow-2xl border border-indigo-100 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-indigo-600">
                <Sparkles size={20} />
                <h3 className="font-bold text-sm arabic-text">{guideSteps[currentStep].title}</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            
            <p className="text-sm arabic-text text-slate-700 font-bold mb-6 leading-relaxed">
              {guideSteps[currentStep].message}
            </p>
            
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400 font-bold arabic-text">
                {currentStep + 1} / {guideSteps.length}
              </span>
              <button
                onClick={nextStep}
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-black arabic-text hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                {currentStep === guideSteps.length - 1 ? 'إنهاء' : 'التالي'}
                <ArrowRight size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
