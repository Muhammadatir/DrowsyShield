import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Clock, AlertTriangle, Activity, TrendingUp } from "lucide-react";
import type { SessionData } from "@/types";
import { exportSessionToJSON } from "@/utils/dataExport";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface SessionDetailDialogProps {
  session: SessionData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SessionDetailDialog = ({
  session,
  open,
  onOpenChange,
}: SessionDetailDialogProps) => {
  if (!session) return null;

  const startTime = new Date(session.startTime);
  const endTime = session.endTime ? new Date(session.endTime) : new Date();
  const durationMinutes = Math.round(session.duration / 60);

  // Generate mock graph data based on incidents
  const graphData = Array.from({ length: durationMinutes }, (_, i) => {
    const incident = session.incidents?.find(inc => {
      const incidentTime = new Date(inc.timestamp);
      const minutesDiff = Math.round((incidentTime.getTime() - startTime.getTime()) / 60000);
      return minutesDiff === i;
    });

    return {
      time: i,
      alertness: incident ? (incident.severity === 'high' ? 30 : incident.severity === 'medium' ? 60 : 80) : 100,
    };
  });

  const handleExport = () => {
    exportSessionToJSON(session);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Session Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="flex justify-between items-start">
            <div>
              <p className="text-2xl font-bold">{startTime.toLocaleDateString()}</p>
              <p className="text-muted-foreground">
                {startTime.toLocaleTimeString()} - {endTime.toLocaleTimeString()}
              </p>
            </div>
            <Badge variant={session.status === 'completed' ? 'default' : 'secondary'}>
              {session.status}
            </Badge>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-xs">Duration</span>
              </div>
              <p className="text-xl font-bold">{durationMinutes}m</p>
            </div>

            <div className="flex flex-col gap-1 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-xs">Alerts</span>
              </div>
              <p className="text-xl font-bold">{session.drowsinessCount}</p>
            </div>

            <div className="flex flex-col gap-1 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Activity className="h-4 w-4" />
                <span className="text-xs">Avg Alertness</span>
              </div>
              <p className="text-xl font-bold">{session.averageAlertness || 100}%</p>
            </div>

            <div className="flex flex-col gap-1 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs">Max Closure</span>
              </div>
              <p className="text-xl font-bold">{session.maxEyeClosureDuration || 0}s</p>
            </div>
          </div>

          {/* Graph */}
          {graphData.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Alertness Timeline</h3>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={graphData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="time" 
                      label={{ value: 'Time (minutes)', position: 'insideBottom', offset: -5 }}
                      className="text-xs"
                    />
                    <YAxis 
                      label={{ value: 'Alertness %', angle: -90, position: 'insideLeft' }}
                      className="text-xs"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))' 
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="alertness" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Incidents */}
          {session.incidents && session.incidents.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Drowsiness Incidents</h3>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {session.incidents.map((incident, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <span>{new Date(incident.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        incident.severity === 'high' ? 'destructive' : 
                        incident.severity === 'medium' ? 'outline' : 'secondary'
                      }>
                        {incident.severity}
                      </Badge>
                      <span className="text-muted-foreground">{incident.duration}s</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={handleExport} variant="outline" className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Export Session Data
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
