import { useEffect, useRef } from "react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { alertSystem } from "@/utils/alertSystem";

interface AlertnessIndicatorProps {
  level: number; // 0-100
}

export const AlertnessIndicator = ({ level }: AlertnessIndicatorProps) => {
  const prevLevelRef = useRef(level);

  useEffect(() => {
    // Trigger beep when alertness level reaches 100% (full alertness)
    if (level >= 100 && prevLevelRef.current < 100) {
      alertSystem.playAlertSound(0.3); // Lower volume for positive alert
    }
    prevLevelRef.current = level;
  }, [level]);

  const getAlertLevel = () => {
    if (level >= 70) return { text: "Alert", color: "text-accent" };
    if (level >= 40) return { text: "Moderate", color: "text-secondary" };
    return { text: "Drowsy", color: "text-destructive" };
  };

  const { text, color } = getAlertLevel();

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">Alertness Level</span>
        <span className={cn("text-lg font-bold", color)}>{text}</span>
      </div>
      <Progress 
        value={level} 
        className="h-3"
      />
      <div className="text-xs text-muted-foreground text-right">
        {level.toFixed(0)}%
      </div>
    </div>
  );
};
