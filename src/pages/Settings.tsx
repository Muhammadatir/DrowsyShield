import { useNavigate } from "react-router-dom";
import { ArrowLeft, Settings2, AlertTriangle, Users, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { usePreferences } from "@/hooks/usePreferences";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { SliderSetting } from "@/components/settings/SliderSetting";
import { SelectSetting } from "@/components/settings/SelectSetting";
import { SwitchSetting } from "@/components/settings/SwitchSetting";
import { DETECTION_MODES } from "@/types/preferences";
import { alertSystem } from "@/utils/alertSystem";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { clearAllData } from "@/utils/localStorage";

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { preferences, updatePreferences, isLoaded } = usePreferences();

  const handleTestAlert = () => {
    alertSystem.triggerFullAlert(preferences.alertVolume / 100, preferences.vibrationIntensity);
    toast({
      title: "Alert Test",
      description: "Testing alert sound and vibration",
    });
  };

  const handleClearData = () => {
    clearAllData();
    toast({
      title: "Data Cleared",
      description: "All local data has been removed",
    });
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-6 pb-20">
      <header className="flex justify-between items-center mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-bold">Settings</h1>
        <div className="w-10" />
      </header>

      <main className="flex-1 space-y-6">
        <SettingsSection title="Profile & Advanced">
          <Button
            onClick={() => navigate("/profile")}
            variant="secondary"
            className="w-full btn-enhanced"
          >
            <User className="mr-2 h-4 w-4" />
            Profile & Advanced Settings
          </Button>
          <p className="text-xs text-muted-foreground">
            Personalization, integrations, and family safety features
          </p>
        </SettingsSection>
        <SettingsSection title="Calibration">
          <Button
            onClick={() => navigate("/calibrate")}
            variant="secondary"
            className="w-full"
          >
            <Settings2 className="mr-2 h-4 w-4" />
            Run Calibration Wizard
          </Button>
          <p className="text-xs text-muted-foreground">
            Personalize detection for your face and driving conditions
          </p>
        </SettingsSection>

        <SettingsSection title="Detection Settings">
          <SelectSetting
            label="Detection Mode"
            value={preferences.detectionMode}
            onChange={(value) =>
              updatePreferences({
                detectionMode: value as 'standard' | 'sensitive' | 'relaxed',
              })
            }
            options={DETECTION_MODES.map((mode) => ({
              value: mode.id,
              label: `${mode.name} - ${mode.description}`,
            }))}
          />

          <SliderSetting
            label="Sensitivity"
            value={preferences.sensitivity}
            onChange={(value) => updatePreferences({ sensitivity: value })}
          />

          <SwitchSetting
            label="Early Warning"
            description="Alert before reaching critical drowsiness level"
            checked={preferences.earlyWarning}
            onChange={(checked) => updatePreferences({ earlyWarning: checked })}
          />
        </SettingsSection>

        <SettingsSection title="Alert Settings">
          <SliderSetting
            label="Alert Volume"
            value={preferences.alertVolume}
            onChange={(value) => updatePreferences({ alertVolume: value })}
          />

          <SelectSetting
            label="Vibration Intensity"
            value={preferences.vibrationIntensity}
            onChange={(value) =>
              updatePreferences({
                vibrationIntensity: value as 'low' | 'medium' | 'high',
              })
            }
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
            ]}
          />

          <SwitchSetting
            label="Voice Alerts"
            description="Enable spoken drowsiness warnings"
            checked={preferences.voiceAlerts}
            onChange={(checked) => updatePreferences({ voiceAlerts: checked })}
          />

          <Button onClick={handleTestAlert} variant="outline" className="w-full">
            Test Alerts
          </Button>
          
          <Button 
            onClick={() => {
              alertSystem.testVoiceAlert();
              toast({
                title: "Voice Test",
                description: "Testing voice alert functionality",
              });
            }} 
            variant="outline" 
            className="w-full"
          >
            Test Voice Alert
          </Button>
        </SettingsSection>

        <SettingsSection title="Emergency">
          <Button
            onClick={() => navigate("/emergency")}
            variant="secondary"
            className="w-full"
          >
            <Users className="mr-2 h-4 w-4" />
            Manage Emergency Contacts
          </Button>
          <p className="text-xs text-muted-foreground">
            Add contacts for quick access during emergencies
          </p>
        </SettingsSection>

        <SettingsSection title="General">
          <SwitchSetting
            label="Auto-Start Monitoring"
            description="Automatically start when app opens"
            checked={preferences.autoStart}
            onChange={(checked) => updatePreferences({ autoStart: checked })}
          />

          <SwitchSetting
            label="Data Collection"
            description="Save session history for analysis"
            checked={preferences.dataCollection}
            onChange={(checked) =>
              updatePreferences({ dataCollection: checked })
            }
          />
        </SettingsSection>

        <SettingsSection title="Privacy & Data">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              All data is processed locally on your device. Nothing is sent to
              external servers.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Clear All Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear All Data?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will delete all your settings, calibration data, and
                    session history. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearData}>
                    Clear Data
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </SettingsSection>
      </main>
    </div>
  );
};

export default Settings;
