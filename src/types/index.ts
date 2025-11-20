export interface DrowsinessIncident {
  timestamp: Date;
  severity: 'low' | 'medium' | 'high';
  duration: number;
  alertTriggered: boolean;
}

export interface SessionData {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  drowsinessCount: number;
  status: 'active' | 'completed';
  incidents: DrowsinessIncident[];
  averageAlertness: number;
  maxEyeClosureDuration: number;
}

export interface MonitoringStatus {
  isMonitoring: boolean;
  sessionStartTime?: Date;
  drowsinessCount: number;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}
