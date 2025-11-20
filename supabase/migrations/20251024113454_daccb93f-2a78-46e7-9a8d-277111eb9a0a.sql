-- Enable realtime for sessions and drowsiness_incidents tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.drowsiness_incidents;

-- Create storage bucket for configuration backups
INSERT INTO storage.buckets (id, name, public) 
VALUES ('user-backups', 'user-backups', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for user backups
CREATE POLICY "Users can upload their own backups"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'user-backups' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own backups"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'user-backups' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own backups"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'user-backups' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own backups"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'user-backups' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sessions_user_start_time 
ON public.sessions(user_id, start_time DESC);

CREATE INDEX IF NOT EXISTS idx_incidents_session_time 
ON public.drowsiness_incidents(session_id, incident_time DESC);

CREATE INDEX IF NOT EXISTS idx_incidents_user_time 
ON public.drowsiness_incidents(user_id, incident_time DESC);

-- Create function for batch session statistics
CREATE OR REPLACE FUNCTION get_user_session_stats(user_uuid UUID, days_back INTEGER DEFAULT 30)
RETURNS TABLE (
  total_sessions BIGINT,
  total_incidents BIGINT,
  avg_duration NUMERIC,
  avg_alertness NUMERIC,
  max_alertness INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT s.id)::BIGINT as total_sessions,
    COALESCE(SUM(s.total_drowsiness_incidents), 0)::BIGINT as total_incidents,
    COALESCE(AVG(s.duration), 0)::NUMERIC as avg_duration,
    COALESCE(AVG(s.avg_alertness_level), 0)::NUMERIC as avg_alertness,
    COALESCE(MAX(s.max_alertness_level), 0)::INTEGER as max_alertness
  FROM public.sessions s
  WHERE s.user_id = user_uuid
    AND s.start_time >= NOW() - (days_back || ' days')::INTERVAL;
END;
$$;