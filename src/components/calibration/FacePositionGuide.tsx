import { useEffect, useRef, useState } from "react";

interface FacePositionGuideProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  faceDetected: boolean;
}

export const FacePositionGuide = ({ videoRef, faceDetected }: FacePositionGuideProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPositionGood, setIsPositionGood] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const drawGuide = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw face position guide (oval)
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radiusX = canvas.width * 0.3;
      const radiusY = canvas.height * 0.4;

      ctx.strokeStyle = faceDetected ? "#48bb78" : "#ff6b35";
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 5]);

      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
      ctx.stroke();

      // Draw corner markers
      const markerSize = 20;
      ctx.setLineDash([]);
      ctx.strokeStyle = faceDetected ? "#48bb78" : "#ff6b35";
      ctx.lineWidth = 2;

      // Top-left
      ctx.beginPath();
      ctx.moveTo(centerX - radiusX, centerY - radiusY + markerSize);
      ctx.lineTo(centerX - radiusX, centerY - radiusY);
      ctx.lineTo(centerX - radiusX + markerSize, centerY - radiusY);
      ctx.stroke();

      // Top-right
      ctx.beginPath();
      ctx.moveTo(centerX + radiusX - markerSize, centerY - radiusY);
      ctx.lineTo(centerX + radiusX, centerY - radiusY);
      ctx.lineTo(centerX + radiusX, centerY - radiusY + markerSize);
      ctx.stroke();

      // Bottom-left
      ctx.beginPath();
      ctx.moveTo(centerX - radiusX, centerY + radiusY - markerSize);
      ctx.lineTo(centerX - radiusX, centerY + radiusY);
      ctx.lineTo(centerX - radiusX + markerSize, centerY + radiusY);
      ctx.stroke();

      // Bottom-right
      ctx.beginPath();
      ctx.moveTo(centerX + radiusX - markerSize, centerY + radiusY);
      ctx.lineTo(centerX + radiusX, centerY + radiusY);
      ctx.lineTo(centerX + radiusX, centerY + radiusY - markerSize);
      ctx.stroke();

      setIsPositionGood(faceDetected);
    };

    const interval = setInterval(drawGuide, 100);
    return () => clearInterval(interval);
  }, [videoRef, faceDetected]);

  return (
    <div className="relative w-full aspect-video">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />
      {isPositionGood && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-accent/90 text-white px-4 py-2 rounded-lg font-medium">
          ✓ Position Good
        </div>
      )}
    </div>
  );
};
