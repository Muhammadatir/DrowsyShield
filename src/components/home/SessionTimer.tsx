import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface SessionTimerProps {
  startTime?: Date;
  isActive: boolean;
}

export const SessionTimer = ({ startTime, isActive }: SessionTimerProps) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isActive || !startTime || isNaN(startTime.getTime())) {
      setElapsed(0);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const start = startTime.getTime();
      if (!isNaN(start)) {
        setElapsed(Math.floor((now - start) / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, startTime]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (!isActive) return null;

  return (
    <div className="flex items-center justify-center gap-2 text-2xl font-bold text-accent">
      <Clock className="h-6 w-6" />
      <span>{formatTime(elapsed)}</span>
    </div>
  );
};
