import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CalibrationProgress } from "@/components/calibration/CalibrationProgress";
import { CalibrationStepCard } from "@/components/calibration/CalibrationStepCard";
import { FacePositionGuide } from "@/components/calibration/FacePositionGuide";
import { CameraPreview } from "@/components/monitor/CameraPreview";
import { requestCameraPermission, stopCameraStream } from "@/utils/cameraUtils";
import { initializeFaceDetector, detectFace } from "@/utils/faceDetection";
import { alertSystem } from "@/utils/alertSystem";
import { saveCalibration } from "@/utils/localStorage";
import { CALIBRATION_STEPS, type CalibrationData } from "@/types/calibration";

const Calibrate = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [currentStep, setCurrentStep] = useState(0);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureProgress, setCaptureProgress] = useState(0);
  const [calibrationData, setCalibrationData] = useState<Partial<CalibrationData>>({
    timestamp: Date.now(),
  });

  useEffect(() => {
    const init = async () => {
      const success = await initializeFaceDetector();
      setIsModelLoaded(success);

      const stream = await requestCameraPermission();
      if (stream) {
        setCameraStream(stream);
      } else {
        toast({
          title: "Camera Required",
          description: "Please allow camera access for calibration",
          variant: "destructive",
        });
        navigate("/settings");
      }
    };

    init();

    return () => {
      stopCameraStream(cameraStream);
    };
  }, []);

  useEffect(() => {
    if (!isModelLoaded || !videoRef.current) return;

    const detectInterval = setInterval(async () => {
      const result = await detectFace(videoRef.current!);
      setFaceDetected(result.faceDetected);
    }, 500);

    return () => clearInterval(detectInterval);
  }, [isModelLoaded]);

  const handleCapture = async () => {
    if (!videoRef.current) return;

    setIsCapturing(true);
    const duration = CALIBRATION_STEPS[currentStep].duration || 3000;
    const interval = 100;
    const steps = duration / interval;

    for (let i = 0; i <= steps; i++) {
      setCaptureProgress((i / steps) * 100);
      await new Promise((resolve) => setTimeout(resolve, interval));
    }

    // Capture calibration data
    const result = await detectFace(videoRef.current);
    
    if (currentStep === 1) {
      // Eyes open baseline
      setCalibrationData((prev) => ({
        ...prev,
        eyeOpenBrightness: result.eyeState.confidence,
      }));
    } else if (currentStep === 2) {
      // Eyes closed baseline
      setCalibrationData((prev) => ({
        ...prev,
        eyeClosedBrightness: result.eyeState.confidence,
      }));
    }

    setIsCapturing(false);
    setCaptureProgress(0);

    toast({
      title: "Step Complete",
      description: `${CALIBRATION_STEPS[currentStep].title} captured successfully`,
    });

    if (currentStep < CALIBRATION_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleTestAlert = () => {
    alertSystem.triggerFullAlert(0.7, "high");
    toast({
      title: "Alert Test",
      description: "Check if you can hear and feel the alert",
    });
  };

  const handleComplete = () => {
    const finalCalibration: CalibrationData = {
      ...calibrationData,
      timestamp: Date.now(),
      faceDistance: 50, // Default value
      lightingCondition: 'day', // Default value
      sensitivity: 50, // Default value
      completed: true,
    } as CalibrationData;

    saveCalibration(finalCalibration);

    toast({
      title: "Calibration Complete",
      description: "Your personalized settings have been saved",
    });

    stopCameraStream(cameraStream);
    navigate("/settings");
  };

  const step = CALIBRATION_STEPS[currentStep];

  return (
    <div className="min-h-screen flex flex-col p-6 pb-20">
      <header className="flex justify-between items-center mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            stopCameraStream(cameraStream);
            navigate("/settings");
          }}
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-bold">Calibration</h1>
        <div className="w-10" />
      </header>

      <CalibrationProgress
        currentStep={currentStep}
        totalSteps={CALIBRATION_STEPS.length}
      />

      <main className="flex-1 space-y-6">
        <CalibrationStepCard
          title={step.title}
          description={step.description}
          instruction={step.instruction}
        />

        {currentStep < 3 && (
          <div className="relative">
            <CameraPreview stream={cameraStream} isActive={true} />
            {videoRef.current && (
              <FacePositionGuide
                videoRef={videoRef}
                faceDetected={faceDetected}
              />
            )}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="hidden"
            />
          </div>
        )}

        {isCapturing && (
          <div className="space-y-2">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-secondary transition-all duration-100"
                style={{ width: `${captureProgress}%` }}
              />
            </div>
            <p className="text-sm text-center text-muted-foreground">
              Capturing... {Math.round(captureProgress)}%
            </p>
          </div>
        )}

        <div className="space-y-3">
          {currentStep < 3 ? (
            <Button
              onClick={handleCapture}
              disabled={!faceDetected || isCapturing || !isModelLoaded}
              className="w-full"
              size="lg"
            >
              {isCapturing ? "Capturing..." : "Start Capture"}
            </Button>
          ) : (
            <Button
              onClick={handleTestAlert}
              variant="secondary"
              className="w-full"
              size="lg"
            >
              <Volume2 className="mr-2 h-5 w-5" />
              Test Alert
            </Button>
          )}

          {currentStep === CALIBRATION_STEPS.length - 1 && (
            <Button onClick={handleComplete} className="w-full" size="lg">
              Complete Calibration
            </Button>
          )}

          {currentStep > 0 && currentStep < CALIBRATION_STEPS.length - 1 && (
            <Button
              onClick={() => setCurrentStep((prev) => prev + 1)}
              variant="outline"
              className="w-full"
            >
              Skip Step
            </Button>
          )}
        </div>
      </main>
    </div>
  );
};

export default Calibrate;
