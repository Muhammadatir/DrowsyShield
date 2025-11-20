import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle, Activity } from "lucide-react";
import type { SessionData } from "@/types";
import { formatDistance } from "date-fns";

interface SessionCardProps {
  session: SessionData;
  onClick: () => void;
}

export const SessionCard = ({ session, onClick }: SessionCardProps) => {
  const startTime = new Date(session.start_time || session.startTime);
  const durationMinutes = Math.round((session.duration || 0) / 60);
  
  // Handle invalid dates
  const isValidDate = !isNaN(startTime.getTime());
  
  const getSeverityColor = (count: number) => {
    if (count === 0) return "default";
    if (count <= 2) return "secondary";
    if (count <= 5) return "outline";
    return "destructive";
  };

  return (
    <Card 
      className="cursor-pointer hover:border-primary/50 transition-colors"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="font-semibold">
              {isValidDate ? startTime.toLocaleDateString() : 'Invalid Date'}
            </p>
            <p className="text-sm text-muted-foreground">
              {isValidDate ? startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
            </p>
          </div>
          <Badge variant={session.status === 'completed' ? 'default' : 'secondary'}>
            {session.status}
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{durationMinutes}m</span>
          </div>
          
          <div className="flex items-center gap-1">
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            <Badge variant={getSeverityColor(session.total_drowsiness_incidents || session.drowsinessCount || 0)} className="text-xs">
              {session.total_drowsiness_incidents || session.drowsinessCount || 0}
            </Badge>
          </div>

          <div className="flex items-center gap-1">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <span>{session.avg_alertness_level || session.averageAlertness || 100}%</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-2">
          {isValidDate ? formatDistance(startTime, new Date(), { addSuffix: true }) : 'Unknown time'}
        </p>
      </CardContent>
    </Card>
  );
};
