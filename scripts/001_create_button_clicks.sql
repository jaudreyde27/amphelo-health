-- Create table to track button clicks for analytics
CREATE TABLE IF NOT EXISTS public.button_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  button_id TEXT NOT NULL,
  visitor_id TEXT,
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries by button_id and date
CREATE INDEX IF NOT EXISTS idx_button_clicks_button_id ON public.button_clicks(button_id);
CREATE INDEX IF NOT EXISTS idx_button_clicks_created_at ON public.button_clicks(created_at);

-- Enable RLS
ALTER TABLE public.button_clicks ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (for tracking without auth)
CREATE POLICY "Allow anonymous inserts" ON public.button_clicks
  FOR INSERT
  WITH CHECK (true);

-- Only allow service role to read (for analytics)
CREATE POLICY "Allow service role to read" ON public.button_clicks
  FOR SELECT
  USING (auth.role() = 'service_role');
