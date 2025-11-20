import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Settings, Eye, Shield, Zap, BarChart3, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusIndicator } from "@/components/home/StatusIndicator";
import { StartStopButton } from "@/components/home/StartStopButton";
import { SessionTimer } from "@/components/home/SessionTimer";
import { LastSessionCard } from "@/components/home/LastSessionCard";
import { EmergencyButton } from "@/components/home/EmergencyButton";
import type { MonitoringStatus } from "@/types";

const Home = () => {
  const navigate = useNavigate();
  const [monitoringStatus, setMonitoringStatus] = useState<MonitoringStatus>({
    isMonitoring: false,
    drowsinessCount: 0,
  });
  const [isVisible, setIsVisible] = useState(false);
  const [stats, setStats] = useState({ users: 0, alerts: 0, accuracy: 0 });

  useEffect(() => {
    setIsVisible(true);
    // Animate stats counter
    const timer = setTimeout(() => {
      setStats({ users: 50000, alerts: 1200000, accuracy: 99 });
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleToggleMonitoring = () => {
    if (monitoringStatus.isMonitoring) {
      // Stop monitoring
      setMonitoringStatus({
        isMonitoring: false,
        drowsinessCount: 0,
      });
    } else {
      // Start monitoring - navigate to monitor screen
      navigate("/monitor");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-2000"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 flex justify-between items-center p-6">
        <div className={`flex items-center gap-3 transition-all duration-1000 ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'}`}>
          <div className="relative">
            <img src="/logo.jpg" alt="DrowsyShield Logo" className="w-12 h-12 rounded-lg shadow-lg shadow-blue-500/50" />
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg blur opacity-30 animate-pulse"></div>
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              DrowsyShield
            </h1>
            <p className="text-sm text-blue-300 animate-pulse">Stay Awake. Stay Alive.</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/settings")}
          className="text-blue-300 hover:text-white hover:bg-blue-500/20 transition-all duration-300"
        >
          <Settings className="h-6 w-6" />
        </Button>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center px-6 py-12">
        {/* AI Eye Animation */}
        <div className={`relative mb-8 transition-all duration-2000 ${isVisible ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
          <div className="w-32 h-32 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 p-1 animate-spin-slow">
            <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
              <Eye className="w-16 h-16 text-blue-400 animate-pulse" />
            </div>
          </div>
          {/* Radar Waves */}
          <div className="absolute inset-0 rounded-full border-2 border-blue-400/30 animate-ping"></div>
          <div className="absolute inset-0 rounded-full border-2 border-purple-400/20 animate-ping delay-1000"></div>
        </div>

        {/* Main CTA */}
        <div className={`text-center mb-12 transition-all duration-1500 delay-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-blue-300 bg-clip-text text-transparent">
            AI-Powered Safety
          </h2>
          <p className="text-blue-200 mb-8 max-w-sm mx-auto">
            Advanced drowsiness detection with real-time alerts and voice assistance
          </p>
          
          <StartStopButton
            isMonitoring={monitoringStatus.isMonitoring}
            onToggle={handleToggleMonitoring}
          />
        </div>

        {/* Features Grid */}
        <div className={`grid grid-cols-2 gap-4 w-full max-w-md mb-8 transition-all duration-1500 delay-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105">
            <CardContent className="p-4 text-center">
              <Eye className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <h3 className="font-semibold text-white">Eye Tracking</h3>
              <p className="text-xs text-blue-200">Real-time detection</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105">
            <CardContent className="p-4 text-center">
              <Zap className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <h3 className="font-semibold text-white">Voice Alerts</h3>
              <p className="text-xs text-blue-200">Smart assistance</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105">
            <CardContent className="p-4 text-center">
              <BarChart3 className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
              <h3 className="font-semibold text-white">Analytics</h3>
              <p className="text-xs text-blue-200">Trip insights</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105">
            <CardContent className="p-4 text-center">
              <Shield className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <h3 className="font-semibold text-white">Safety Score</h3>
              <p className="text-xs text-blue-200">Gamified reports</p>
            </CardContent>
          </Card>
        </div>

        {/* Animated Stats */}
        <div className={`grid grid-cols-3 gap-6 w-full max-w-md transition-all duration-2000 delay-1500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{stats.users.toLocaleString()}+</div>
            <div className="text-xs text-blue-200">Users Protected</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">{stats.alerts.toLocaleString()}+</div>
            <div className="text-xs text-blue-200">Alerts Sent</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-cyan-400">{stats.accuracy}%</div>
            <div className="text-xs text-blue-200">Accuracy</div>
          </div>
        </div>
      </main>

      {/* Bottom Section */}
      <div className="relative z-10 px-6 pb-24">
        <div className={`space-y-4 transition-all duration-1500 delay-2000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <LastSessionCard />
          <EmergencyButton />
        </div>
      </div>

      <style jsx>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Home;
