import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import type { PrayerTimes } from "@shared/schema";

const CACHE_KEY = 'prayer-times-cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface CachedData {
  data: PrayerTimes;
  timestamp: number;
}

// Cache functions
const getCachedPrayerTimes = (): PrayerTimes | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const { data, timestamp }: CachedData = JSON.parse(cached);
    const now = Date.now();
    
    // Check if cache is still valid
    if (now - timestamp < CACHE_DURATION) {
      return data;
    } else {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
  } catch (error) {
    console.error('Error reading prayer times cache:', error);
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
};

const setCachedPrayerTimes = (data: PrayerTimes) => {
  try {
    const cacheData: CachedData = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error caching prayer times:', error);
  }
};

export function usePrayerTimes() {
  const query = useQuery<PrayerTimes>({
    queryKey: ["/api/prayer-times"],
    refetchInterval: 60 * 60 * 1000, // Refetch every hour
    staleTime: 30 * 60 * 1000, // Consider stale after 30 minutes
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    placeholderData: () => {
      // Use cached data as placeholder while fetching
      return getCachedPrayerTimes() || undefined;
    },
    networkMode: 'offlineFirst', // Try cache first, then network
  });

  // Cache successful responses
  useEffect(() => {
    if (query.data && !query.isError) {
      setCachedPrayerTimes(query.data);
    }
  }, [query.data, query.isError]);

  // Enhanced return with cache info
  return {
    ...query,
    isCached: !query.isFetching && !!getCachedPrayerTimes(),
  };
}