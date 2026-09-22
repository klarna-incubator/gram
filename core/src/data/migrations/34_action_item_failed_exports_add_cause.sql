ALTER TABLE action_item_failed_exports
  ADD COLUMN IF NOT EXISTS cause text;
