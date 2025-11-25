-- Add KPI scoring fields to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS estimated_hours FLOAT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS actual_hours FLOAT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS started_at TIMESTAMP;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS complexity VARCHAR(20) DEFAULT 'medium';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS proofs JSONB DEFAULT '[]';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS auto_checks JSONB DEFAULT '{}';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS required_checks INTEGER DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS peer_reviews JSONB DEFAULT '[]';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS quality_score FLOAT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS penalty_pct FLOAT DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS task_score FLOAT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS manager_approved BOOLEAN DEFAULT false;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS manager_approved_at TIMESTAMP;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_to UUID;

-- Create audit log table
CREATE TABLE IF NOT EXISTS task_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL,
  user_id UUID NOT NULL,
  event VARCHAR(100) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  timestamp TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_task_audit_log_task_id ON task_audit_log(task_id);
CREATE INDEX IF NOT EXISTS idx_task_audit_log_user_id ON task_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_completed_at ON tasks(completed_at);
