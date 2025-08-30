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

export function useNotifications() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const syncTimeoutRef = useRef<NodeJS.Timeout>();

  const { data: settings, isLoading, isError } = useQuery<NotificationSettings>({
    queryKey: ["/api/notification-settings"],
    retry: 3,
    placeholderData: () => getCachedSettings() || undefined,
    networkMode: 'offlineFirst',
  });

  const syncMutation = useMutation({
    mutationFn: async (updates: Partial<NotificationSettings>) => {
      const response = await apiRequest("PATCH", "/api/notification-settings", updates);
      return await response.json() as NotificationSettings;
    },
    onSuccess: (response: NotificationSettings, variables) => {
      // Update cache with server response
      setCachedSettings(response);
      queryClient.setQueryData(["/api/notification-settings"], response);
      
      // Remove synced update from pending
      const pending = getPendingUpdates();
      const remaining = pending.filter(p => 
        JSON.stringify(p.updates) !== JSON.stringify(variables)
      );
      setPendingUpdates(remaining);
      
      console.log('Settings synced successfully');
    },
    onError: (error, variables) => {
      console.error('Sync failed:', error);
      // Keep update in pending for retry
      toast({
        title: "Sync Warning",
        description: "Changes saved locally, will sync when online",
        variant: "default",
      });
    },
  });

  // Optimistic update function
  const updateSettings = useCallback((updates: Partial<NotificationSettings>) => {
    if (!settings) return;

    // Apply optimistic update immediately
    const optimisticSettings = { ...settings, ...updates };
    
    // Update cache immediately for instant UI response
    setCachedSettings(optimisticSettings);
    queryClient.setQueryData(["/api/notification-settings"], optimisticSettings);

    // FIXED: Clear existing timeout before setting new one
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    
    // FIXED: Only sync if online, with longer debounce
    if (navigator.onLine) {
      syncTimeoutRef.current = setTimeout(() => {
        // FIXED: Only sync if we're still online
        if (navigator.onLine && !syncMutation.isPending) {
          syncMutation.mutate(updates);
        }
      }, 2000); // Increased to 2 seconds
    } else {
      // Store for later sync when online
      const pendingUpdate: PendingUpdate = {
        updates,
        timestamp: Date.now(),
        id: Math.random().toString(36)
      };
      
      const pending = getPendingUpdates();
      setPendingUpdates([...pending, pendingUpdate]);
    }

  }, [settings, queryClient, syncMutation.isPending]);

  // Sync pending updates when coming back online
  useEffect(() => {
    const handleOnline = () => {
      // FIXED: Add delay to prevent immediate spam
      setTimeout(() => {
        const pending = getPendingUpdates();
        if (pending.length > 0 && !syncMutation.isPending) {
          console.log(`Syncing ${pending.length} pending updates`);
          
          // Merge all pending updates
          const mergedUpdates = pending.reduce((acc, update) => ({
            ...acc,
            ...update.updates
          }), {});
          
          syncMutation.mutate(mergedUpdates);
        }
      }, 1000); // Wait 1 second after coming online
    };

    window.addEventListener('online', handleOnline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [syncMutation.isPending]);

  // Cache successful server responses
  useEffect(() => {
    if (settings && !isError) {
      setCachedSettings(settings);
    }
  }, [settings, isError]);

  return {
    settings,
    isLoading,
    updateSettings,
    isSyncing: syncMutation.isPending,
    pendingUpdates: getPendingUpdates().length,
    isOffline: !navigator.onLine,
  };
}