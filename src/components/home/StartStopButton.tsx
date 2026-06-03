import { Button } from "@/components/ui/button";
import { Play, Square } from "lucide-react";

interface StartStopButtonProps {
  isMonitoring: boolean;
  onToggle: () => void;
}

export const StartStopButton = ({ isMonitoring, onToggle }: StartStopButtonProps) => {
  return (
    <Button
      onClick={onToggle}
      size="lg"
      className={`h-40 w-40 rounded-full text-xl font-bold btn-enhanced ${
        isMonitoring
          ? "bg-destructive hover:bg-destructive/90 shadow-[0_0_30px_hsl(var(--destructive)/0.6)] animate-pulse"
          : "bg-secondary hover:bg-secondary/90 shadow-[0_0_30px_hsl(var(--secondary)/0.6)]"
      }`}
    >
      <div className="flex flex-col items-center gap-2">
        {isMonitoring ? (
          <>
            <Square className="h-10 w-10" fill="currentColor" />
            <span>Stop</span>
          </>
        ) : (
          <>
            <Play className="h-10 w-10" fill="currentColor" />
            <span>Start</span>
          </>
        )}
      </div>
    </Button>
  );
};
