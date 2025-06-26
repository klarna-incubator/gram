-- Create users table
CREATE TABLE IF NOT EXISTS oidc_users (
  sub VARCHAR(512) PRIMARY KEY,
  email VARCHAR(512),
  name VARCHAR(512),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create user groups table
CREATE TABLE IF NOT EXISTS oidc_user_groups (
  id SERIAL PRIMARY KEY,
  sub VARCHAR(512) NOT NULL,
  group_name VARCHAR(512) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sub) REFERENCES oidc_users(sub) ON DELETE CASCADE,
  UNIQUE(sub, group_name)
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_oidc_users_email ON oidc_users(email);
CREATE INDEX IF NOT EXISTS idx_oidc_user_groups_sub ON oidc_user_groups(sub);
CREATE INDEX IF NOT EXISTS idx_oidc_user_groups_group_name ON oidc_user_groups(group_name);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_oidc_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update the updated_at field
CREATE TRIGGER update_oidc_users_updated_at
  BEFORE UPDATE ON oidc_users
  FOR EACH ROW
  EXECUTE FUNCTION update_oidc_users_updated_at(); 