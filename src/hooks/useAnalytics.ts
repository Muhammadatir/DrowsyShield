import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { analyzeUserPatterns, generateRecommendations, AnalyticsInsights } from '@/utils/analytics';

export const useAnalytics = () => {
  const { user } = useAuth();
  const [insights, setInsights] = useState<AnalyticsInsights | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        const userInsights = await analyzeUserPatterns(user.id);
        if (userInsights) {
          setInsights(userInsights);
          setRecommendations(generateRecommendations(userInsights));
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [user]);

  const refetch = async () => {
    if (!user) return;
    
    setIsLoading(true);
    const userInsights = await analyzeUserPatterns(user.id);
    if (userInsights) {
      setInsights(userInsights);
      setRecommendations(generateRecommendations(userInsights));
    }
    setIsLoading(false);
  };

  return { insights, recommendations, isLoading, refetch };
};
