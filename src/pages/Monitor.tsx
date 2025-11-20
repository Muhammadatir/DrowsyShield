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
  
  const { createSession, updateSession } = useSessionData();

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
      const duration = Math.floor((Date.now() - sessionStartTime.getTime()) / 1000);
      const avgAlertness = alertnessLevel;
      
      await updateSession(currentSessionId, {
        end_time: new Date().toISOString(),
        duration,
        total_drowsiness_incidents: drowsinessCount,
        avg_alertness_level: avgAlertness,
        max_alertness_level: 100,
      });
      
      // Show safety report if session was meaningful (>30 seconds)
      if (duration > 30) {
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
          duration: sessionStartTime ? Math.floor((Date.now() - sessionStartTime.getTime()) / 1000) : 0,
          drowsinessCount,
          avgAlertness: alertnessLevel,
        }}
      />
    </div>
  );
};

export default Monitor;
