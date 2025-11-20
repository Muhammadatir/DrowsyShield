import type { SessionData } from "@/types";

export const exportSessionsToCSV = (sessions: SessionData[]): void => {
  const headers = ['Date', 'Start Time', 'Duration (min)', 'Drowsiness Alerts', 'Average Alertness', 'Status'];
  
  const rows = sessions.map(session => {
    const startDate = new Date(session.startTime);
    return [
      startDate.toLocaleDateString(),
      startDate.toLocaleTimeString(),
      Math.round(session.duration / 60),
      session.drowsinessCount,
      session.averageAlertness || 100,
      session.status,
    ].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');
  downloadFile(csv, 'drowsyguard-sessions.csv', 'text/csv');
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
