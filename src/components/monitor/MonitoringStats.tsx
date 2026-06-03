import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Eye } from "lucide-react";

interface MonitoringStatsProps {
  drowsinessCount: number;
  faceDetected: boolean;
}

export const MonitoringStats = ({ drowsinessCount, faceDetected }: MonitoringStatsProps) => {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Card className="border-border bg-card/50">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="bg-destructive/20 p-2 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Alerts</p>
            <p className="text-2xl font-bold">{drowsinessCount}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card/50">
        <CardContent className="p-4 flex items-center gap-3">
          <div className={`${faceDetected ? 'bg-accent/20' : 'bg-muted/20'} p-2 rounded-lg`}>
            <Eye className={`h-5 w-5 ${faceDetected ? 'text-accent' : 'text-muted-foreground'}`} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Face</p>
            <p className="text-sm font-bold">
              {faceDetected ? "Detected" : "Not Found"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
