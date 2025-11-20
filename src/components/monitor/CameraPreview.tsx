import { useEffect, useRef, forwardRef } from "react";
import { Camera, CameraOff } from "lucide-react";
import { Card } from "@/components/ui/card";

interface CameraPreviewProps {
  stream: MediaStream | null;
  isActive: boolean;
}

export const CameraPreview = forwardRef<HTMLVideoElement, CameraPreviewProps>(
  ({ stream, isActive }, ref) => {
    const internalRef = useRef<HTMLVideoElement>(null);
    const videoRef = (ref as React.RefObject<HTMLVideoElement>) || internalRef;

    useEffect(() => {
      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((error) => {
          console.error("Error playing video:", error);
        });
      }
    }, [stream, videoRef]);

    if (!stream || !isActive) {
      return (
        <Card className="relative w-full aspect-video bg-card/50 border-border flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <CameraOff className="h-12 w-12 mx-auto mb-2" />
            <p>Camera not active</p>
          </div>
        </Card>
      );
    }

    return (
      <Card className="relative w-full aspect-video bg-black border-border overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover transform scale-x-[-1]"
        />
        <div className="absolute top-2 right-2 bg-destructive/90 text-white px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          LIVE
        </div>
      </Card>
    );
  }
);

CameraPreview.displayName = "CameraPreview";
