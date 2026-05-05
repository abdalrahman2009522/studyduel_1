export type Subject = {
  id: string;
  name: string;
  nameAr: string;
  icon: string;
  color: string;
  questionsCount: number;
};

export type Question = {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
};

export type UserStats = {
  level: number;
  xp: number;
  wins: number;
  totalDuels: number;
  streak: number;
  points: number;
  rank: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Master';
  subjectProficiency?: Record<string, number>;
};


export type AppUser = {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  bio?: string;
  role: 'user' | 'moderator' | 'admin';
  stats: UserStats;
  inventory?: {
    frames: string[];
    effects: string[];
    activeFrame?: string;
    activeEffect?: string;
  };
  achievements?: string[];
  friends?: string[];
  blockedUsers?: string[];
  settings?: {
    theme: string;
    quranEnabled: boolean;
    quranReciter: string;
  }
};

export type Achievement = {
  id: string;
  nameAr: string;
  descriptionAr: string;
  icon: string;
  criteria: any;
  xpReward: number;
};

export type ShopItem = {
  id: string;
  nameAr: string;
  type: 'frame' | 'effect';
  price: number;
  image: string;
};

export type ChallengeRecord = {
  id: string;
  userId: string;
  subjectId: string;
  opponentId?: string;
  score: number;
  opponentScore: number;
  win: boolean;
  status?: 'active' | 'completed';
  currentQuestionIndex?: number;
  questions: {
    questionId: string;
    correct?: boolean;
    answerIndex?: number;
    text: string;
    options: string[];
    correctAnswer: number;
  }[];
  timestamp: any;
};

export type CommunityPost = {
  id: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  authorLevel?: number;
  authorInventory?: {
    activeFrame?: string;
    activeEffect?: string;
  };
  content: string;
  likes: string[];
  timestamp: any;
  parentId?: string;
  rootId?: string;
  replyToName?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  isEdited?: boolean;
  views?: number;
  reports?: string[];
};

export const SUBJECTS: Subject[] = [
  { id: 'arabic', name: 'Arabic', nameAr: 'اللغة العربية', icon: 'PenTool', color: 'bg-primary', questionsCount: 100 },
  { id: 'english', name: 'English', nameAr: 'اللغة الإنجليزية', icon: 'Languages', color: 'bg-indigo-600', questionsCount: 100 },
  { id: 'islamic', name: 'Islamic Studies', nameAr: 'التربية الإسلامية', icon: 'BookOpen', color: 'bg-emerald-600', questionsCount: 80 },
  { id: 'history', name: 'History of Jordan', nameAr: 'تاريخ الأردن', icon: 'Landmark', color: 'bg-secondary', questionsCount: 100 },
];

export const MOCK_QUESTIONS: Record<string, Question[]> = {};
