// Driver Risk Analysis — AI-based scoring from historical trip data

export interface RiskAnalysis {
  score: number;           // 0-100 (higher = more risky)
  level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  insights: string[];
  recommendations: string[];
  patterns: {
    lateNightRisk: boolean;
    longTripRisk: boolean;
    frequentDrowsiness: boolean;
    improvingTrend: boolean;
  };
}

interface SessionSummary {
  start_time: string;
  duration: number;
  total_drowsiness_incidents: number;
  avg_alertness_level: number;
}

export const computeDriverRiskScore = (sessions: SessionSummary[]): RiskAnalysis => {
  if (sessions.length === 0) {
    return {
      score: 0,
      level: 'LOW',
      insights: ['No driving history available yet.'],
      recommendations: ['Start monitoring your drives to build a safety profile.'],
      patterns: { lateNightRisk: false, longTripRisk: false, frequentDrowsiness: false, improvingTrend: false },
    };
  }

  const recent = sessions.slice(0, 20); // last 20 sessions

  // --- Metrics ---
  const avgAlertness = recent.reduce((s, r) => s + (r.avg_alertness_level || 100), 0) / recent.length;
  const avgIncidents = recent.reduce((s, r) => s + (r.total_drowsiness_incidents || 0), 0) / recent.length;
  const avgDuration = recent.reduce((s, r) => s + (r.duration || 0), 0) / recent.length;

  // Late night trips (10 PM – 5 AM)
  const lateNightSessions = recent.filter(s => {
    const hour = new Date(s.start_time).getHours();
    return hour >= 22 || hour < 5;
  });
  const lateNightRisk = lateNightSessions.length > recent.length * 0.3;

  // Long trips (> 90 min)
  const longTrips = recent.filter(s => (s.duration || 0) > 5400);
  const longTripRisk = longTrips.length > recent.length * 0.3;

  // Frequent drowsiness
  const frequentDrowsiness = avgIncidents > 3;

  // Improving trend (compare first half vs second half alertness)
  const half = Math.floor(recent.length / 2);
  const olderAvg = recent.slice(half).reduce((s, r) => s + (r.avg_alertness_level || 100), 0) / Math.max(1, recent.length - half);
  const newerAvg = recent.slice(0, half).reduce((s, r) => s + (r.avg_alertness_level || 100), 0) / Math.max(1, half);
  const improvingTrend = newerAvg > olderAvg + 5;

  // --- Risk Score Calculation ---
  let score = 0;

  // Low alertness contributes most
  score += Math.max(0, (85 - avgAlertness)) * 1.5;

  // Incident frequency
  score += Math.min(30, avgIncidents * 5);

  // Late night driving
  if (lateNightRisk) score += 15;

  // Long trips without breaks
  if (longTripRisk) score += 10;

  // Improving trend reduces risk
  if (improvingTrend) score -= 10;

  score = Math.round(Math.max(0, Math.min(100, score)));

  const level: RiskAnalysis['level'] =
    score >= 70 ? 'CRITICAL' : score >= 50 ? 'HIGH' : score >= 25 ? 'MODERATE' : 'LOW';

  // --- Insights ---
  const insights: string[] = [];
  if (lateNightRisk) insights.push(`${lateNightSessions.length} of your recent trips were late-night drives (10 PM–5 AM).`);
  if (longTripRisk) insights.push(`${longTrips.length} trips exceeded 90 minutes without a break.`);
  if (frequentDrowsiness) insights.push(`Average of ${avgIncidents.toFixed(1)} drowsiness events per trip detected.`);
  if (avgAlertness < 75) insights.push(`Average alertness of ${avgAlertness.toFixed(0)}% is below the safe threshold.`);
  if (improvingTrend) insights.push('Your alertness has been improving over recent trips. Keep it up!');
  if (insights.length === 0) insights.push('Your driving patterns look safe. Maintain good habits.');

  // --- Recommendations ---
  const recommendations: string[] = [];
  if (lateNightRisk) recommendations.push('Avoid driving between 10 PM and 5 AM when possible.');
  if (longTripRisk) recommendations.push('Take a 15-minute break every 90 minutes on long trips.');
  if (frequentDrowsiness) recommendations.push('Consider getting more sleep before driving.');
  if (avgAlertness < 75) recommendations.push('Your alertness is consistently low — consult a doctor if this persists.');
  if (recommendations.length === 0) recommendations.push('Continue your safe driving habits and stay hydrated.');

  return {
    score,
    level,
    insights,
    recommendations,
    patterns: { lateNightRisk, longTripRisk, frequentDrowsiness, improvingTrend },
  };
};

export const getRiskColor = (level: RiskAnalysis['level']) => {
  switch (level) {
    case 'LOW': return { text: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500' };
    case 'MODERATE': return { text: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500' };
    case 'HIGH': return { text: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500' };
    case 'CRITICAL': return { text: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500' };
  }
};
