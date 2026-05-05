import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const generateAIContent = async (model: string, prompt: string) => {
  try {
    const aiModel = model || "gemini-3-flash-preview";
    const response = await ai.models.generateContent({
      model: aiModel,
      contents: prompt
    });
    
    return { text: response.text, error: false };
  } catch (err: any) {
    console.error('AI Error:', err);
    const isApiKeyError = err?.message?.includes('API_KEY_INVALID') || !process.env.GEMINI_API_KEY;
    const errorMessage = isApiKeyError
      ? "يرجى إعداد مفتاح API الخاص بـ Gemini في الإعدادات (Settings -> Secrets)."
      : "عذراً، واجهت مشكلة في الاتصال بالذكاء الاصطناعي.";
    return { text: errorMessage, error: true };
  }
};

