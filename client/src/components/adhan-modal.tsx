import { useAudio } from "@/hooks/use-audio";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Church, Square } from "lucide-react";

export function AdhanModal() {
  const { isPlaying, stopAdhan, currentPrayer } = useAudio();

  return (
    <Dialog open={isPlaying} onOpenChange={() => stopAdhan()}>
      <DialogContent className="bg-card m-6 rounded-3xl p-8 text-center max-w-sm w-full border-0">
        <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
          <Church className="text-primary-foreground text-2xl" />
        </div>
        <h2 className="text-2xl font-bold text-card-foreground mb-2" data-testid="adhan-prayer-name">
          {currentPrayer || "Adhan"}
        </h2>
        <p className="text-muted-foreground mb-6">It's time for prayer</p>
        
        {/* Audio Visualization */}
        <div className="flex justify-center items-center space-x-1 mb-6">
          <div className="audio-wave h-8" style={{ animationDelay: '0s' }} />
          <div className="audio-wave h-12" style={{ animationDelay: '0.1s' }} />
          <div className="audio-wave h-6" style={{ animationDelay: '0.2s' }} />
          <div className="audio-wave h-10" style={{ animationDelay: '0.3s' }} />
          <div className="audio-wave h-4" style={{ animationDelay: '0.4s' }} />
        </div>

        <Button 
          onClick={stopAdhan}
          className="w-full bg-destructive text-destructive-foreground py-3 px-6 rounded-xl font-medium hover:bg-destructive/90"
          data-testid="button-stop-adhan"
        >
          <Square className="w-4 h-4 mr-2 fill-current" />
          Stop Adhan
        </Button>
      </DialogContent>
    </Dialog>
  );
}
