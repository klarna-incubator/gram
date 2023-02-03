ALTER TABLE reviews
ADD COLUMN meeting_requested_at timestamp with time zone null;

ALTER TABLE reviews
ADD COLUMN meeting_requested_reminder_sent_count integer NOT NULL DEFAULT 0;

UPDATE reviews
SET meeting_requested_at=updated_at
WHERE status='meeting-requested' and meeting_requested_at IS NULL;