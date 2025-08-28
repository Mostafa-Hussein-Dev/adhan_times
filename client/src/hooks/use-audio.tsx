import { useState, useRef, useCallback } from "react";
import { useNotifications } from "./use-notifications";

export function useAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPrayer, setCurrentPrayer] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { settings } = useNotifications();

  const playAdhan = useCallback((prayerName?: string) => {
    if (!audioRef.current) {
      audioRef.current = new Audio('/adhan.mp3');
      audioRef.current.onended = () => {
        setIsPlaying(false);
        setCurrentPrayer(null);
      };
      audioRef.current.onerror = (error) => {
        console.error('Error playing adhan:', error);
        setIsPlaying(false);
        setCurrentPrayer(null);
      };
    }

    if (settings?.adhanAutoPlay || prayerName) {
      audioRef.current.volume = parseInt(settings?.volume || "80") / 100;
      audioRef.current.currentTime = 0;
      
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setCurrentPrayer(prayerName || "Adhan");
          })
          .catch(error => {
            console.error('Error playing audio:', error);
            setIsPlaying(false);
            setCurrentPrayer(null);
          });
      }
    }
  }, [settings]);

  const stopAdhan = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentPrayer(null);
  }, []);

  const testAdhan = useCallback(() => {
    playAdhan("Test");
  }, [playAdhan]);

  return {
    isPlaying,
    currentPrayer,
    playAdhan,
    stopAdhan,
    testAdhan,
  };
}
