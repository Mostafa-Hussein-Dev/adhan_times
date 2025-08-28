import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { NotificationSettings } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useNotifications() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery<NotificationSettings>({
    queryKey: ["/api/notification-settings"],
  });

  const updateMutation = useMutation({
    mutationFn: (updates: Partial<NotificationSettings>) =>
      apiRequest("PATCH", "/api/notification-settings", updates),
    onSuccess: (response) => {
      queryClient.setQueryData(["/api/notification-settings"], response);
      scheduleNotifications(response);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update notification settings",
        variant: "destructive",
      });
    },
  });

  const updateSettings = (updates: Partial<NotificationSettings>) => {
    updateMutation.mutate(updates);
  };

  const scheduleNotifications = (notificationSettings: NotificationSettings) => {
    if (!("Notification" in window)) {
      console.log("Browser does not support notifications");
      return;
    }

    // Request permission if not already granted
    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    // Clear existing scheduled notifications
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.getNotifications().then(notifications => {
          notifications.forEach(notification => notification.close());
        });
      });
    }

    // Schedule new notifications based on settings
    const prayers = [
      { key: 'fajr', name: 'Fajr', enabled: notificationSettings.fajrEnabled },
      { key: 'dhuhr', name: 'Dhuhr', enabled: notificationSettings.dhuhrEnabled },
      { key: 'asr', name: 'Asr', enabled: notificationSettings.asrEnabled },
      { key: 'maghrib', name: 'Maghrib', enabled: notificationSettings.maghribEnabled },
      { key: 'isha', name: 'Isha', enabled: notificationSettings.ishaEnabled },
    ];

    prayers.forEach(prayer => {
      if (prayer.enabled) {
        // Note: In a real implementation, you would need to get the prayer times
        // and schedule notifications using the service worker or a more sophisticated system
        console.log(`Scheduling notification for ${prayer.name}`);
      }
    });
  };

  return {
    settings,
    isLoading,
    updateSettings,
  };
}
