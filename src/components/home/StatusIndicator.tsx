import { cn } from "@/lib/utils";

interface StatusIndicatorProps {
  isMonitoring: boolean;
}

export const StatusIndicator = ({ isMonitoring }: StatusIndicatorProps) => {
  return (
    <div className="flex items-center justify-center gap-3 mb-8">
      <div
        className={cn(
          "w-3 h-3 rounded-full transition-all duration-300",
          isMonitoring ? "bg-accent animate-pulse" : "bg-muted"
        )}
      />
      <span className="text-lg font-medium">
        {isMonitoring ? "Monitoring Active" : "Monitoring Stopped"}
      </span>
    </div>
  );
};
