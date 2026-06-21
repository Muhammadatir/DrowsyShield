import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CameraPreview } from "@/components/monitor/CameraPreview";
import { CameraPermissionDialog } from "@/components/monitor/CameraPermissionDialog";
import { EyeClosureGraph } from "@/components/monitor/EyeClosureGraph";
import { AlertnessIndicator } from "@/components/monitor/AlertnessIndicator";
import { MonitoringStats } from "@/components/monitor/MonitoringStats";
import { SessionTimer } from "@/components/home/SessionTimer";
import { requestCameraPermission, stopCameraStream } from "@/utils/cameraUtils";
import { useFaceDetection } from "@/hooks/useFaceDetection";
import { calculateEyeClosureDuration } from "@/utils/faceDetection";
import { loadPreferences } from "@/utils/localStorage";
import { useSessionData } from "@/hooks/useSessionData";
import { useAuth } from "@/contexts/AuthContext";
import { TripSafetyReport } from "@/components/reports/TripSafetyReport";
import { crashDetector } from "@/utils/crashDetection";
import { alertSystem } from "@/utils/alertSystem";

const Monitor = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Redirect to auth if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const [showPermissionDialog, setShowPermissionDialog] = useState(true);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [alertVolume, setAlertVolume] = useState(70);
  const [sensitivity, setSensitivity] = useState(50);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showSafetyReport, setShowSafetyReport] = useState(false);
  const [alertnessHistory, setAlertnessHistory] = useState<number[]>([]);
  const [crashDetected, setCrashDetected] = useState(false);
  const [crashCountdown, setCrashCountdown] = useState(0);
  const crashTimerRef = useRef<number | null>(null);
  
  const { createSession, updateSession } = useSessionData();

  const cancelCrashAlert = () => {
    if (crashTimerRef.current) clearInterval(crashTimerRef.current);
    setCrashDetected(false);
    setCrashCountdown(0);
    alertSystem.stopAllAlerts();
    toast({ title: "Alert Cancelled", description: "Crash alert dismissed. Stay safe!" });
  };

  // Start crash detection when monitoring begins
  useEffect(() => {
    if (isMonitoring) {
      crashDetector.start((force) => {
        setCrashDetected(true);
        setCrashCountdown(15);
        alertSystem.triggerFullAlert(1.0, 'high');
        alertSystem.speakAlert('Crash detected! Tap I am okay within 15 seconds or emergency services will be called.', true);
        toast({
          title: '🚨 Crash Detected!',
          description: `Impact: ${force.toFixed(1)} m/s². Calling 112 in 15 seconds if no response.`,
          variant: 'destructive',
        });

        let seconds = 15;
        crashTimerRef.current = window.setInterval(() => {
          seconds -= 1;
          setCrashCountdown(seconds);
          if (seconds <= 0) {
            clearInterval(crashTimerRef.current!);
            setCrashDetected(false);
            setCrashCountdown(0);
            alertSystem.speakAlert('Calling emergency services now.', true);
            window.location.href = 'tel:112';
          }
        }, 1000);
      });
    } else {
      crashDetector.stop();
    }
    return () => {
      crashDetector.stop();
      if (crashTimerRef.current) clearInterval(crashTimerRef.current);
    };
  }, [isMonitoring]);

  // Load preferences on mount
  useEffect(() => {
    const loadedPrefs = loadPreferences();
    if (loadedPrefs) {
      setAlertVolume(loadedPrefs.alertVolume);
      setSensitivity(loadedPrefs.sensitivity);
    }
  }, []);

  const {
    isModelLoaded,
    currentDetection,
    detectionHistory,
    drowsinessCount,
    resetDetection,
  } = useFaceDetection({
    videoRef,
    isActive: isMonitoring,
    sensitivity,
    alertVolume,
  });

  const handleAllowCamera = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    setShowPermissionDialog(false);
    const stream = await requestCameraPermission();

    if (stream) {
      setCameraStream(stream);
      setIsMonitoring(true);
      const startTime = new Date();
      setSessionStartTime(startTime);
      
      // Create new session
      const session = await createSession();
      if (session) {
        setCurrentSessionId(session.id);
        toast({
          title: "Session Started",
          description: "Monitoring session created and will be saved to history",
        });
      }
      
      toast({
        title: "Camera Enabled",
        description: "Monitoring started successfully",
      });
    } else {
      toast({
        title: "Camera Access Denied",
        description: "Please allow camera access to use monitoring features",
        variant: "destructive",
      });
      navigate("/");
    }
  };

  const handleCancelCamera = () => {
    setShowPermissionDialog(false);
    navigate("/");
  };

  const handleStopMonitoring = async () => {
    // Save session data before stopping
    if (currentSessionId && sessionStartTime) {
      const endTime = new Date();
      const durationMs = endTime.getTime() - sessionStartTime.getTime();
      const duration = Math.floor(durationMs / 1000);
      const avgAlertness = Math.round(alertnessLevel);
      
      console.log('Stopping monitoring - Session data:', {
        sessionId: currentSessionId,
        startTime: sessionStartTime.toISOString(),
        endTime: endTime.toISOString(),
        durationMs,
        duration,
        drowsinessCount,
        avgAlertness
      });
      
      await updateSession(currentSessionId, {
        end_time: endTime.toISOString(),
        duration,
        total_drowsiness_incidents: drowsinessCount,
        avg_alertness_level: avgAlertness,
        max_alertness_level: 100,
      });
      
      // Show safety report if session was meaningful (>10 seconds)
      if (duration > 10) {
        setShowSafetyReport(true);
        return;
      }
    }
    
    stopCameraStream(cameraStream);
    setCameraStream(null);
    setIsMonitoring(false);
    resetDetection();
    navigate("/");
  };

  useEffect(() => {
    return () => {
      stopCameraStream(cameraStream);
    };
  }, [cameraStream]);

  // Calculate smoothed alertness level to prevent fluctuation alerts
  const rawAlertnessLevel = currentDetection
    ? 100 - calculateEyeClosureDuration(detectionHistory, 3000)
    : 100;
  
  // Update alertness history for smoothing
  useEffect(() => {
    setAlertnessHistory(prev => {
      const updated = [...prev, rawAlertnessLevel];
      return updated.slice(-10); // Keep last 10 readings
    });
  }, [rawAlertnessLevel]);
  
  // Use smoothed alertness level (average of last 5 readings)
  const alertnessLevel = alertnessHistory.length > 0 
    ? alertnessHistory.slice(-5).reduce((a, b) => a + b, 0) / Math.min(alertnessHistory.length, 5)
    : 100;

  return (
    <div className="min-h-screen flex flex-col app-container pb-20">
      <CameraPermissionDialog
        isOpen={showPermissionDialog}
        onConfirm={handleAllowCamera}
        onCancel={handleCancelCamera}
      />

      <header className="app-header">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleStopMonitoring}
          className="text-foreground"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-bold">Active Monitoring</h1>
        <div className="w-10" />
      </header>

      {!isModelLoaded && isMonitoring && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-secondary" />
            <p className="text-lg font-medium">Loading AI Model...</p>
            <p className="text-sm text-muted-foreground mt-2">
              This may take a moment on first load
            </p>
          </div>
        </div>
      )}

      <main className="app-main">
        {crashDetected && (
          <div className="fixed inset-0 bg-destructive/95 z-50 flex flex-col items-center justify-center p-6 text-white">
            <div className="text-6xl mb-4">🚨</div>
            <h2 className="text-3xl font-bold mb-2">Crash Detected!</h2>
            <p className="text-center text-lg mb-6 opacity-90">
              Are you okay? Emergency services will be called automatically.
            </p>
            <div className="text-8xl font-bold mb-6 tabular-nums">{crashCountdown}</div>
            <p className="text-sm opacity-75 mb-8">seconds until calling 112</p>
            <Button
              size="lg"
              className="w-full max-w-xs bg-white text-destructive hover:bg-gray-100 font-bold text-lg h-16"
              onClick={cancelCrashAlert}
            >
              ✅ I'm Okay — Cancel
            </Button>
          </div>
        )}
        <CameraPreview ref={videoRef} stream={cameraStream} isActive={isMonitoring} />

        <SessionTimer startTime={sessionStartTime} isActive={isMonitoring} />

        <AlertnessIndicator level={alertnessLevel} />

        <MonitoringStats
          drowsinessCount={drowsinessCount}
          faceDetected={currentDetection?.faceDetected || false}
        />

        <EyeClosureGraph detectionHistory={detectionHistory} />

        <Button
          onClick={handleStopMonitoring}
          variant="destructive"
          size="lg"
          className="w-full font-bold btn-enhanced"
        >
          Stop Monitoring
        </Button>
      </main>
      
      <TripSafetyReport
        isOpen={showSafetyReport}
        onClose={() => {
          setShowSafetyReport(false);
          stopCameraStream(cameraStream);
          setCameraStream(null);
          setIsMonitoring(false);
          resetDetection();
          navigate("/");
        }}
        sessionData={{
          duration: (() => {
            if (!sessionStartTime) {
              console.log('No session start time available');
              return 0;
            }
            const durationMs = Date.now() - sessionStartTime.getTime();
            const durationSeconds = Math.floor(durationMs / 1000);
            console.log('Session duration calculation:', {
              startTime: sessionStartTime.toISOString(),
              endTime: new Date().toISOString(),
              durationMs,
              durationSeconds
            });
            return durationSeconds;
          })(),
          drowsinessCount,
          avgAlertness: alertnessLevel,
        }}
      />
    </div>
  );
};

export default Monitor;
