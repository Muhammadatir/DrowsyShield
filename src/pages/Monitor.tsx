import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, PhoneCall, X, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CameraPreview } from "@/components/monitor/CameraPreview";
import { CameraPermissionDialog } from "@/components/monitor/CameraPermissionDialog";
import { requestCameraPermission, stopCameraStream } from "@/utils/cameraUtils";
import { useFaceDetection } from "@/hooks/useFaceDetection";
import { loadPreferences } from "@/utils/localStorage";
import { useSessionData } from "@/hooks/useSessionData";
import { useAuth } from "@/contexts/AuthContext";
import { TripSafetyReport } from "@/components/reports/TripSafetyReport";
import { advancedCrashDetector } from "@/utils/advancedCrashDetection";
import { alertSystem } from "@/utils/alertSystem";
import { triggerEmergencyAlert } from "@/utils/emergencyAlert";
import { executeEmergencyResponse, type EmergencyResponseResult } from "@/utils/nativeEmergency";
import { getStatusColor } from "@/utils/drowsinessEngine";
import { cn } from "@/lib/utils";

const Monitor = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!user) navigate("/auth");
  }, [user, navigate]);

  const [showPermissionDialog, setShowPermissionDialog] = useState(true);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [alertVolume, setAlertVolume] = useState(70);
  const [sensitivity, setSensitivity] = useState(50);
  const [detectionMode, setDetectionMode] = useState<'standard' | 'sensitive' | 'relaxed'>('standard');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showSafetyReport, setShowSafetyReport] = useState(false);
  const [alertnessHistory, setAlertnessHistory] = useState<number[]>([]);
  const [elapsed, setElapsed] = useState(0);

  // Crash state
  const [crashDetected, setCrashDetected] = useState(false);
  const [crashCountdown, setCrashCountdown] = useState(0);
  const [crashConfidence, setCrashConfidence] = useState(0);
  const [crashDescription, setCrashDescription] = useState("");
  const [emergencyStatus, setEmergencyStatus] = useState<EmergencyResponseResult | null>(null);
  const [emergencyInProgress, setEmergencyInProgress] = useState(false);
  const crashTimerRef = useRef<number | null>(null);
  const emergencyFiredRef = useRef(false); // prevent double-fire

  const { createSession, updateSession } = useSessionData();

  const {
    isModelLoaded,
    currentDetection,
    detectionHistory,
    drowsinessCount,
    alertnessResult,
    resetDetection,
  } = useFaceDetection({ videoRef, isActive: isMonitoring, sensitivity, alertVolume, detectionMode });

  // Session timer
  useEffect(() => {
    if (!isMonitoring || !sessionStartTime) return;
    const t = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - sessionStartTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(t);
  }, [isMonitoring, sessionStartTime]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  // Load preferences
  useEffect(() => {
    const p = loadPreferences();
    if (p) { setAlertVolume(p.alertVolume); setSensitivity(p.sensitivity); setDetectionMode(p.detectionMode ?? 'standard'); }
  }, []);

  // Smoothed alertness
  const rawScore = alertnessResult?.score ?? 100;
  useEffect(() => {
    setAlertnessHistory((prev) => [...prev, rawScore].slice(-10));
  }, [rawScore]);
  const smoothedScore = alertnessHistory.length > 0
    ? Math.round(alertnessHistory.slice(-5).reduce((a, b) => a + b, 0) / Math.min(alertnessHistory.length, 5))
    : 100;

  const status = alertnessResult?.status ?? "SAFE";
  const colors = getStatusColor(status);

  // Crash detection
  useEffect(() => {
    if (!isMonitoring) { advancedCrashDetector.stop(); return; }
    advancedCrashDetector.start((result) => {
      // Prevent duplicate crash events
      if (emergencyFiredRef.current) return;
      setCrashDetected(true);
      setCrashCountdown(15);
      setCrashConfidence(result.confidence);
      setCrashDescription(result.description);
      setEmergencyStatus(null);
      alertSystem.triggerFullAlert(1.0, "high");
      alertSystem.speakAlert(
        `Possible crash detected with ${result.confidence}% confidence. Tap I am okay within 15 seconds.`,
        true
      );
      const confidence = result.confidence;
      let seconds = 15;
      crashTimerRef.current = window.setInterval(() => {
        seconds -= 1;
        setCrashCountdown(seconds);
        if (seconds <= 0) {
          clearInterval(crashTimerRef.current!);
          setCrashDetected(false);
          if (!emergencyFiredRef.current) {
            emergencyFiredRef.current = true;
            setEmergencyInProgress(true);
            alertSystem.speakAlert("No response detected. Alerting your emergency contacts now.", true);
            executeEmergencyResponse(
              confidence,
              null,
              [],
              triggerEmergencyAlert
            ).then((res) => {
              setEmergencyStatus(res);
              setEmergencyInProgress(false);
              // Reset after 30s so a new crash can be detected
              setTimeout(() => { emergencyFiredRef.current = false; }, 30000);
            });
          }
        }
      }, 1000);
    });
    return () => { advancedCrashDetector.stop(); if (crashTimerRef.current) clearInterval(crashTimerRef.current); };
  }, [isMonitoring]);

  const cancelCrashAlert = () => {
    if (crashTimerRef.current) clearInterval(crashTimerRef.current);
    setCrashDetected(false);
    setCrashCountdown(0);
    emergencyFiredRef.current = false;
    alertSystem.stopAllAlerts();
    toast({ title: "Alert Cancelled", description: "Stay safe!" });
  };

  const handleAllowCamera = async () => {
    if (!user) { navigate("/auth"); return; }
    setShowPermissionDialog(false);
    const stream = await requestCameraPermission();
    if (stream) {
      setCameraStream(stream);
      setIsMonitoring(true);
      const startTime = new Date();
      setSessionStartTime(startTime);
      const session = await createSession();
      if (session) setCurrentSessionId(session.id);
    } else {
      toast({ title: "Camera Access Denied", variant: "destructive" });
      navigate("/");
    }
  };

  const handleStopMonitoring = async () => {
    if (currentSessionId && sessionStartTime) {
      const duration = Math.floor((Date.now() - sessionStartTime.getTime()) / 1000);
      await updateSession(currentSessionId, {
        end_time: new Date().toISOString(),
        duration,
        total_drowsiness_incidents: drowsinessCount,
        avg_alertness_level: smoothedScore,
        max_alertness_level: 100,
      });
      if (duration > 10) { setShowSafetyReport(true); return; }
    }
    stopCameraStream(cameraStream);
    setCameraStream(null);
    setIsMonitoring(false);
    resetDetection();
    navigate("/");
  };

  useEffect(() => () => { stopCameraStream(cameraStream); }, [cameraStream]);

  // Alert level background flash
  const alertLevel = alertnessResult?.alertLevel ?? 0;
  const bgClass =
    alertLevel === 3 ? "bg-red-950" :
    alertLevel === 2 ? "bg-orange-950" :
    alertLevel === 1 ? "bg-yellow-950" :
    "bg-slate-950";

  return (
    <div className={cn("min-h-screen flex flex-col transition-colors duration-500", bgClass)}>
      <CameraPermissionDialog
        isOpen={showPermissionDialog}
        onConfirm={handleAllowCamera}
        onCancel={() => { setShowPermissionDialog(false); navigate("/"); }}
      />

      {/* Loading overlay */}
      {!isModelLoaded && isMonitoring && (
        <div className="fixed inset-0 bg-slate-950/90 z-50 flex items-center justify-center">
          <div className="text-center text-white">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-400" />
            <p className="text-lg font-medium">Loading AI Model...</p>
          </div>
        </div>
      )}

      {/* Emergency In-Progress Overlay */}
      {emergencyInProgress && (
        <div className="fixed inset-0 bg-red-900/95 z-50 flex flex-col items-center justify-center p-6 text-white">
          <Loader2 className="h-16 w-16 animate-spin mb-4 text-red-300" />
          <h2 className="text-2xl font-bold mb-2">Emergency Response Active</h2>
          <p className="text-center text-sm opacity-80">Contacting emergency services and notifying your contacts...</p>
        </div>
      )}

      {/* Emergency Response Result Overlay */}
      {emergencyStatus && !emergencyInProgress && (
        <div className="fixed inset-0 bg-slate-900/97 z-50 flex flex-col items-center justify-center p-6 text-white overflow-y-auto">
          <div className="text-5xl mb-4">🚨</div>
          <h2 className="text-2xl font-bold mb-6">Emergency Response Summary</h2>
          <div className="w-full max-w-xs space-y-3 mb-8">
            <StatusRow
              label="Emergency contacts notified"
              ok={emergencyStatus.twilioNotified}
              okText="Sent via SMS + call"
              failText="Failed — check contacts"
            />
            <StatusRow
              label="Local notification"
              ok={emergencyStatus.localNotificationSent}
              okText="Sent"
              failText="Failed"
            />
            <StatusRow
              label="112 dialer"
              ok={emergencyStatus.dialerOpened}
              okText="Opened — tap call button"
              failText="Could not open"
            />
            {emergencyStatus.smsFallbackOpened && (
              <StatusRow label="SMS fallback" ok={true} okText="SMS app opened" failText="" />
            )}
            {emergencyStatus.errors.length > 0 && (
              <div className="bg-red-500/20 border border-red-500 rounded-xl p-3">
                <p className="text-xs text-red-300 font-semibold mb-1">Errors:</p>
                {emergencyStatus.errors.map((e, i) => (
                  <p key={i} className="text-xs text-red-200">{e}</p>
                ))}
              </div>
            )}
          </div>
          <Button
            className="w-full max-w-xs bg-white text-slate-900 font-bold h-12"
            onClick={() => setEmergencyStatus(null)}
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Crash Detection Overlay */}
      {crashDetected && (
        <div className="fixed inset-0 bg-red-600 z-50 flex flex-col items-center justify-center p-6 text-white">
          <div className="text-6xl mb-3">🚨</div>
          <h2 className="text-3xl font-bold mb-1">Possible Crash!</h2>
          <p className="text-center text-sm mb-2 opacity-80">{crashDescription}</p>
          <div className="bg-white/20 rounded-xl px-6 py-2 mb-4">
            <span className="text-sm font-medium">Confidence: </span>
            <span className="text-xl font-bold">{crashConfidence}%</span>
          </div>
          <p className="text-center text-lg mb-4 opacity-90">Are you okay?</p>
          <div className="text-8xl font-bold mb-2 tabular-nums">{crashCountdown}</div>
          <p className="text-sm opacity-75 mb-8">seconds until alerting your emergency contacts</p>
          <div className="flex gap-4 w-full max-w-xs">
            <Button
              size="lg"
              className="flex-1 bg-white text-red-600 hover:bg-gray-100 font-bold h-14"
              onClick={cancelCrashAlert}
            >
              ✅ I'm Okay
            </Button>
            <Button
              size="lg"
              className="flex-1 bg-red-800 hover:bg-red-900 font-bold h-14"
              onClick={() => { window.location.href = "tel:112"; }}
            >
              <PhoneCall className="mr-2 h-5 w-5" /> Call 112 Now
            </Button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between px-4 pt-4 pb-2">
        <Button variant="ghost" size="icon" onClick={handleStopMonitoring} className="text-white/70">
          <X className="h-6 w-6" />
        </Button>
        <span className="text-white/50 text-sm font-mono">{formatTime(elapsed)}</span>
        <div className={cn("text-xs font-bold px-3 py-1 rounded-full border", colors.text, colors.border)}>
          {status}
        </div>
      </header>

      {/* Main Driving UI */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
        {/* Score Ring */}
        <div className="relative flex items-center justify-center">
          <svg width="200" height="200" className="-rotate-90">
            <circle cx="100" cy="100" r="85" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="12" />
            <circle
              cx="100" cy="100" r="85" fill="none"
              stroke={status === "SAFE" ? "#4ade80" : status === "CAUTION" ? "#facc15" : "#f87171"}
              strokeWidth="12"
              strokeDasharray={`${2 * Math.PI * 85}`}
              strokeDashoffset={`${2 * Math.PI * 85 * (1 - smoothedScore / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute text-center">
            <div className={cn("text-6xl font-bold", colors.text)}>{smoothedScore}</div>
            <div className="text-white/50 text-sm">ALERTNESS</div>
          </div>
        </div>

        {/* Signal indicators */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
          <SignalBadge label="Eyes" value={alertnessResult?.eyeOpenness ?? 100} />
          <SignalBadge label="Head" value={alertnessResult?.signals.headPoseScore ?? 100} />
          <SignalBadge label="Blink" value={alertnessResult?.signals.blinkScore ?? 100} />
        </div>

        {/* Status row */}
        <div className="flex gap-6 text-center">
          <div>
            <div className="text-white/40 text-xs">Yawning</div>
            <div className={cn("text-sm font-bold", alertnessResult?.yawning ? "text-yellow-400" : "text-green-400")}>
              {alertnessResult?.yawning ? "Yes" : "No"}
            </div>
          </div>
          <div>
            <div className="text-white/40 text-xs">Blink</div>
            <div className="text-white text-sm font-bold">{alertnessResult?.blinkPattern ?? "Normal"}</div>
          </div>
          <div>
            <div className="text-white/40 text-xs">Alerts</div>
            <div className={cn("text-sm font-bold", drowsinessCount > 0 ? "text-red-400" : "text-green-400")}>
              {drowsinessCount}
            </div>
          </div>
          <div>
            <div className="text-white/40 text-xs">Face</div>
            <div className={cn("text-sm font-bold", currentDetection?.faceDetected ? "text-green-400" : "text-red-400")}>
              {currentDetection?.faceDetected ? "OK" : "Lost"}
            </div>
          </div>
        </div>

        {/* Alert level banner */}
        {alertLevel > 0 && (
          <div className={cn(
            "w-full max-w-xs rounded-xl p-3 text-center text-sm font-semibold border",
            alertLevel === 1 ? "bg-yellow-500/20 border-yellow-500 text-yellow-300" :
            alertLevel === 2 ? "bg-orange-500/20 border-orange-500 text-orange-300" :
            "bg-red-500/20 border-red-500 text-red-300 animate-pulse"
          )}>
            {alertLevel === 1 ? "⚠️ Caution — Stay Alert" :
             alertLevel === 2 ? "🔶 Warning — Consider a Break" :
             "🚨 Critical — Stop Safely Now"}
          </div>
        )}

        {/* Hidden camera preview */}
        <div className="w-24 h-18 rounded-lg overflow-hidden opacity-40">
          <CameraPreview ref={videoRef} stream={cameraStream} isActive={isMonitoring} />
        </div>
      </main>

      {/* Stop button */}
      <div className="px-6 pb-8">
        <Button
          onClick={handleStopMonitoring}
          variant="outline"
          className="w-full border-white/20 text-white/70 hover:bg-white/10"
        >
          Stop Monitoring
        </Button>
      </div>

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
          avgAlertness: smoothedScore,
        }}
      />
    </div>
  );
};

const SignalBadge = ({ label, value }: { label: string; value: number }) => {
  const color = value >= 70 ? "text-green-400" : value >= 40 ? "text-yellow-400" : "text-red-400";
  return (
    <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
      <div className="text-white/40 text-xs mb-1">{label}</div>
      <div className={cn("text-lg font-bold", color)}>{value}%</div>
    </div>
  );
};

const StatusRow = ({ label, ok, okText, failText }: { label: string; ok: boolean; okText: string; failText: string }) => (
  <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 border border-white/10">
    <span className="text-sm text-white/70">{label}</span>
    <div className={cn("flex items-center gap-1 text-xs font-semibold", ok ? "text-green-400" : "text-red-400")}>
      {ok ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
      {ok ? okText : failText}
    </div>
  </div>
);

export default Monitor;
