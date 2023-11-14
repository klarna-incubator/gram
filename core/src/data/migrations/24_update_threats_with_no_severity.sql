UPDATE threats
SET severity = 'low' WHERE is_action_item = true and severity = null;
