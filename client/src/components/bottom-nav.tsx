import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, Settings } from "lucide-react";

export function BottomNav() {
  const [location, navigate] = useLocation();

  return (
    <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-sm bg-card border-t border-border">
      <div className="flex items-center justify-around py-4">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className={`bottom-nav-item flex flex-col items-center p-2 ${
            location === "/" ? "active text-primary" : "text-muted-foreground"
          }`}
          data-testid="nav-home"
        >
          <Home className="text-xl mb-1" />
          <span className="text-xs">Home</span>
        </Button>
        <Button
          variant="ghost"
          onClick={() => navigate("/settings")}
          className={`bottom-nav-item flex flex-col items-center p-2 ${
            location === "/settings" ? "active text-primary" : "text-muted-foreground"
          }`}
          data-testid="nav-settings"
        >
          <Settings className="text-xl mb-1" />
          <span className="text-xs">Settings</span>
        </Button>
      </div>
    </div>
  );
}
