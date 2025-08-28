import { useQuery } from "@tanstack/react-query";
import type { PrayerTimes } from "@shared/schema";

export function usePrayerTimes() {
  return useQuery<PrayerTimes>({
    queryKey: ["/api/prayer-times"],
    refetchInterval: 60 * 60 * 1000, // Refetch every hour
    staleTime: 30 * 60 * 1000, // Consider stale after 30 minutes
  });
}
