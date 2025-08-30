import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import { eq, desc } from 'drizzle-orm';
import { prayerTimes, notificationSettings } from '@shared/schema';
import { randomUUID } from "crypto";
import type { 
  PrayerTimes, 
  InsertPrayerTimes, 
  NotificationSettings, 
  InsertNotificationSettings 
} from "@shared/schema";
import type { IStorage } from '../storage';

export class DatabaseStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;

  private constructor(db: ReturnType<typeof drizzle>) {
    this.db = db;
  }

  static async create(): Promise<DatabaseStorage> {
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL environment variable is required for DatabaseStorage');
    }

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log("Successfully connected to the database!"); // Log success message
    } catch (error) {
        console.error("Database connection failed:", error); // Log any error encountered
        throw error; // Rethrow the error for further handling
    }

    const db = drizzle(client);
    return new DatabaseStorage(db);
  }

  // Prayer times methods
  async getPrayerTimesByDate(date: string): Promise<PrayerTimes | undefined> {
    try {
      const result = await this.db.select()
        .from(prayerTimes)
        .where(eq(prayerTimes.date, date))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error('❌ Error fetching prayer times:', error);
      return undefined;
    }
  }

  async getLatestPrayerTimes(): Promise<PrayerTimes | undefined> {
    try {
      const result = await this.db.select()
        .from(prayerTimes)
        .orderBy(desc(prayerTimes.date))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error('❌ Error fetching latest prayer times:', error);
      return undefined;
    }
  }

  async createPrayerTimes(insertPrayerTimes: InsertPrayerTimes): Promise<PrayerTimes> {
    try {
      // Check if prayer times for this date already exist
      const existing = await this.getPrayerTimesByDate(insertPrayerTimes.date);
      
      if (existing) {
        // Update existing record
        const updated = await this.db.update(prayerTimes)
          .set({
            ...insertPrayerTimes,
            scrapedAt: new Date()
          })
          .where(eq(prayerTimes.date, insertPrayerTimes.date))
          .returning();
        
        console.log(`📅 Updated prayer times for ${insertPrayerTimes.date}`);
        return updated[0];
      } else {
        // Create new record
        const created = await this.db.insert(prayerTimes)
          .values({
            id: randomUUID(),
            ...insertPrayerTimes,
            scrapedAt: new Date()
          })
          .returning();
        
        console.log(`📅 Created new prayer times for ${insertPrayerTimes.date}`);
        return created[0];
      }
    } catch (error) {
      console.error('❌ Error creating prayer times:', error);
      throw error;
    }
  }

  // Notification settings methods
  async getNotificationSettings(userId = "default"): Promise<NotificationSettings | undefined> {
    try {
      const result = await this.db.select()
        .from(notificationSettings)
        .where(eq(notificationSettings.userId, userId))
        .limit(1);
      
      if (result.length === 0) {
        // Create default settings if none exist
        console.log(`🔔 Creating default notification settings for user: ${userId}`);
        return await this.createNotificationSettings({
          userId,
          fajrEnabled: true,
          dhuhrEnabled: false,
          asrEnabled: true,
          maghribEnabled: true,
          ishaEnabled: false,
          adhanAutoPlay: true,
          volume: "80",
        });
      }
      
      return result[0];
    } catch (error) {
      console.error('❌ Error fetching notification settings:', error);
      return undefined;
    }
  }

  async createNotificationSettings(insertSettings: InsertNotificationSettings): Promise<NotificationSettings> {
    try {
      const created = await this.db.insert(notificationSettings)
        .values({
          id: randomUUID(),
          ...insertSettings
        })
        .returning();
      
      console.log(`🔔 Created notification settings for user: ${insertSettings.userId}`);
      return created[0];
    } catch (error) {
      console.error('❌ Error creating notification settings:', error);
      throw error;
    }
  }

  async updateNotificationSettings(userId: string, updates: Partial<InsertNotificationSettings>): Promise<NotificationSettings> {
    try {
      const updated = await this.db.update(notificationSettings)
        .set(updates)
        .where(eq(notificationSettings.userId, userId))
        .returning();
      
      if (updated.length === 0) {
        throw new Error(`Notification settings not found for user: ${userId}`);
      }
      
      console.log(`🔔 Updated notification settings for user: ${userId}`, updates);
      return updated[0];
    } catch (error) {
      console.error('❌ Error updating notification settings:', error);
      throw error;
    }
  }
}