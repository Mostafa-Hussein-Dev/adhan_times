import type { PrayerTimes, NotificationSettings } from "@shared/schema";

export class PrayerNotificationService {
  private static instance: PrayerNotificationService;

  private constructor() {}

  public static getInstance(): PrayerNotificationService {
    if (!PrayerNotificationService.instance) {
      PrayerNotificationService.instance = new PrayerNotificationService();
    }
    return PrayerNotificationService.instance;
  }

  public async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!("Notification" in window)) {
      throw new Error("Browser does not support notifications");
    }

    if (Notification.permission === "granted") {
      return "granted";
    }

    if (Notification.permission === "denied") {
      return "denied";
    }

    return await Notification.requestPermission();
  }

  public scheduleNotifications(
    prayerTimes: PrayerTimes,
    settings: NotificationSettings
  ): void {
    if (Notification.permission !== "granted") {
      console.log("Notification permission not granted");
      return;
    }

    const prayers = [
      { key: 'fajr', name: 'Fajr', time: prayerTimes.fajr, enabled: settings.fajrEnabled },
      { key: 'dhuhr', name: 'Dhuhr', time: prayerTimes.dhuhr, enabled: settings.dhuhrEnabled },
      { key: 'asr', name: 'Asr', time: prayerTimes.asr, enabled: settings.asrEnabled },
      { key: 'maghrib', name: 'Maghrib', time: prayerTimes.maghrib, enabled: settings.maghribEnabled },
      { key: 'isha', name: 'Isha', time: prayerTimes.isha, enabled: settings.ishaEnabled },
    ];

    prayers.forEach(prayer => {
      if (prayer.enabled) {
        this.schedulePrayerNotification(prayer.name, prayer.time);
      }
    });
  }

  private schedulePrayerNotification(prayerName: string, prayerTime: string): void {
    const now = new Date();
    const [hours, minutes] = prayerTime.split(':').map(Number);
    
    const prayerDate = new Date();
    prayerDate.setHours(hours, minutes, 0, 0);
    
    // If the prayer time has passed for today, schedule for tomorrow
    if (prayerDate <= now) {
      prayerDate.setDate(prayerDate.getDate() + 1);
    }

    const timeUntilPrayer = prayerDate.getTime() - now.getTime();

    setTimeout(() => {
      this.showNotification(prayerName, prayerTime);
    }, timeUntilPrayer);

    console.log(`Scheduled notification for ${prayerName} at ${prayerTime} (in ${Math.round(timeUntilPrayer / 1000 / 60)} minutes)`);
  }

  private showNotification(prayerName: string, prayerTime: string): void {
    if (Notification.permission === "granted") {
      new Notification(`Time for ${prayerName}`, {
        body: `It's ${prayerTime} - Time for ${prayerName} prayer`,
        icon: '/icon-192x192.png',
        tag: `prayer-${prayerName.toLowerCase()}`,
      });
    }
  }

  public checkPrayerTimes(
    prayerTimes: PrayerTimes,
    settings: NotificationSettings,
    playAdhan: (prayerName: string) => void
  ): void {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const prayers = [
      { key: 'fajr', name: 'Fajr', time: prayerTimes.fajr, enabled: settings.fajrEnabled },
      { key: 'dhuhr', name: 'Dhuhr', time: prayerTimes.dhuhr, enabled: settings.dhuhrEnabled },
      { key: 'asr', name: 'Asr', time: prayerTimes.asr, enabled: settings.asrEnabled },
      { key: 'maghrib', name: 'Maghrib', time: prayerTimes.maghrib, enabled: settings.maghribEnabled },
      { key: 'isha', name: 'Isha', time: prayerTimes.isha, enabled: settings.ishaEnabled },
    ];

    prayers.forEach(prayer => {
      if (prayer.enabled) {
        const [hours, minutes] = prayer.time.split(':').map(Number);
        const prayerTime = hours * 60 + minutes;
        
        // Check if current time matches prayer time (within 1 minute)
        if (Math.abs(currentTime - prayerTime) <= 1) {
          this.showNotification(prayer.name, prayer.time);
          
          if (settings.adhanAutoPlay) {
            playAdhan(prayer.name);
          }
        }
      }
    });
  }
}

export const prayerService = PrayerNotificationService.getInstance();
