import { useNotifications } from "@/hooks/use-notifications";
import { useAudio } from "@/hooks/use-audio";
import { BottomNav } from "@/components/bottom-nav";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Settings as SettingsIcon, Volume2, Play, RefreshCw } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const PRAYER_NAMES = [
  { key: 'fajr', name: 'Fajr', time: '5:45 AM', icon: 'sun' },
  { key: 'dhuhr', name: 'Dhuhr', time: '12:15 PM', icon: 'sun' },
  { key: 'asr', name: 'Asr', time: '3:28 PM', icon: 'cloud-sun' },
  { key: 'maghrib', name: 'Maghrib', time: '5:42 PM', icon: 'moon' },
  { key: 'isha', name: 'Isha', time: '7:15 PM', icon: 'star' },
];

export default function Settings() {
  const { settings, updateSettings, isLoading } = useNotifications();
  const { playAdhan, stopAdhan, isPlaying } = useAudio();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updatePrayerTimesMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/prayer-times/update"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prayer-times"] });
      toast({
        title: "Success",
        description: "Prayer times updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update prayer times",
        variant: "destructive",
      });
    },
  });

  const handleNotificationToggle = (prayerKey: string, enabled: boolean) => {
    updateSettings({
      [`${prayerKey}Enabled`]: enabled,
    });
  };

  const handleAdhanToggle = (enabled: boolean) => {
    updateSettings({
      adhanAutoPlay: enabled,
    });
  };

  const handleVolumeChange = (volume: number[]) => {
    updateSettings({
      volume: volume[0].toString(),
    });
  };

  const handleTestAdhan = () => {
    if (isPlaying) {
      stopAdhan();
    } else {
      playAdhan();
    }
  };

  const handleManualUpdate = () => {
    updatePrayerTimesMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        {/* Header Skeleton */}
        <div className="bg-primary text-primary-foreground px-6 py-8 rounded-b-3xl">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-24 bg-primary-foreground/20" />
            <Skeleton className="w-12 h-12 rounded-full bg-primary-foreground/20" />
          </div>
        </div>

        <div className="px-6 py-6 space-y-6 mb-24">
          {/* Settings Cards Skeleton */}
          {[...Array(3)].map((_, index) => (
            <Card key={index} className="p-6">
              <Skeleton className="h-6 w-40 mb-4" />
              <Skeleton className="h-4 w-full mb-6" />
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <div className="flex items-center">
                      <Skeleton className="w-10 h-10 rounded-full mr-3" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                    </div>
                    <Skeleton className="w-12 h-6 rounded-full" />
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-6 py-8 rounded-b-3xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold" data-testid="settings-title">Settings</h1>
          <div className="w-12 h-12 bg-primary-foreground/20 rounded-full flex items-center justify-center">
            <SettingsIcon className="text-xl" />
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6 mb-24">
        {/* Notification Settings */}
        <Card className="rounded-xl p-6 shadow-sm border border-border">
          <h2 className="text-lg font-semibold text-card-foreground mb-4">
            Prayer Notifications
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            Choose which prayers you want to receive Adhan notifications for
          </p>
          
          <div className="space-y-4">
            {PRAYER_NAMES.map((prayer) => (
              <div key={prayer.key} className="flex items-center justify-between py-2">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center mr-3">
                    <div className="text-accent text-sm">🕌</div>
                  </div>
                  <div>
                    <div className="font-medium text-card-foreground" data-testid={`prayer-${prayer.key}-name`}>
                      {prayer.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {prayer.time}
                    </div>
                  </div>
                </div>
                <Switch
                  checked={settings?.[`${prayer.key}Enabled` as keyof typeof settings] || false}
                  onCheckedChange={(checked) => handleNotificationToggle(prayer.key, checked)}
                  data-testid={`toggle-${prayer.key}`}
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Adhan Settings */}
        <Card className="rounded-xl p-6 shadow-sm border border-border">
          <h2 className="text-lg font-semibold text-card-foreground mb-4">
            Adhan Settings
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-card-foreground">Play Adhan Audio</div>
                <div className="text-sm text-muted-foreground">
                  Automatically play Adhan at prayer time
                </div>
              </div>
              <Switch
                checked={settings?.adhanAutoPlay || false}
                onCheckedChange={handleAdhanToggle}
                data-testid="toggle-adhan-autoplay"
              />
            </div>

            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-card-foreground flex items-center">
                  <Volume2 className="w-4 h-4 mr-2" />
                  Volume
                </span>
                <span className="text-sm text-muted-foreground" data-testid="volume-display">
                  {settings?.volume || 80}%
                </span>
              </div>
              <Slider
                value={[parseInt(settings?.volume || "80")]}
                onValueChange={handleVolumeChange}
                min={0}
                max={100}
                step={10}
                className="w-full"
                data-testid="volume-slider"
              />
            </div>

            <Button 
              onClick={handleTestAdhan}
              className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-lg font-medium"
              data-testid="button-test-adhan"
            >
              <Play className="w-4 h-4 mr-2" />
              {isPlaying ? "Stop Adhan" : "Test Adhan"}
            </Button>
          </div>
        </Card>

        {/* App Settings */}
        <Card className="rounded-xl p-6 shadow-sm border border-border">
          <h2 className="text-lg font-semibold text-card-foreground mb-4">
            App Settings
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-card-foreground">Auto Update</div>
                <div className="text-sm text-muted-foreground">
                  Update prayer times daily
                </div>
              </div>
              <Switch
                checked={true}
                disabled
                data-testid="toggle-auto-update"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div>
                <div className="font-medium text-card-foreground">Last Updated</div>
                <div className="text-sm text-muted-foreground" data-testid="last-updated">
                  Today, 6:00 AM
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={handleManualUpdate}
                disabled={updatePrayerTimesMutation.isPending}
                className="text-primary font-medium"
                data-testid="button-manual-update"
              >
                {updatePrayerTimesMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Update Now
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
}
