import { Card } from "@/components/ui/card";
import { Sun, Cloud, Moon, Star } from "lucide-react";

interface PrayerCardProps {
  prayer: {
    key: string;
    name: string;
    arabic: string;
    time: string;
    enabled: boolean;
    icon: string;
  };
  isNext?: boolean;
}

const getIcon = (iconName: string) => {
  switch (iconName) {
    case 'sun':
      return <Sun className="text-accent text-lg" />;
    case 'cloud-sun':
      return <Cloud className="text-accent text-lg" />;
    case 'moon':
      return <Moon className="text-accent text-lg" />;
    case 'star':
      return <Star className="text-accent text-lg" />;
    default:
      return <Sun className="text-accent text-lg" />;
  }
};

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

export function PrayerCard({ prayer, isNext = false }: PrayerCardProps) {
  return (
    <Card className={`prayer-card rounded-xl p-4 shadow-sm border border-border ${isNext ? 'ring-2 ring-primary' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mr-4">
            {getIcon(prayer.icon)}
          </div>
          <div>
            <h3 className="font-semibold text-card-foreground" data-testid={`prayer-name-${prayer.key}`}>
              {prayer.name}
            </h3>
            <p className="text-muted-foreground text-sm" data-testid={`prayer-arabic-${prayer.key}`}>
              {prayer.arabic}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-card-foreground" data-testid={`prayer-time-${prayer.key}`}>
            {formatTime(prayer.time)}
          </div>
          <div 
            className={`w-2 h-2 rounded-full ml-auto mt-1 ${
              prayer.enabled ? 'bg-accent' : 'bg-muted-foreground/30'
            }`}
            data-testid={`prayer-indicator-${prayer.key}`}
          />
        </div>
      </div>
    </Card>
  );
}
