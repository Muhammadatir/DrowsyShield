import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, AlertTriangle } from "lucide-react";
import { useSessionData } from "@/hooks/useSessionData";
import { useAuth } from "@/contexts/AuthContext";

export const LastSessionCard = () => {
  const { user } = useAuth();
  const { sessions, isLoading } = useSessionData();
  const lastSession = sessions[0]; // Most recent session
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (isLoading) {
    return (
      <Card className="card-enhanced">
        <CardHeader>
          <CardTitle className="text-base">Last Session</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="loading-skeleton h-4 w-20"></div>
          <div className="loading-skeleton h-4 w-16"></div>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="card-enhanced">
        <CardHeader>
          <CardTitle className="text-base">Last Session</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No sessions yet</p>
        </CardContent>
      </Card>
    );
  }

  if (!lastSession) {
    return (
      <Card className="border-border bg-card/50">
        <CardHeader>
          <CardTitle className="text-base">Last Session</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No sessions yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-enhanced">
      <CardHeader>
        <CardTitle className="text-base">Last Session Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>Duration</span>
          </div>
          <span className="font-semibold">{formatDuration(lastSession.duration || 0)}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span>Drowsiness Alerts</span>
          </div>
          <span className="font-semibold text-destructive">{lastSession.total_drowsiness_incidents}</span>
        </div>
      </CardContent>
    </Card>
  );
};
