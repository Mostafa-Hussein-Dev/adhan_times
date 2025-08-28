import { type PrayerTimes, type InsertPrayerTimes, type NotificationSettings, type InsertNotificationSettings } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Prayer times methods
  getPrayerTimesByDate(date: string): Promise<PrayerTimes | undefined>;
  getLatestPrayerTimes(): Promise<PrayerTimes | undefined>;
  createPrayerTimes(prayerTimes: InsertPrayerTimes): Promise<PrayerTimes>;
  
  // Notification settings methods
  getNotificationSettings(userId?: string): Promise<NotificationSettings | undefined>;
  createNotificationSettings(settings: InsertNotificationSettings): Promise<NotificationSettings>;
  updateNotificationSettings(userId: string, settings: Partial<InsertNotificationSettings>): Promise<NotificationSettings>;
}

export class MemStorage implements IStorage {
  private prayerTimes: Map<string, PrayerTimes>;
  private notificationSettings: Map<string, NotificationSettings>;

  constructor() {
    this.prayerTimes = new Map();
    this.notificationSettings = new Map();
    
    // Create default notification settings
    const defaultSettings: NotificationSettings = {
      id: randomUUID(),
      userId: "default",
      fajrEnabled: true,
      dhuhrEnabled: false,
      asrEnabled: true,
      maghribEnabled: true,
      ishaEnabled: false,
      adhanAutoPlay: true,
      volume: "80",
    };
    this.notificationSettings.set("default", defaultSettings);
  }

  async getPrayerTimesByDate(date: string): Promise<PrayerTimes | undefined> {
    return Array.from(this.prayerTimes.values()).find(pt => pt.date === date);
  }

  async getLatestPrayerTimes(): Promise<PrayerTimes | undefined> {
    const times = Array.from(this.prayerTimes.values());
    if (times.length === 0) return undefined;
    return times.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  }

  async createPrayerTimes(insertPrayerTimes: InsertPrayerTimes): Promise<PrayerTimes> {
    const id = randomUUID();
    const prayerTimes: PrayerTimes = {
      ...insertPrayerTimes,
      id,
      scrapedAt: new Date(),
    };
    this.prayerTimes.set(id, prayerTimes);
    return prayerTimes;
  }

  async getNotificationSettings(userId = "default"): Promise<NotificationSettings | undefined> {
    return this.notificationSettings.get(userId);
  }

  async createNotificationSettings(insertSettings: InsertNotificationSettings): Promise<NotificationSettings> {
    const id = randomUUID();
    const settings: NotificationSettings = {
      ...insertSettings,
      id,
    };
    this.notificationSettings.set(insertSettings.userId, settings);
    return settings;
  }

  async updateNotificationSettings(userId: string, updates: Partial<InsertNotificationSettings>): Promise<NotificationSettings> {
    const existing = this.notificationSettings.get(userId);
    if (!existing) {
      throw new Error(`Notification settings not found for user: ${userId}`);
    }
    
    const updated: NotificationSettings = {
      ...existing,
      ...updates,
    };
    this.notificationSettings.set(userId, updated);
    return updated;
  }
}

export const storage = new MemStorage();
