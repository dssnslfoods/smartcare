-- Add action_items and cost_items JSONB columns to complaints table
-- action_items: [{measure, responsible, due_date}]
-- cost_items: [{item_name, amount}]

ALTER TABLE complaints
  ADD COLUMN IF NOT EXISTS action_items JSONB,
  ADD COLUMN IF NOT EXISTS cost_items JSONB;
