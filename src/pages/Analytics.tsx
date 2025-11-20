import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp, Activity, AlertTriangle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSessionData } from "@/hooks/useSessionData";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

const Analytics = () => {
  const navigate = useNavigate();
  const { sessions, isLoading } = useSessionData();

  const generateFatigueData = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    return last7Days.map(date => {
      const daySessions = sessions.filter(s => 
        s.start_time && s.start_time.startsWith(date)
      );
      
      const avgFatigue = daySessions.length > 0 
        ? daySessions.reduce((sum, s) => sum + (s.total_drowsiness_incidents || 0), 0) / daySessions.length
        : 0;
      
      const avgAlertness = daySessions.length > 0
        ? daySessions.reduce((sum, s) => sum + (s.avg_alertness_level || 100), 0) / daySessions.length
        : 100;

      return {
        date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        fatigue: Math.round(avgFatigue * 10), // Scale for visibility
        alertness: Math.round(avgAlertness),
        sessions: daySessions.length
      };
    });
  };

  const fatigueData = generateFatigueData();
  
  const totalSessions = sessions.length;
  const totalAlerts = sessions.reduce((sum, s) => sum + (s.total_drowsiness_incidents || 0), 0);
  const avgAlertness = sessions.length > 0 
    ? Math.round(sessions.reduce((sum, s) => sum + (s.avg_alertness_level || 100), 0) / sessions.length)
    : 100;
  const totalDrivingTime = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col app-container pb-20">
      <header className="app-header">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-bold">Analytics Dashboard</h1>
        <div className="w-10" />
      </header>

      <main className="app-main">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Activity className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <div className="text-sm text-muted-foreground">Avg Alertness</div>
              <div className="text-2xl font-bold">{avgAlertness}%</div>
              <Badge variant={avgAlertness >= 90 ? "default" : avgAlertness >= 80 ? "secondary" : "destructive"} className="text-xs mt-1">
                {avgAlertness >= 90 ? "Excellent" : avgAlertness >= 80 ? "Good" : "Needs Improvement"}
              </Badge>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-red-500" />
              <div className="text-sm text-muted-foreground">Total Alerts</div>
              <div className="text-2xl font-bold">{totalAlerts}</div>
              <Badge variant="outline" className="text-xs mt-1">
                {totalSessions > 0 ? `${(totalAlerts / totalSessions).toFixed(1)} per trip` : "No data"}
              </Badge>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <div className="text-sm text-muted-foreground">Total Sessions</div>
              <div className="text-2xl font-bold">{totalSessions}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-6 w-6 mx-auto mb-2 text-purple-500" />
              <div className="text-sm text-muted-foreground">Driving Time</div>
              <div className="text-2xl font-bold">{formatTime(totalDrivingTime)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Real-time Fatigue Graph */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              7-Day Fatigue Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={fatigueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'fatigue' ? `${value} fatigue score` : `${value}%`,
                      name === 'fatigue' ? 'Fatigue Level' : 'Alertness'
                    ]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="alertness" 
                    stackId="1"
                    stroke="#10b981" 
                    fill="#10b981" 
                    fillOpacity={0.6}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="fatigue" 
                    stackId="2"
                    stroke="#ef4444" 
                    fill="#ef4444" 
                    fillOpacity={0.8}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Alertness Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Weekly Alertness Pattern
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={fatigueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => [`${value}%`, 'Alertness']} />
                  <Line 
                    type="monotone" 
                    dataKey="alertness" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Safety Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {avgAlertness >= 90 && (
              <div className="flex items-start gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-lg">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                <span>Excellent alertness levels! Keep up the great driving habits.</span>
              </div>
            )}
            
            {totalAlerts > totalSessions * 2 && (
              <div className="flex items-start gap-2 text-sm text-orange-700 bg-orange-50 p-3 rounded-lg">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                <span>Consider taking more frequent breaks during long drives.</span>
              </div>
            )}
            
            {totalSessions === 0 && (
              <div className="flex items-start gap-2 text-sm text-blue-700 bg-blue-50 p-3 rounded-lg">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                <span>Start monitoring your drives to see personalized safety insights.</span>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Analytics;