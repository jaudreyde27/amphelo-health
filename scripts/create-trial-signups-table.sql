-- Create trial_signups table
CREATE TABLE IF NOT EXISTS trial_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  country VARCHAR(50) NOT NULL,
  zipcode VARCHAR(20),
  user_type VARCHAR(50) NOT NULL,
  is_design_partner BOOLEAN DEFAULT FALSE,
  phone VARCHAR(20),
  best_time_to_reach VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_trial_signups_email ON trial_signups(email);

-- Enable RLS
ALTER TABLE trial_signups ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (for trial signups)
CREATE POLICY "Allow public inserts on trial_signups" ON trial_signups
  FOR INSERT TO anon
  WITH CHECK (true);
