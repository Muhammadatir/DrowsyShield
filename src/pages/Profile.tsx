import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Palette, Volume2, Users, Calendar, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    theme: "dark",
    alertVoice: "female",
    musicIntegration: true,
    calendarSync: false,
    familySharing: false,
    emergencyAlerts: true,
    alertVolume: [70],
  });

  return (
    <div className="min-h-screen flex flex-col app-container pb-20">
      <header className="app-header">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-bold">Profile & Settings</h1>
        <div className="w-10" />
      </header>

      <main className="app-main">
        {/* User Profile */}
        <Card className="card-enhanced">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <User className="h-10 w-10 text-white" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="font-semibold">Driver Profile</h3>
              <p className="text-sm text-muted-foreground">Safety Score: 92%</p>
            </div>
          </CardContent>
        </Card>

        {/* Personalization */}
        <Card className="card-enhanced">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Personalization
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Theme</span>
              <Select value={settings.theme} onValueChange={(value) => setSettings({...settings, theme: value})}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="auto">Auto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">Alert Voice</span>
              <Select value={settings.alertVoice} onValueChange={(value) => setSettings({...settings, alertVoice: value})}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="robotic">Robotic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Alert Volume</span>
                <span className="text-sm text-muted-foreground">{settings.alertVolume[0]}%</span>
              </div>
              <Slider
                value={settings.alertVolume}
                onValueChange={(value) => setSettings({...settings, alertVolume: value})}
                max={100}
                step={10}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>

        {/* Smart Integrations */}
        <Card className="card-enhanced">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="h-5 w-5" />
              Smart Integrations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm font-medium">Music Control</span>
                <p className="text-xs text-muted-foreground">Play energizing music when drowsy</p>
              </div>
              <Switch 
                checked={settings.musicIntegration}
                onCheckedChange={(checked) => setSettings({...settings, musicIntegration: checked})}
              />
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm font-medium">Calendar Sync</span>
                <p className="text-xs text-muted-foreground">Detect tired periods from schedule</p>
              </div>
              <Switch 
                checked={settings.calendarSync}
                onCheckedChange={(checked) => setSettings({...settings, calendarSync: checked})}
              />
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Safety */}
        <Card className="card-enhanced">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Enhanced Safety
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm font-medium">Family Sharing</span>
                <p className="text-xs text-muted-foreground">Share location during trips</p>
              </div>
              <Switch 
                checked={settings.familySharing}
                onCheckedChange={(checked) => setSettings({...settings, familySharing: checked})}
              />
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm font-medium">Emergency Alerts</span>
                <p className="text-xs text-muted-foreground">Auto-contact emergency contacts</p>
              </div>
              <Switch 
                checked={settings.emergencyAlerts}
                onCheckedChange={(checked) => setSettings({...settings, emergencyAlerts: checked})}
              />
            </div>

            <Button 
              variant="outline" 
              className="w-full btn-enhanced"
              onClick={() => navigate('/family-dashboard')}
            >
              <Users className="h-4 w-4 mr-2" />
              Manage Family Dashboard
            </Button>
          </CardContent>
        </Card>

        {/* Data & Insights */}
        <Card className="card-enhanced">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Data & Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full btn-enhanced"
              onClick={() => {
                toast({
                  title: "Generating Report",
                  description: "Monthly report will be ready shortly",
                });
              }}
            >
              Generate Monthly Report
            </Button>
            <Button 
              variant="outline" 
              className="w-full btn-enhanced"
              onClick={() => {
                toast({
                  title: "Export Started",
                  description: "Data is being exported to Health App",
                });
              }}
            >
              Export to Health App
            </Button>
            <Button 
              variant="outline" 
              className="w-full btn-enhanced"
              onClick={() => navigate('/analytics')}
            >
              Fatigue Pattern Analysis
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Profile;