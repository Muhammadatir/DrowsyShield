import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, MapPin, AlertTriangle, Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const FamilyDashboard = () => {
  const navigate = useNavigate();
  const [familyMembers] = useState([
    {
      id: 1,
      name: "John Doe",
      status: "driving",
      location: "Highway 101",
      safetyScore: 95,
      lastAlert: null,
      avatar: "JD"
    },
    {
      id: 2,
      name: "Sarah Doe",
      status: "safe",
      location: "Home",
      safetyScore: 88,
      lastAlert: "2 hours ago",
      avatar: "SD"
    },
    {
      id: 3,
      name: "Mike Doe",
      status: "alert",
      location: "Downtown",
      safetyScore: 76,
      lastAlert: "5 minutes ago",
      avatar: "MD"
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "driving": return "bg-blue-500";
      case "safe": return "bg-green-500";
      case "alert": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "driving": return "Currently Driving";
      case "safe": return "Safe";
      case "alert": return "Drowsiness Alert";
      default: return "Unknown";
    }
  };

  return (
    <div className="min-h-screen flex flex-col app-container pb-20">
      <header className="app-header">
        <Button variant="ghost" size="icon" onClick={() => navigate("/profile")}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-bold">Family Dashboard</h1>
        <Button variant="ghost" size="icon">
          <Plus className="h-6 w-6" />
        </Button>
      </header>

      <main className="app-main">
        {/* Overview Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="card-enhanced">
            <CardContent className="p-4 text-center">
              <Users className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">{familyMembers.length}</div>
              <div className="text-xs text-muted-foreground">Family Members</div>
            </CardContent>
          </Card>
          
          <Card className="card-enhanced">
            <CardContent className="p-4 text-center">
              <MapPin className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold">
                {familyMembers.filter(m => m.status === "driving").length}
              </div>
              <div className="text-xs text-muted-foreground">Currently Driving</div>
            </CardContent>
          </Card>
          
          <Card className="card-enhanced">
            <CardContent className="p-4 text-center">
              <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-red-500" />
              <div className="text-2xl font-bold">
                {familyMembers.filter(m => m.status === "alert").length}
              </div>
              <div className="text-xs text-muted-foreground">Active Alerts</div>
            </CardContent>
          </Card>
        </div>

        {/* Family Members List */}
        <Card className="card-enhanced">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Family Members
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {familyMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold">
                        {member.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background ${getStatusColor(member.status)}`}></div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold">{member.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{member.location}</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <Badge variant={member.status === "alert" ? "destructive" : member.status === "driving" ? "default" : "secondary"}>
                    {getStatusText(member.status)}
                  </Badge>
                  <div className="text-xs text-muted-foreground mt-1">
                    Score: {member.safetyScore}%
                  </div>
                  {member.lastAlert && (
                    <div className="text-xs text-red-500 flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" />
                      {member.lastAlert}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card className="card-enhanced">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Recent Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
              <div className="flex-1">
                <div className="font-medium text-red-800 dark:text-red-200">Mike Doe - Drowsiness Alert</div>
                <div className="text-sm text-red-600 dark:text-red-300">Downtown area • 5 minutes ago</div>
                <div className="text-xs text-red-500 mt-1">Emergency contact notified</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
              <Clock className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div className="flex-1">
                <div className="font-medium text-yellow-800 dark:text-yellow-200">Sarah Doe - Long Drive Alert</div>
                <div className="text-sm text-yellow-600 dark:text-yellow-300">Highway 95 • 2 hours ago</div>
                <div className="text-xs text-yellow-500 mt-1">Suggested rest stop sent</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Button variant="outline" className="btn-enhanced">
            <MapPin className="h-4 w-4 mr-2" />
            View All Locations
          </Button>
          <Button variant="outline" className="btn-enhanced">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Alert Settings
          </Button>
        </div>
      </main>
    </div>
  );
};

export default FamilyDashboard;