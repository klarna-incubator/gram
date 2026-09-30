ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS provider_ref text,
  ADD COLUMN IF NOT EXISTS confirmation_attempts integer NOT NULL DEFAULT 0;
