import { supabase } from '@/integrations/supabase/client';

export interface AnalyticsInsights {
  totalSessions: number;
  totalIncidents: number;
  averageSessionDuration: number;
  averageAlertness: number;
  incidentTrend: 'improving' | 'stable' | 'worsening';
  peakDrowsinessHours: number[];
  weeklyComparison: {
    thisWeek: number;
    lastWeek: number;
    percentChange: number;
  };
}

export interface SessionPattern {
  dayOfWeek: string;
  hour: number;
  incidentCount: number;
  avgAlertness: number;
}

export const analyzeUserPatterns = async (userId: string): Promise<AnalyticsInsights | null> => {
  try {
    // Fetch last 30 days of sessions
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: sessions, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('start_time', thirtyDaysAgo.toISOString())
      .order('start_time', { ascending: false });

    if (error || !sessions) {
      console.error('Error fetching sessions:', error);
      return null;
    }

    // Fetch incidents for these sessions
    const sessionIds = sessions.map(s => s.id);
    const { data: incidents } = await supabase
      .from('drowsiness_incidents')
      .select('*')
      .in('session_id', sessionIds);

    // Calculate metrics
    const totalSessions = sessions.length;
    const totalIncidents = incidents?.length || 0;
    const averageSessionDuration = sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / totalSessions || 0;
    const averageAlertness = sessions.reduce((sum, s) => sum + (s.avg_alertness_level || 0), 0) / totalSessions || 0;

    // Calculate trend (last 7 days vs previous 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const recentSessions = sessions.filter(s => new Date(s.start_time) >= sevenDaysAgo);
    const previousSessions = sessions.filter(s => 
      new Date(s.start_time) >= fourteenDaysAgo && new Date(s.start_time) < sevenDaysAgo
    );

    const recentIncidents = recentSessions.reduce((sum, s) => sum + s.total_drowsiness_incidents, 0);
    const previousIncidents = previousSessions.reduce((sum, s) => sum + s.total_drowsiness_incidents, 0);

    let incidentTrend: 'improving' | 'stable' | 'worsening' = 'stable';
    if (recentIncidents < previousIncidents * 0.8) {
      incidentTrend = 'improving';
    } else if (recentIncidents > previousIncidents * 1.2) {
      incidentTrend = 'worsening';
    }

    // Find peak drowsiness hours
    const hourCounts = new Map<number, number>();
    incidents?.forEach(incident => {
      const hour = new Date(incident.incident_time).getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    });
    const peakDrowsinessHours = Array.from(hourCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => hour);

    return {
      totalSessions,
      totalIncidents,
      averageSessionDuration,
      averageAlertness,
      incidentTrend,
      peakDrowsinessHours,
      weeklyComparison: {
        thisWeek: recentIncidents,
        lastWeek: previousIncidents,
        percentChange: previousIncidents > 0 
          ? ((recentIncidents - previousIncidents) / previousIncidents) * 100 
          : 0,
      },
    };
  } catch (error) {
    console.error('Error analyzing patterns:', error);
    return null;
  }
};

export const predictFatigueRisk = (
  timeOfDay: number,
  sessionDuration: number,
  recentAlertness: number
): 'low' | 'medium' | 'high' => {
  let riskScore = 0;

  // Time of day risk (higher risk during typical fatigue hours)
  if ((timeOfDay >= 2 && timeOfDay <= 5) || (timeOfDay >= 14 && timeOfDay <= 16)) {
    riskScore += 30;
  }

  // Session duration risk
  if (sessionDuration > 120) {
    riskScore += 30;
  } else if (sessionDuration > 60) {
    riskScore += 15;
  }

  // Recent alertness risk
  if (recentAlertness < 40) {
    riskScore += 40;
  } else if (recentAlertness < 70) {
    riskScore += 20;
  }

  if (riskScore >= 60) return 'high';
  if (riskScore >= 30) return 'medium';
  return 'low';
};

export const generateRecommendations = (insights: AnalyticsInsights): string[] => {
  const recommendations: string[] = [];

  if (insights.incidentTrend === 'worsening') {
    recommendations.push('Your drowsiness incidents are increasing. Consider shorter driving sessions or more frequent breaks.');
  }

  if (insights.averageAlertness < 60) {
    recommendations.push('Your average alertness is below optimal. Ensure adequate sleep before driving.');
  }

  if (insights.peakDrowsinessHours.length > 0) {
    const hours = insights.peakDrowsinessHours.map(h => `${h}:00`).join(', ');
    recommendations.push(`You tend to experience more drowsiness around ${hours}. Extra caution recommended during these hours.`);
  }

  if (insights.averageSessionDuration > 120) {
    recommendations.push('Your sessions average over 2 hours. Consider taking breaks every 90-120 minutes.');
  }

  if (recommendations.length === 0) {
    recommendations.push('Your driving patterns look good! Continue maintaining healthy sleep habits.');
  }

  return recommendations;
};
