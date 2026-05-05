import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserStats } from '../types';

interface AuthContextType {
  user: FirebaseUser | null;
  profile: any | null;
  loading: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  isMFAPending: boolean;
  verifyMFA: (code: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  isModerator: false,
  isMFAPending: false,
  verifyMFA: async () => false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [mfaVerified, setMfaVerified] = useState(false);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (!firebaseUser) {
        setMfaVerified(false);
      }
      
      // Cleanup previous profile listener if it exists
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        let currentProfile = null;
        if (!userDoc.exists()) {
          const newProfile = {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || 'طالب جديد',
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL || `https://api.dicebear.com/7.x/open-peeps/svg?seed=${firebaseUser.uid}`,
            bio: 'متحمس للتعلم!',
            role: ['keep.goingmj1@gmail.com', 'aaboodym16@gmail.com'].includes(firebaseUser.email || '') ? 'admin' : 'user',
            stats: {
              xp: 0,
              level: 1,
              wins: 0,
              totalDuels: 0,
              streak: 0
            },
            settings: {
              theme: 'default',
              quranEnabled: false,
              quranReciter: 'mishary',
              mfaEnabled: false
            }
          };
          await setDoc(userDocRef, newProfile);
          currentProfile = newProfile;
          setProfile(newProfile);
        } else {
          currentProfile = userDoc.data();
          // Upgrade role if needed
          if (['keep.goingmj1@gmail.com', 'aaboodym16@gmail.com'].includes(firebaseUser.email || '') && currentProfile.role !== 'admin') {
             import('firebase/firestore').then(({ updateDoc }) => {
               updateDoc(userDocRef, { role: 'admin' }).catch(console.error);
             });
             currentProfile.role = 'admin';
          }
          setProfile(currentProfile);
        }

        // Start real-time listener for profile changes
        unsubscribeProfile = onSnapshot(userDocRef, (snapshot) => {
          if (snapshot.exists()) {
            setProfile(snapshot.data());
          }
        }, (error) => {
          console.warn("Firestore profile sync warning (retrying...):", error.message);
        });
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const isAdmin = profile?.role === 'admin' || ['keep.goingmj1@gmail.com', 'aaboodym16@gmail.com'].includes(user?.email || '');
  const isModerator = profile?.role === 'moderator' || isAdmin;
  const isMFAPending = !!(user && profile?.settings?.mfaEnabled && !mfaVerified);

  const verifyMFA = async (code: string) => {
    // Simulate verification (in real world, this would verify a code sent to email/phone)
    if (code === '123456') {
      setMfaVerified(true);
      return true;
    }
    return false;
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, isModerator, isMFAPending, verifyMFA }}>
      {children}
    </AuthContext.Provider>
  );
};
