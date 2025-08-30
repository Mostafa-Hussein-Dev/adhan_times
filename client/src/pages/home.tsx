import { usePrayerTimes } from "@/hooks/use-prayer-times";
import { useNotifications } from "@/hooks/use-notifications";
import { PrayerCard } from "@/components/prayer-card";
import { AdhanModal } from "@/components/adhan-modal";
import { BottomNav } from "@/components/bottom-nav";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { useAudio } from "@/hooks/use-audio";
import type { NotificationSettings } from "@shared/schema";

const PRAYER_NAMES = [
  { key: 'fajr', name: 'Fajr', arabic: 'الصبح', icon: 'sun' },
  { key: 'dhuhr', name: 'Dhuhr', arabic: 'الظهر', icon: 'sun' },
  { key: 'asr', name: 'Asr', arabic: 'العصر', icon: 'cloud-sun' },
  { key: 'maghrib', name: 'Maghrib', arabic: 'المغرب', icon: 'moon' },
  { key: 'isha', name: 'Isha', arabic: 'العشاء', icon: 'star' },
];

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

function getCurrentDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function getNextPrayer(prayerTimes: any, settings: any) {
  if (!prayerTimes || !settings) return null;
  
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const prayers = PRAYER_NAMES.map(prayer => {
    const timeStr = prayerTimes[prayer.key as keyof typeof prayerTimes];
    const [hours, minutes] = timeStr.split(':').map(Number);
    const timeInMinutes = hours * 60 + minutes;
    
    return {
      ...prayer,
      time: timeStr,
      timeInMinutes,
      enabled: settings[`${prayer.key}Enabled`],
    };
  });
  
  // Find next prayer
  const upcomingPrayers = prayers.filter(prayer => prayer.timeInMinutes > currentTime);
  const nextPrayer = upcomingPrayers.length > 0 ? upcomingPrayers[0] : prayers[0]; // Tomorrow's first prayer
  
  if (nextPrayer) {
    const timeDiff = nextPrayer.timeInMinutes > currentTime 
      ? nextPrayer.timeInMinutes - currentTime 
      : (24 * 60) - currentTime + nextPrayer.timeInMinutes;
    
    const hours = Math.floor(timeDiff / 60);
    const minutes = timeDiff % 60;
    
    return {
      ...nextPrayer,
      formattedTime: formatTime(nextPrayer.time),
      countdown: hours > 0 ? `in ${hours}h ${minutes}m` : `in ${minutes}m`,
    };
  }
  
  return null;
}

export default function Home() {
  const { data: prayerTimes, isLoading: prayerTimesLoading, error: prayerTimesError } = usePrayerTimes();
  const { settings, isLoading: settingsLoading } = useNotifications();
  const { toast } = useToast();
  const [currentTime, setCurrentTime] = useState(new Date());
  const { playAdhan } = useAudio();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (prayerTimesError) {
      toast({
        title: "Error",
        description: "Failed to load prayer times. Please check your connection.",
        variant: "destructive",
      });
    }
  }, [prayerTimesError, toast]);

  // NEW: Prayer time checking effect
  useEffect(() => {
    if (!prayerTimes || !settings) return;

    const scheduleNextPrayer = () => {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      const prayers = [
        { key: 'fajr', name: 'Fajr', time: prayerTimes.fajr, enabled: settings.fajrEnabled },
        { key: 'dhuhr', name: 'Dhuhr', time: prayerTimes.dhuhr, enabled: settings.dhuhrEnabled },
        { key: 'asr', name: 'Asr', time: prayerTimes.asr, enabled: settings.asrEnabled },
        { key: 'maghrib', name: 'Maghrib', time: prayerTimes.maghrib, enabled: settings.maghribEnabled },
        { key: 'isha', name: 'Isha', time: prayerTimes.isha, enabled: settings.ishaEnabled },
      ].filter(p => p.enabled);

      // Convert prayer times to minutes
      const upcoming = prayers
        .map(prayer => {
          const [h, m] = prayer.time.split(':').map(Number);
          return { ...prayer, minutes: h * 60 + m };
        })
        .filter(prayer => prayer.minutes >= currentMinutes) // only future prayers today
        .sort((a, b) => a.minutes - b.minutes);

      const nextPrayer = upcoming[0];
      if (!nextPrayer) return; // no more prayers today

      const [h, m] = nextPrayer.time.split(':').map(Number);
      const prayerDate = new Date();
      prayerDate.setHours(h, m, 0, 0);

      const delay = prayerDate.getTime() - now.getTime();

      // Schedule exact trigger
      const timer = setTimeout(() => {
        // Fire notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(`Time for ${nextPrayer.name}`, {
            body: `It's time for ${nextPrayer.name} prayer`,
            icon: '/icon-192x192.png',
          });
        }

        if (settings.adhanAutoPlay) {
          playAdhan(nextPrayer.name);
        }

        // Schedule next one
        scheduleNextPrayer();
      }, delay);

      return timer;
    };

    const timerId = scheduleNextPrayer();

    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [prayerTimes, settings, playAdhan]);


  // NEW: Request notification permission on component mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  if (prayerTimesLoading || settingsLoading) {
    return (
      <div className="min-h-screen">
        {/* Header Skeleton */}
        <div className="bg-primary text-primary-foreground px-6 py-8 rounded-b-3xl">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-2">
              <Skeleton className="h-8 w-32 bg-primary-foreground/20" />
              <Skeleton className="h-4 w-48 bg-primary-foreground/20" />
            </div>
            <Skeleton className="w-12 h-12 rounded-full bg-primary-foreground/20" />
          </div>
          <Skeleton className="h-4 w-40 bg-primary-foreground/20" />
        </div>

        {/* Next Prayer Skeleton */}
        <div className="px-6 -mt-8 mb-6">
          <Card className="rounded-2xl p-6 shadow-lg">
            <div className="text-center space-y-2">
              <Skeleton className="h-4 w-20 mx-auto" />
              <Skeleton className="h-8 w-24 mx-auto" />
              <Skeleton className="h-12 w-32 mx-auto" />
              <Skeleton className="h-4 w-16 mx-auto" />
            </div>
          </Card>
        </div>

        {/* Prayer Cards Skeleton */}
        <div className="px-6 space-y-4 mb-24">
          {[...Array(5)].map((_, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Skeleton className="w-12 h-12 rounded-full mr-4" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-2 w-2 rounded-full ml-auto" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <BottomNav />
      </div>
    );
  }

  const nextPrayer = getNextPrayer(prayerTimes, settings);
  const prayers = PRAYER_NAMES.map(prayer => {
    const timeValue = prayerTimes ? prayerTimes[prayer.key as keyof typeof prayerTimes] : '';
    return {
      ...prayer,
      time: typeof timeValue === 'string' ? timeValue : '',
      enabled: settings ? settings[`${prayer.key}Enabled` as keyof NotificationSettings] as boolean : false,
    };
  });
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-6 py-8 rounded-b-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" data-testid="app-title">Prayer Times</h1>
            <p className="text-primary-foreground/80" data-testid="current-date">
              {getCurrentDate()}
            </p>
          </div>
          <div className="w-12 h-12 bg-primary-foreground/20 rounded-full flex items-center justify-center">
            🕌
          </div>
        </div>
        
        {/* Location */}
        <div className="flex items-center text-primary-foreground/90 mb-2">
          <MapPin className="w-4 h-4 mr-2" />
          <span data-testid="location">
            {prayerTimes?.location || "Beirut, Lebanon"}
          </span>
        </div>
      </div>

      {/* Next Prayer Highlight */}
      {nextPrayer && (
        <div className="px-6 -mt-8 mb-6">
          <div className="next-prayer rounded-2xl p-6 shadow-lg">
            <div className="text-center">
              <p className="text-primary-foreground/80 text-sm mb-1">Next Prayer</p>
              <h2 className="text-2xl font-bold mb-2" data-testid="next-prayer-name">
                {nextPrayer.name}
              </h2>
              <div className="text-3xl font-bold" data-testid="next-prayer-time">
                {nextPrayer.formattedTime}
              </div>
              <p className="text-primary-foreground/80 text-sm mt-2" data-testid="next-prayer-countdown">
                {nextPrayer.countdown}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Prayer Times List */}
      <div className="px-6 space-y-4 mb-24">
        {prayers.map((prayer, index) => (
          <PrayerCard
            key={prayer.key}
            prayer={prayer}
            isNext={nextPrayer?.key === prayer.key}
            data-testid={`prayer-card-${prayer.key}`}
          />
        ))}
      </div>

      <AdhanModal />
      <BottomNav />
    </div>
  );
}