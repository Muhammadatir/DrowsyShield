import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, MapPin, Shield, Bell, BellOff, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { loadEmergencyContacts } from "@/utils/emergencyStorage";

const FamilyDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const contacts = loadEmergencyContacts();
  const [drowsinessAlerts, setDrowsinessAlerts] = useState(
    localStorage.getItem("notify_drowsiness") !== "false"
  );
  const [emergencyAlerts, setEmergencyAlerts] = useState(
    localStorage.getItem("notify_emergency") !== "false"
  );
  const [sessionAlerts, setSessionAlerts] = useState(
    localStorage.getItem("notify_session") === "true"
  );

  const handleToggle = (key: string, value: boolean, setter: (v: boolean) => void) => {
    setter(value);
    localStorage.setItem(key, String(value));
    toast({ title: value ? "Notifications enabled" : "Notifications disabled" });
  };

  return (
    <div className="min-h-screen flex flex-col app-container pb-20">
      <header className="app-header">
        <Button variant="ghost" size="icon" onClick={() => navigate("/profile")}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-bold">Family Dashboard</h1>
        <div className="w-10" />
      </header>

      <main className="app-main">
        <Card className="card-enhanced">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Family Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No family members added yet.</p>
            <Button 
              className="mt-4 w-full"
              onClick={() => {
                toast({
                  title: "Add Family Member",
                  description: "Feature coming soon - invite family members to share safety data",
                });
              }}
            >
              Add Family Member
            </Button>
          </CardContent>
        </Card>

        <Card className="card-enhanced">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location Sharing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Share your location during trips for enhanced safety.</p>
            <Button 
              variant="outline" 
              className="mt-4 w-full"
              onClick={() => {
                toast({
                  title: "Location Sharing",
                  description: "Location sharing enabled for family safety",
                });
              }}
            >
              Enable Location Sharing
            </Button>
          </CardContent>
        </Card>

        <Card className="card-enhanced">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Safety Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">Configure emergency alerts and family notifications.</p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                <Label htmlFor="drowsiness-alerts">Drowsiness Alerts</Label>
              </div>
              <Switch
                id="drowsiness-alerts"
                checked={drowsinessAlerts}
                onCheckedChange={(v) => handleToggle("notify_drowsiness", v, setDrowsinessAlerts)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-destructive" />
                <Label htmlFor="emergency-alerts">Emergency Alerts</Label>
              </div>
              <Switch
                id="emergency-alerts"
                checked={emergencyAlerts}
                onCheckedChange={(v) => handleToggle("notify_emergency", v, setEmergencyAlerts)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BellOff className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="session-alerts">Session Start/End Alerts</Label>
              </div>
              <Switch
                id="session-alerts"
                checked={sessionAlerts}
                onCheckedChange={(v) => handleToggle("notify_session", v, setSessionAlerts)}
              />
            </div>

            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-3">
                Emergency Contacts ({contacts.length})
              </p>
              {contacts.length === 0 ? (
                <p className="text-xs text-muted-foreground">No contacts added yet.</p>
              ) : (
                <div className="space-y-1 mb-3">
                  {contacts.map((c) => (
                    <div key={c.id} className="flex items-center gap-2 text-sm">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <span>{c.name}</span>
                      <span className="text-muted-foreground">— {c.phone}</span>
                    </div>
                  ))}
                </div>
              )}
              <Button
                className="w-full"
                onClick={() => navigate("/emergency")}
              >
                Manage Emergency Contacts
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default FamilyDashboard;