import { type PrayerTimes, type InsertPrayerTimes, type NotificationSettings, type InsertNotificationSettings } from "@shared/schema";

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

// Lazy import to avoid loading database modules if not needed
const createStorage = async (): Promise<IStorage> => {
  if (process.env.DATABASE_URL) {
    console.log('🗄️  Using PostgreSQL database storage');
    try {
      // Dynamic import for database storage
      const { DatabaseStorage } = await import("./storage/database-storage");
      return new DatabaseStorage();
    } catch (error) {
      console.error('❌ Failed to initialize database storage, falling back to memory:', error);
      console.log('🧠 Using in-memory storage as fallback');
      const { MemStorage } = await import("./storage/mem-storage.js");
      return new MemStorage();
    }
  } else {
    console.log('🧠 Using in-memory storage (DATABASE_URL not configured)');
    const { MemStorage } = await import("./storage/mem-storage.js");
    return new MemStorage();
  }
};

// Create storage instance
let storageInstance: Promise<IStorage> | null = null;

const getStorage = (): Promise<IStorage> => {
  if (!storageInstance) {
    storageInstance = createStorage();
  }
  return storageInstance;
};

// Export a proxy object that delegates to the actual storage
export const storage: IStorage = {
  async getPrayerTimesByDate(date: string): Promise<PrayerTimes | undefined> {
    const storageImpl = await getStorage();
    return storageImpl.getPrayerTimesByDate(date);
  },

  async getLatestPrayerTimes(): Promise<PrayerTimes | undefined> {
    const storageImpl = await getStorage();
    return storageImpl.getLatestPrayerTimes();
  },

  async createPrayerTimes(prayerTimes: InsertPrayerTimes): Promise<PrayerTimes> {
    const storageImpl = await getStorage();
    return storageImpl.createPrayerTimes(prayerTimes);
  },

  async getNotificationSettings(userId?: string): Promise<NotificationSettings | undefined> {
    const storageImpl = await getStorage();
    return storageImpl.getNotificationSettings(userId);
  },

  async createNotificationSettings(settings: InsertNotificationSettings): Promise<NotificationSettings> {
    const storageImpl = await getStorage();
    return storageImpl.createNotificationSettings(settings);
  },

  async updateNotificationSettings(userId: string, updates: Partial<InsertNotificationSettings>): Promise<NotificationSettings> {
    const storageImpl = await getStorage();
    return storageImpl.updateNotificationSettings(userId, updates);
  },
};