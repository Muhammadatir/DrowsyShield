import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Activity, AlertTriangle, Clock, Shield, MapPin, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSessionData } from "@/hooks/useSessionData";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { computeDriverRiskScore, getRiskColor } from "@/utils/riskAnalysis";
import { cn } from "@/lib/utils";

interface LiveStatus {
  alertness: number;
  status: "SAFE" | "CAUTION" | "DROWSY";
  drowsinessAlerts: number;
  tripDuration: number;
  lastUpdate: string;
}

const FamilyDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { sessions, isLoading } = useSessionData();
  const [liveStatus, setLiveStatus] = useState<LiveStatus | null>(null);
  const [activeSession, setActiveSession] = useState<any>(null);

  // Subscribe to realtime session updates
  useEffect(() => {
    if (!user) return;

    // Check for active session
    const fetchActive = async () => {
      const { data } = await supabase
        .from("sessions")
        .select("*")
        .eq("user_id", user.id)
        .is("end_time", null)
        .order("start_time", { ascending: false })
        .limit(1);
      if (data && data.length > 0) setActiveSession(data[0]);
    };
    fetchActive();

    const channel = supabase
      .channel("family-dashboard")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "sessions",
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const s = payload.new as any;
        if (!s.end_time) {
          setActiveSession(s);
          const alertness = s.avg_alertness_level ?? 100;
          setLiveStatus({
            alertness,
            status: alertness >= 80 ? "SAFE" : alertness >= 50 ? "CAUTION" : "DROWSY",
            drowsinessAlerts: s.total_drowsiness_incidents ?? 0,
            tripDuration: s.duration ?? 0,
            lastUpdate: new Date().toLocaleTimeString(),
          });
        } else {
          setActiveSession(null);
          setLiveStatus(null);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const risk = computeDriverRiskScore(
    sessions.map((s) => ({
      start_time: s.start_time || new Date().toISOString(),
      duration: s.duration || 0,
      total_drowsiness_incidents: s.total_drowsiness_incidents || 0,
      avg_alertness_level: s.avg_alertness_level || 100,
    }))
  );
  const riskColors = getRiskColor(risk.level);

  const totalDrivingTime = sessions.reduce((s, r) => s + (r.duration || 0), 0);
  const totalAlerts = sessions.reduce((s, r) => s + (r.total_drowsiness_incidents || 0), 0);
  const avgAlertness = sessions.length > 0
    ? Math.round(sessions.reduce((s, r) => s + (r.avg_alertness_level || 100), 0) / sessions.length)
    : 100;

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const statusColor = (s: string) =>
    s === "SAFE" ? "text-green-400" : s === "CAUTION" ? "text-yellow-400" : "text-red-400";

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col pb-24">
      <header className="flex items-center gap-4 px-4 pt-6 pb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-white/70">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Driver Safety Dashboard</h1>
          <p className="text-white/40 text-xs">
            {user?.email?.split("@")[0] ?? "Driver"}
          </p>
        </div>
      </header>

      <main className="flex-1 px-4 space-y-4">
        {/* Live Status */}
        <Card className={cn("border", activeSession ? "bg-green-950 border-green-800" : "bg-slate-900 border-slate-800")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", activeSession ? "bg-green-400 animate-pulse" : "bg-slate-600")} />
              {activeSession ? "Currently Driving" : "Not Driving"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeSession && liveStatus ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className={cn("text-4xl font-bold", statusColor(liveStatus.status))}>
                    {liveStatus.alertness}%
                  </div>
                  <div className="text-white/40 text-xs">Alertness</div>
                </div>
                <div className="text-center">
                  <div className={cn("text-2xl font-bold", statusColor(liveStatus.status))}>
                    {liveStatus.status}
                  </div>
                  <div className="text-white/40 text-xs">Status</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-white">{liveStatus.drowsinessAlerts}</div>
                  <div className="text-white/40 text-xs">Alerts</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-white">{formatTime(liveStatus.tripDuration)}</div>
                  <div className="text-white/40 text-xs">Trip Duration</div>
                </div>
              </div>
            ) : (
              <p className="text-white/40 text-sm">No active driving session.</p>
            )}
          </CardContent>
        </Card>

        {/* Risk Score */}
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-blue-400" />
              <div>
                <div className="text-white/50 text-xs">Driver Risk Score</div>
                <div className={cn("text-2xl font-bold", riskColors.text)}>{risk.score}/100</div>
              </div>
            </div>
            <Badge className={cn("border", riskColors.text, riskColors.bg, riskColors.border)}>
              {risk.level}
            </Badge>
          </CardContent>
        </Card>

        {/* Today's Stats */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-white">Overall Statistics</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <StatItem icon={<Activity className="h-4 w-4 text-green-400" />} label="Avg Alertness" value={`${avgAlertness}%`} />
            <StatItem icon={<AlertTriangle className="h-4 w-4 text-red-400" />} label="Total Alerts" value={`${totalAlerts}`} />
            <StatItem icon={<Clock className="h-4 w-4 text-blue-400" />} label="Driving Time" value={formatTime(totalDrivingTime)} />
            <StatItem icon={<TrendingUp className="h-4 w-4 text-purple-400" />} label="Total Trips" value={`${sessions.length}`} />
          </CardContent>
        </Card>

        {/* Recent Sessions */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-white">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sessions.length === 0 ? (
              <p className="text-white/40 text-sm">No trips recorded yet.</p>
            ) : (
              sessions.slice(0, 5).map((s) => {
                const alertness = s.avg_alertness_level ?? 100;
                const st = alertness >= 80 ? "SAFE" : alertness >= 50 ? "CAUTION" : "DROWSY";
                return (
                  <div key={s.id} className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div>
                      <div className="text-white text-sm font-medium">
                        {s.start_time ? new Date(s.start_time).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Unknown"}
                      </div>
                      <div className="text-white/40 text-xs">
                        {formatTime(s.duration || 0)} · {s.total_drowsiness_incidents || 0} alerts
                      </div>
                    </div>
                    <span className={cn("text-xs font-bold", statusColor(st))}>{st}</span>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Button
          variant="outline"
          className="w-full border-slate-700 text-white/70"
          onClick={() => navigate("/risk-analysis")}
        >
          View Full Risk Analysis
        </Button>
      </main>
    </div>
  );
};

const StatItem = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-center gap-2">
    {icon}
    <div>
      <div className="text-white/40 text-xs">{label}</div>
      <div className="text-white font-bold">{value}</div>
    </div>
  </div>
);

export default FamilyDashboard;
