import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldAlert, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSessionData } from "@/hooks/useSessionData";
import { computeDriverRiskScore, getRiskColor } from "@/utils/riskAnalysis";
import { cn } from "@/lib/utils";

const RiskAnalysis = () => {
  const navigate = useNavigate();
  const { sessions, isLoading } = useSessionData();

  const risk = computeDriverRiskScore(
    sessions.map((s) => ({
      start_time: s.start_time || new Date().toISOString(),
      duration: s.duration || 0,
      total_drowsiness_incidents: s.total_drowsiness_incidents || 0,
      avg_alertness_level: s.avg_alertness_level || 100,
    }))
  );

  const colors = getRiskColor(risk.level);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col pb-24">
      <header className="flex items-center gap-4 px-4 pt-6 pb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-white/70">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-bold">Driver Risk Analysis</h1>
      </header>

      <main className="flex-1 px-4 space-y-4">
        {/* Risk Score Card */}
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6 flex flex-col items-center">
            <div className={cn("text-7xl font-bold mb-2", colors.text)}>{risk.score}</div>
            <div className="text-white/50 text-sm mb-3">Driver Risk Score / 100</div>
            <Badge className={cn("text-sm px-4 py-1 border", colors.text, colors.bg, colors.border)}>
              {risk.level} RISK
            </Badge>
            <p className="text-white/40 text-xs text-center mt-3">
              Based on {sessions.length} recorded trip{sessions.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        {/* Risk Patterns */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-white flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-orange-400" /> Risk Patterns
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <PatternRow
              label="Late-Night Driving"
              active={risk.patterns.lateNightRisk}
              activeText="Detected"
              safeText="Not detected"
            />
            <PatternRow
              label="Long Trips (>90 min)"
              active={risk.patterns.longTripRisk}
              activeText="Detected"
              safeText="Not detected"
            />
            <PatternRow
              label="Frequent Drowsiness"
              active={risk.patterns.frequentDrowsiness}
              activeText="Detected"
              safeText="Normal"
            />
            <PatternRow
              label="Alertness Trend"
              active={!risk.patterns.improvingTrend}
              activeText="Declining"
              safeText="Improving ↑"
              invertColor
            />
          </CardContent>
        </Card>

        {/* Insights */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-white flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-400" /> Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {risk.insights.map((insight, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-white/70">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                {insight}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-white flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" /> Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {risk.recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-white/70">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2 flex-shrink-0" />
                {rec}
              </div>
            ))}
          </CardContent>
        </Card>

        <p className="text-white/20 text-xs text-center px-4">
          ⚠️ DrowsyShield is an assistive safety tool, not a medical device. Always prioritize rest and safe driving practices.
        </p>
      </main>
    </div>
  );
};

const PatternRow = ({
  label, active, activeText, safeText, invertColor,
}: {
  label: string; active: boolean; activeText: string; safeText: string; invertColor?: boolean;
}) => {
  const isWarning = invertColor ? !active : active;
  return (
    <div className="flex items-center justify-between">
      <span className="text-white/60 text-sm">{label}</span>
      <span className={cn("text-sm font-semibold", isWarning ? "text-orange-400" : "text-green-400")}>
        {active ? activeText : safeText}
      </span>
    </div>
  );
};

export default RiskAnalysis;
