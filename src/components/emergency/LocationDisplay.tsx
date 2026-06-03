import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, ExternalLink, Loader2 } from "lucide-react";
import { getCurrentLocation, formatLocation, getLocationMapUrl } from "@/utils/geolocation";
import type { EmergencyLocation } from "@/types/emergency";

export const LocationDisplay = () => {
  const [location, setLocation] = useState<EmergencyLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLocation();
  }, []);

  const loadLocation = async () => {
    setLoading(true);
    setError(null);
    try {
      const loc = await getCurrentLocation();
      setLocation(loc);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get location');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-full">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          
          <div className="flex-1">
            <p className="font-semibold mb-1">Current Location</p>
            
            {loading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Getting location...</span>
              </div>
            )}

            {error && (
              <div className="space-y-2">
                <p className="text-sm text-destructive">{error}</p>
                <Button size="sm" variant="outline" onClick={loadLocation}>
                  Try Again
                </Button>
              </div>
            )}

            {location && !loading && (
              <div className="space-y-2">
                <p className="text-sm font-mono text-muted-foreground">
                  {formatLocation(location)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Accuracy: ±{Math.round(location.accuracy)}m
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(getLocationMapUrl(location), '_blank')}
                >
                  <ExternalLink className="mr-2 h-3 w-3" />
                  View on Map
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
