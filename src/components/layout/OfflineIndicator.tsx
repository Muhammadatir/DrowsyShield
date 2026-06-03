import { useOfflineStatus } from "@/hooks/useOfflineStatus";
import { Badge } from "@/components/ui/badge";
import { WifiOff } from "lucide-react";

export const OfflineIndicator = () => {
  const isOffline = useOfflineStatus();

  if (!isOffline) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
      <Badge variant="destructive" className="gap-2">
        <WifiOff className="h-3 w-3" />
        Offline Mode
      </Badge>
    </div>
  );
};
