import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { prayerScraper } from "./services/scraper";
import { insertNotificationSettingsSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get current prayer times
  app.get("/api/prayer-times", async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      let prayerTimes = await storage.getPrayerTimesByDate(today);
      
      if (!prayerTimes) {
        // Scrape new prayer times if not available for today
        console.log("Scraping prayer times for today...");
        const scrapedData = await prayerScraper.scrapePrayerTimes();
        prayerTimes = await storage.createPrayerTimes(scrapedData);
      }
      
      res.json(prayerTimes);
    } catch (error) {
      console.error("Error fetching prayer times:", error);
      res.status(500).json({ message: "Failed to fetch prayer times" });
    }
  });

  // Force update prayer times
  app.post("/api/prayer-times/update", async (req, res) => {
    try {
      console.log("Manually updating prayer times...");
      const scrapedData = await prayerScraper.scrapePrayerTimes();
      const prayerTimes = await storage.createPrayerTimes(scrapedData);
      res.json(prayerTimes);
    } catch (error) {
      console.error("Error updating prayer times:", error);
      res.status(500).json({ message: "Failed to update prayer times" });
    }
  });

  // Get notification settings
  app.get("/api/notification-settings", async (req, res) => {
    try {
      const settings = await storage.getNotificationSettings("default");
      if (!settings) {
        return res.status(404).json({ message: "Notification settings not found" });
      }
      res.json(settings);
    } catch (error) {
      console.error("Error fetching notification settings:", error);
      res.status(500).json({ message: "Failed to fetch notification settings" });
    }
  });

  // Update notification settings
  app.patch("/api/notification-settings", async (req, res) => {
    try {
      const validatedData = insertNotificationSettingsSchema.partial().parse(req.body);
      const updatedSettings = await storage.updateNotificationSettings("default", validatedData);
      res.json(updatedSettings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating notification settings:", error);
      res.status(500).json({ message: "Failed to update notification settings" });
    }
  });

  // Schedule daily prayer time scraping
  const scheduleScrapingJob = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(6, 0, 0, 0); // 6 AM tomorrow
    
    const msUntilTomorrow = tomorrow.getTime() - now.getTime();
    
    setTimeout(async () => {
      try {
        console.log("Daily scraping job started...");
        const scrapedData = await prayerScraper.scrapePrayerTimes();
        await storage.createPrayerTimes(scrapedData);
        console.log("Daily scraping job completed");
        
        // Schedule next scraping
        setInterval(async () => {
          try {
            const scrapedData = await prayerScraper.scrapePrayerTimes();
            await storage.createPrayerTimes(scrapedData);
            console.log("Daily prayer times updated");
          } catch (error) {
            console.error("Error in daily scraping:", error);
          }
        }, 24 * 60 * 60 * 1000); // Every 24 hours
        
      } catch (error) {
        console.error("Error in initial scraping:", error);
      }
    }, msUntilTomorrow);
    
    console.log(`Daily scraping scheduled for ${tomorrow.toISOString()}`);
  };

  // Start the scraping schedule
  scheduleScrapingJob();

  const httpServer = createServer(app);
  return httpServer;
}
