ALTER TABLE reviews
ADD COLUMN requested_at timestamp with time zone null;

ALTER TABLE reviews
ADD COLUMN requested_reminder_sent_count integer NOT NULL DEFAULT 0;

UPDATE reviews
SET requested_at=created_at
WHERE requested_at IS NULL;

