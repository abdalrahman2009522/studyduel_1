import React, { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

const RECITERS = {
  'mishary': 'https://server8.mp3quran.net/afs/001.mp3',
  'shuraim': 'https://server7.mp3quran.net/shur/001.mp3',
  'sudais': 'https://server11.mp3quran.net/sds/001.mp3',
  'ghamdi': 'https://server7.mp3quran.net/s_gmd/001.mp3',
  'aldusari': 'https://server11.mp3quran.net/yasser/001.mp3',
  'almuaiqly': 'https://server12.mp3quran.net/maher/001.mp3'
};

export function QuranPlayer() {
  const { profile } = useAuth();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioRef.current || !profile?.settings) return;

    const { quranEnabled, quranReciter } = profile.settings;

    if (quranEnabled) {
      const url = RECITERS[quranReciter as keyof typeof RECITERS] || RECITERS.mishary;
      audioRef.current.src = url;
      audioRef.current.volume = 0.2; // Keep it low as background
      audioRef.current.loop = true;
      audioRef.current.play().catch(e => console.log("Auto-play blocked, interaction needed."));
    } else {
      audioRef.current.pause();
    }
  }, [profile?.settings?.quranEnabled, profile?.settings?.quranReciter]);

  return <audio ref={audioRef} className="hidden" />;
}
