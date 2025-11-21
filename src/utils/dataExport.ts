import type { SessionData } from "@/types";

export const exportSessionsToCSV = (sessions: any[]): void => {
  const headers = ['Date', 'Start Time', 'End Time', 'Duration (min)', 'Duration (sec)', 'Drowsiness Alerts', 'Average Alertness', 'Status'];
  
  const rows = sessions.map(session => {
    // Handle different possible date formats
    let startDate: Date;
    let endDate: Date | null = null;
    
    try {
      // Try parsing start_time (from database) or startTime (from types)
      const startTimeStr = session.start_time || session.startTime;
      startDate = new Date(startTimeStr);
      
      // Check if date is valid
      if (isNaN(startDate.getTime())) {
        startDate = new Date(); // Fallback to current date
      }
      
      // Try parsing end_time
      const endTimeStr = session.end_time || session.endTime;
      if (endTimeStr) {
        endDate = new Date(endTimeStr);
        if (isNaN(endDate.getTime())) {
          endDate = null;
        }
      }
    } catch (error) {
      console.error('Error parsing session dates:', error);
      startDate = new Date();
    }
    
    const duration = session.duration || 0;
    const drowsinessCount = session.total_drowsiness_incidents || session.drowsinessCount || 0;
    const avgAlertness = session.avg_alertness_level || session.averageAlertness || 100;
    const status = endDate ? 'Completed' : 'Active';
    
    return [
      startDate.toLocaleDateString('en-US'),
      startDate.toLocaleTimeString('en-US'),
      endDate ? endDate.toLocaleTimeString('en-US') : 'N/A',
      Math.round(duration / 60),
      duration,
      drowsinessCount,
      Math.round(avgAlertness),
      status,
    ].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');
  downloadFile(csv, 'drowsyshield-sessions.csv', 'text/csv');
};

export const exportSessionsToJSON = (sessions: SessionData[]): void => {
  const json = JSON.stringify(sessions, null, 2);
  downloadFile(json, 'drowsyguard-sessions.json', 'application/json');
};

export const exportSessionToJSON = (session: SessionData): void => {
  const json = JSON.stringify(session, null, 2);
  downloadFile(json, `drowsyguard-session-${session.id}.json`, 'application/json');
};

const downloadFile = (content: string, filename: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
