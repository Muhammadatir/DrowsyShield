import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Clock, Coffee, Trophy, TrendingUp, X, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TripReport } from "./TripReport";

interface TripSafetyReportProps {
  isOpen: boolean;
  onClose: () => void;
  sessionData: {
    duration: number;
    drowsinessCount: number;
    avgAlertness: number;
  };
}

export const TripSafetyReport = ({ isOpen, onClose, sessionData }: TripSafetyReportProps) => {
  const { duration, drowsinessCount, avgAlertness } = sessionData;
  const [showTripReport, setShowTripReport] = useState(false);
  
  const formatDuration = (seconds: number) => {
    if (seconds <= 0) return "0m 0s";
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    } else if (mins > 0) {
      return `${mins}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const calculateSafetyScore = () => {
    const baseScore = 100;
    const alertPenalty = drowsinessCount * 10;
    const alertnessPenalty = (100 - avgAlertness) * 0.5;
    return Math.max(0, Math.round(baseScore - alertPenalty - alertnessPenalty));
  };

  const safetyScore = calculateSafetyScore();
  
  const getSafetyGrade = (score: number) => {
    if (score >= 90) return { grade: "A+", color: "text-green-600", bg: "bg-green-100" };
    if (score >= 80) return { grade: "A", color: "text-green-500", bg: "bg-green-50" };
    if (score >= 70) return { grade: "B", color: "text-yellow-600", bg: "bg-yellow-100" };
    if (score >= 60) return { grade: "C", color: "text-orange-600", bg: "bg-orange-100" };
    return { grade: "D", color: "text-red-600", bg: "bg-red-100" };
  };

  const gradeInfo = getSafetyGrade(safetyScore);

  const getBreakSuggestions = () => {
    const suggestions = [];
    if (drowsinessCount > 3) suggestions.push("Take frequent 15-minute breaks");
    if (duration > 7200) suggestions.push("Consider overnight rest for long trips");
    if (avgAlertness < 80) suggestions.push("Get 7-8 hours sleep before driving");
    if (suggestions.length === 0) suggestions.push("Great job! Keep up the safe driving");
    return suggestions;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Trip Safety Report
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="border-2 border-primary/20">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${gradeInfo.bg} mb-3`}>
                  <span className={`text-2xl font-bold ${gradeInfo.color}`}>{gradeInfo.grade}</span>
                </div>
                <h3 className="text-lg font-semibold mb-1">Safety Score</h3>
                <div className="text-3xl font-bold text-primary mb-2">{safetyScore}%</div>
                <Progress value={safetyScore} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                <div className="text-sm text-muted-foreground">Driving Time</div>
                <div className="text-xl font-bold">{formatDuration(duration)}</div>
                <div className="text-xs text-muted-foreground">({duration} seconds)</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-red-500" />
                <div className="text-sm text-muted-foreground">Drowsy Alerts</div>
                <div className="text-xl font-bold">{drowsinessCount}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Coffee className="h-4 w-4" />
                Break Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {getBreakSuggestions().map((suggestion, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>{suggestion}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowTripReport(true)}
              className="flex items-center gap-2"
            >
              <MapPin className="h-4 w-4" />
              Trip Report
            </Button>
            <Button onClick={onClose}>
              Continue
            </Button>
          </div>
          
          <TripReport
            isOpen={showTripReport}
            onClose={() => setShowTripReport(false)}
            sessionData={{
              duration,
              drowsinessCount,
              avgAlertness,
              startTime: new Date(Date.now() - duration * 1000)
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};