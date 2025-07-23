-- Create shared_proposals table
CREATE TABLE IF NOT EXISTS shared_proposals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  share_token VARCHAR(255) UNIQUE NOT NULL,
  proposal_data JSONB NOT NULL,
  lead_name VARCHAR(255) NOT NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMP WITH TIME ZONE
);

-- Create proposal_views table for tracking access logs
CREATE TABLE IF NOT EXISTS proposal_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shared_proposal_id UUID REFERENCES shared_proposals(id) ON DELETE CASCADE,
  ip_address INET,
  user_agent TEXT,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_duration INTEGER, -- in seconds
  referrer TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shared_proposals_token ON shared_proposals(share_token);
CREATE INDEX IF NOT EXISTS idx_shared_proposals_created_by ON shared_proposals(created_by);
CREATE INDEX IF NOT EXISTS idx_shared_proposals_expires_at ON shared_proposals(expires_at);
CREATE INDEX IF NOT EXISTS idx_proposal_views_shared_proposal_id ON proposal_views(shared_proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_views_viewed_at ON proposal_views(viewed_at);

-- Add RLS (Row Level Security)
ALTER TABLE shared_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_views ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to create shared proposals
CREATE POLICY "Allow authenticated users to create shared proposals" ON shared_proposals
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

-- Create policy to allow authenticated users to read their own shared proposals
CREATE POLICY "Allow users to read their own shared proposals" ON shared_proposals
  FOR SELECT TO authenticated USING (created_by = auth.uid());

-- Create policy to allow authenticated users to update their own shared proposals
CREATE POLICY "Allow users to update their own shared proposals" ON shared_proposals
  FOR UPDATE TO authenticated USING (created_by = auth.uid());

-- Create policy to allow public access to active, non-expired shared proposals
CREATE POLICY "Allow public access to active shared proposals" ON shared_proposals
  FOR SELECT TO anon USING (
    is_active = true AND 
    expires_at > NOW()
  );

-- Create policy to allow public access to proposal views
CREATE POLICY "Allow public access to create proposal views" ON proposal_views
  FOR INSERT TO anon WITH CHECK (true);

-- Create policy to allow authenticated users to read proposal views for their proposals
CREATE POLICY "Allow users to read views for their proposals" ON proposal_views
  FOR SELECT TO authenticated USING (
    shared_proposal_id IN (
      SELECT id FROM shared_proposals WHERE created_by = auth.uid()
    )
  );

-- Create function to generate unique share token
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS TEXT AS $$
DECLARE
  token TEXT;
  exists_token BOOLEAN;
BEGIN
  LOOP
    -- Generate a random token (8 characters)
    token := encode(gen_random_bytes(6), 'base64');
    token := replace(replace(replace(token, '/', '_'), '+', '-'), '=', '');
    token := substring(token from 1 for 8);
    
    -- Check if token already exists
    SELECT EXISTS(SELECT 1 FROM shared_proposals WHERE share_token = token) INTO exists_token;
    
    -- If token doesn't exist, break the loop
    IF NOT exists_token THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN token;
END;
$$ LANGUAGE plpgsql;

-- Create function to update view count
CREATE OR REPLACE FUNCTION increment_view_count(proposal_token TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE shared_proposals 
  SET 
    view_count = view_count + 1,
    last_viewed_at = NOW()
  WHERE share_token = proposal_token;
END;
$$ LANGUAGE plpgsql;

-- Create function to clean up expired proposals (can be called by a cron job)
CREATE OR REPLACE FUNCTION cleanup_expired_proposals()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM shared_proposals 
  WHERE expires_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;