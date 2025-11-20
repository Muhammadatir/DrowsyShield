import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Trash2, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { SessionCard } from "@/components/history/SessionCard";
import { SessionDetailDialog } from "@/components/history/SessionDetailDialog";
import { exportSessionsToCSV, exportSessionsToJSON } from "@/utils/dataExport";
import { useSessionData } from "@/hooks/useSessionData";
import type { SessionData } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const History = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'alerts'>('recent');
  
  const { sessions, isLoading, deleteSession } = useSessionData();

  const sortedSessions = [...sessions].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.start_time).getTime() - new Date(a.start_time).getTime();
      case 'oldest':
        return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
      case 'alerts':
        return b.total_drowsiness_incidents - a.total_drowsiness_incidents;
      default:
        return 0;
    }
  });

  const handleSessionClick = (session: SessionData) => {
    setSelectedSession(session);
    setDialogOpen(true);
  };

  const handleExportCSV = () => {
    exportSessionsToCSV(sessions);
    toast({
      title: "Export Successful",
      description: "Sessions exported to CSV",
    });
  };

  const handleExportJSON = () => {
    exportSessionsToJSON(sessions);
    toast({
      title: "Export Successful",
      description: "Sessions exported to JSON",
    });
  };

  const handleClearHistory = async () => {
    for (const session of sessions) {
      await deleteSession(session.id);
    }
    toast({
      title: "History Cleared",
      description: "All session history has been removed",
    });
  };

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
        <h1 className="text-xl font-bold">Session History</h1>
        <div className="w-10" />
      </header>

      {sessions.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-semibold mb-2">No Sessions Yet</p>
            <p className="text-muted-foreground mb-4">
              Start monitoring to see your driving sessions here
            </p>
            <Button onClick={() => navigate("/monitor")}>
              Start Monitoring
            </Button>
          </div>
        </div>
      ) : (
        <main className="app-main">
          {/* Controls */}
          <div className="flex gap-2 items-center">
            <div className="flex items-center gap-2 flex-1">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="alerts">Most Alerts</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleExportCSV}
              >
                <Download className="mr-2 h-4 w-4" />
                CSV
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleExportJSON}
              >
                <Download className="mr-2 h-4 w-4" />
                JSON
              </Button>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Total Sessions</p>
              <p className="text-2xl font-bold">{sessions.length}</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Total Alerts</p>
              <p className="text-2xl font-bold">
                {sessions.reduce((sum, s) => sum + s.total_drowsiness_incidents, 0)}
              </p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Avg Alertness</p>
              <p className="text-2xl font-bold">
                {sessions.length > 0 ? Math.round(
                  sessions.reduce((sum, s) => sum + (s.avg_alertness_level || 100), 0) / sessions.length
                ) : 0}%
              </p>
            </div>
          </div>

          {/* Session List */}
          <div className="space-y-2">
            {sortedSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onClick={() => handleSessionClick(session)}
              />
            ))}
          </div>

          {/* Clear History */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <Trash2 className="mr-2 h-4 w-4" />
                Clear All History
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear All History?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all {sessions.length} session(s). This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearHistory}>
                  Clear History
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </main>
      )}

      <SessionDetailDialog
        session={selectedSession}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
};

export default History;
