import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const prayerTimes = pgTable("prayer_times", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: text("date").notNull(), // YYYY-MM-DD format
  fajr: text("fajr").notNull(),
  dhuhr: text("dhuhr").notNull(),
  asr: text("asr").notNull(),
  maghrib: text("maghrib").notNull(),
  isha: text("isha").notNull(),
  location: text("location").notNull().default("Beirut, Lebanon"),
  scrapedAt: timestamp("scraped_at").notNull().defaultNow(),
});

export const notificationSettings = pgTable("notification_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().default("default"), // For future multi-user support
  fajrEnabled: boolean("fajr_enabled").notNull().default(true),
  dhuhrEnabled: boolean("dhuhr_enabled").notNull().default(false),
  asrEnabled: boolean("asr_enabled").notNull().default(true),
  maghribEnabled: boolean("maghrib_enabled").notNull().default(true),
  ishaEnabled: boolean("isha_enabled").notNull().default(false),
  adhanAutoPlay: boolean("adhan_auto_play").notNull().default(true),
  volume: text("volume").notNull().default("80"),
});

export const insertPrayerTimesSchema = createInsertSchema(prayerTimes).omit({
  id: true,
  scrapedAt: true,
});

export const insertNotificationSettingsSchema = createInsertSchema(notificationSettings).omit({
  id: true,
});

export type InsertPrayerTimes = z.infer<typeof insertPrayerTimesSchema>;
export type PrayerTimes = typeof prayerTimes.$inferSelect;
export type InsertNotificationSettings = z.infer<typeof insertNotificationSettingsSchema>;
export type NotificationSettings = typeof notificationSettings.$inferSelect;

export type Prayer = {
  name: string;
  time: string;
  arabic: string;
  icon: string;
  enabled: boolean;
};

export type PrayerData = {
  fajr: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  date: string;
  location: string;
};
