import { useState, useRef, useCallback, useEffect } from "react";
import { useNotifications } from "./use-notifications";

const ADHAN_CACHE_KEY = 'adhan-audio-cache';

export function useAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPrayer, setCurrentPrayer] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { settings } = useNotifications();

  // Preload and cache audio
  useEffect(() => {
    const preloadAudio = async () => {
      try {
        if (!audioRef.current) {
          audioRef.current = new Audio('/adhan.mp3');
          audioRef.current.preload = 'auto';
          
          audioRef.current.onloadeddata = () => {
            setIsLoaded(true);
            console.log('Adhan audio loaded and cached');
          };
          
          audioRef.current.onended = () => {
            setIsPlaying(false);
            setCurrentPrayer(null);
          };
          
          audioRef.current.onerror = (error) => {
            console.error('Error loading adhan:', error);
            setIsPlaying(false);
            setCurrentPrayer(null);
          };
        }
      } catch (error) {
        console.error('Error preloading audio:', error);
      }
    };

    preloadAudio();
  }, []);

  const playAdhan = useCallback((prayerName?: string) => {
    if (!audioRef.current || !isLoaded) {
      console.warn('Audio not ready');
      return;
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
  }, [settings, isLoaded]);

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
    isLoaded,
    playAdhan,
    stopAdhan,
    testAdhan,
  };
}