import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Clock, AlertTriangle, Route, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useGeolocation } from "@/hooks/useGeolocation";

interface TripReportProps {
  isOpen: boolean;
  onClose: () => void;
  sessionData: {
    duration: number;
    drowsinessCount: number;
    avgAlertness: number;
    startTime: Date;
  };
}

interface LocationPoint {
  lat: number;
  lng: number;
  timestamp: number;
  alertLevel?: number;
}

export const TripReport = ({ isOpen, onClose, sessionData }: TripReportProps) => {
  const [route, setRoute] = useState<LocationPoint[]>([]);
  const [distance, setDistance] = useState(0);
  const [avgSpeed, setAvgSpeed] = useState(0);
  const { getCurrentLocation } = useGeolocation();

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const calculateDistance = (points: LocationPoint[]) => {
    if (points.length < 2) return 0;
    
    let totalDistance = 0;
    for (let i = 1; i < points.length; i++) {
      const R = 6371; // Earth's radius in km
      const dLat = (points[i].lat - points[i-1].lat) * Math.PI / 180;
      const dLng = (points[i].lng - points[i-1].lng) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(points[i-1].lat * Math.PI / 180) * Math.cos(points[i].lat * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      totalDistance += R * c;
    }
    return totalDistance;
  };

  useEffect(() => {
    if (isOpen) {
      // Simulate route data (in real app, this would be collected during monitoring)
      const mockRoute: LocationPoint[] = [
        { lat: 40.7128, lng: -74.0060, timestamp: Date.now() - sessionData.duration * 1000 },
        { lat: 40.7589, lng: -73.9851, timestamp: Date.now() - sessionData.duration * 800 },
        { lat: 40.7831, lng: -73.9712, timestamp: Date.now() - sessionData.duration * 600, alertLevel: sessionData.drowsinessCount > 2 ? 3 : 0 },
        { lat: 40.8176, lng: -73.9482, timestamp: Date.now() - sessionData.duration * 400 },
        { lat: 40.8448, lng: -73.9351, timestamp: Date.now() }
      ];
      
      setRoute(mockRoute);
      const dist = calculateDistance(mockRoute);
      setDistance(dist);
      
      // Fix speed calculation: use realistic distance and proper time conversion
      const durationHours = sessionData.duration / 3600;
      const realisticDistance = Math.min(dist, sessionData.duration * 0.02); // Max 72 km/h
      setAvgSpeed(durationHours > 0 ? Math.min(realisticDistance / durationHours, 120) : 0);
    }
  }, [isOpen, sessionData]);

  const getSpeedColor = (speed: number) => {
    if (speed > 80) return "text-red-600";
    if (speed > 60) return "text-yellow-600";
    return "text-green-600";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Route className="h-5 w-5 text-blue-500" />
              Trip Report
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Trip Overview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Trip Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Duration</span>
                </div>
                <span className="font-semibold">{formatDuration(sessionData.duration)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Route Map Placeholder */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Route Map
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg h-48 flex items-center justify-center relative overflow-hidden">
                {/* Simulated map with route */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-green-100">
                  <svg className="w-full h-full" viewBox="0 0 200 150">
                    {/* Route line */}
                    <polyline
                      points="20,120 60,80 100,60 140,40 180,20"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="3"
                      strokeDasharray="5,5"
                    />
                    {/* Start point */}
                    <circle cx="20" cy="120" r="6" fill="#10b981" />
                    <text x="30" y="125" fontSize="10" fill="#374151">Start</text>
                    {/* End point */}
                    <circle cx="180" cy="20" r="6" fill="#ef4444" />
                    <text x="150" y="15" fontSize="10" fill="#374151">End</text>
                    {/* Alert point */}
                    {sessionData.drowsinessCount > 0 && (
                      <>
                        <circle cx="100" cy="60" r="8" fill="#f59e0b" stroke="#fff" strokeWidth="2" />
                        <text x="75" y="50" fontSize="8" fill="#f59e0b">Alert</text>
                      </>
                    )}
                  </svg>
                </div>
                <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-white/80 px-2 py-1 rounded">
                  Interactive map coming soon
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Safety Incidents */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Safety Incidents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Total Alerts</span>
                <Badge variant={sessionData.drowsinessCount > 0 ? "destructive" : "default"}>
                  {sessionData.drowsinessCount}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Alert Rate</span>
                <span className="text-sm font-semibold">
                  {sessionData.duration > 0 ? 
                    (sessionData.drowsinessCount / (sessionData.duration / 3600)).toFixed(1) : 0
                  } per hour
                </span>
              </div>
              
              {sessionData.drowsinessCount > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div className="text-sm">
                      <div className="font-medium text-yellow-800">High-risk area detected</div>
                      <div className="text-yellow-700">Consider avoiding this route during tired periods</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Route Recommendations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {avgSpeed > 80 && (
                <div className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                  <span>Consider reducing speed for safer driving</span>
                </div>
              )}
              
              {distance > 100 && (
                <div className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                  <span>Plan rest stops every 2 hours for long trips</span>
                </div>
              )}
              
              {sessionData.drowsinessCount === 0 && (
                <div className="flex items-start gap-2 text-sm text-green-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                  <span>Excellent! No drowsiness detected on this route</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Button onClick={onClose} className="w-full">
            Close Report
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};