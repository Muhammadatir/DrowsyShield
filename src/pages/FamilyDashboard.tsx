import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, MapPin, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const FamilyDashboard = () => {
  const navigate = useNavigate();

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
            <Button className="mt-4 w-full">Add Family Member</Button>
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
            <Button variant="outline" className="mt-4 w-full">Enable Location Sharing</Button>
          </CardContent>
        </Card>

        <Card className="card-enhanced">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Safety Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Configure emergency alerts and family notifications.</p>
            <Button variant="outline" className="mt-4 w-full">Configure Safety</Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default FamilyDashboard;