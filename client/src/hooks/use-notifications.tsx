import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useCallback, useRef } from "react";
import { apiRequest } from "@/lib/queryClient";
import type { NotificationSettings } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

const SETTINGS_CACHE_KEY = 'notification-settings-cache';
const PENDING_UPDATES_KEY = 'pending-settings-updates';

interface CachedSettings {
  data: NotificationSettings;
  timestamp: number;
  version: number;
}

interface PendingUpdate {
  updates: Partial<NotificationSettings>;
  timestamp: number;
  id: string;
}

// Cache functions
const getCachedSettings = (): NotificationSettings | null => {
  try {
    const cached = localStorage.getItem(SETTINGS_CACHE_KEY);
    if (!cached) return null;
    const { data }: CachedSettings = JSON.parse(cached);
    return data;
  } catch (error) {
    console.error('Error reading settings cache:', error);
    return null;
  }
};

const setCachedSettings = (data: NotificationSettings) => {
  try {
    const cacheData: CachedSettings = {
      data,
      timestamp: Date.now(),
      version: 1
    };
    localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error caching settings:', error);
  }
};

const getPendingUpdates = (): PendingUpdate[] => {
  try {
    const pending = localStorage.getItem(PENDING_UPDATES_KEY);
    return pending ? JSON.parse(pending) : [];
  } catch (error) {
    console.error('Error reading pending updates:', error);
    return [];
  }
};

const setPendingUpdates = (updates: PendingUpdate[]) => {
  try {
    localStorage.setItem(PENDING_UPDATES_KEY, JSON.stringify(updates));
  } catch (error) {
    console.error('Error saving pending updates:', error);
  }
};

// TEMPORARY SIMPLE VERSION - replace the entire hook
export function useNotifications() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading, isError } = useQuery<NotificationSettings>({
    queryKey: ["/api/notification-settings"],
    retry: 1,
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<NotificationSettings>) => {
      const response = await apiRequest("PATCH", "/api/notification-settings", updates);
      return await response.json() as NotificationSettings;
    },
    onSuccess: (response) => {
      queryClient.setQueryData(["/api/notification-settings"], response);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  const updateSettings = useCallback((updates: Partial<NotificationSettings>) => {
    updateMutation.mutate(updates);
  }, [updateMutation]);

  return {
    settings,
    isLoading,
    updateSettings,
    isSyncing: updateMutation.isPending,
    pendingUpdates: 0,
    isOffline: false,
  };
}