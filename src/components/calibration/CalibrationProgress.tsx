import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalibrationProgressProps {
  currentStep: number;
  totalSteps: number;
}

export const CalibrationProgress = ({
  currentStep,
  totalSteps,
}: CalibrationProgressProps) => {
  return (
    <div className="flex items-center justify-between mb-8">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div key={i} className="flex items-center flex-1">
          <div
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all",
              i < currentStep
                ? "bg-accent text-accent-foreground"
                : i === currentStep
                ? "bg-secondary text-secondary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            {i < currentStep ? <Check className="h-5 w-5" /> : i + 1}
          </div>
          {i < totalSteps - 1 && (
            <div
              className={cn(
                "flex-1 h-1 mx-2 transition-all",
                i < currentStep ? "bg-accent" : "bg-muted"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
};
