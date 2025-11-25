-- =====================================================
-- TRIVERSE ERP - COMPLETE KPI SYSTEM MIGRATION
-- Date: 2025-11-25
-- =====================================================

-- =====================================================
-- 1. ENHANCED EMPLOYEE_TASKS TABLE (Task Assignment & Tracking)
-- =====================================================
ALTER TABLE employee_tasks 
  ADD COLUMN IF NOT EXISTS assigned_to UUID,
  ADD COLUMN IF NOT EXISTS created_by UUID,
  ADD COLUMN IF NOT EXISTS estimated_hours DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS actual_hours DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS complexity VARCHAR(20) DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS deadline TIMESTAMP,
  ADD COLUMN IF NOT EXISTS proofs JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS auto_checks JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS required_checks INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS peer_reviews JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS quality_score DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS penalty_pct DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS task_score DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS manager_approved BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS manager_approved_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS manager_id UUID;

-- Add foreign key constraints
ALTER TABLE employee_tasks 
  ADD CONSTRAINT fk_assigned_to FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_manager_id FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL;

-- Update task_status enum to include new states
ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'submitted';
ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'approved';
ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'rejected';

-- Add complexity enum
DO $$ BEGIN
  CREATE TYPE task_complexity AS ENUM ('trivial', 'small', 'medium', 'complex', 'critical');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE employee_tasks 
  ALTER COLUMN complexity TYPE task_complexity USING complexity::task_complexity;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON employee_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON employee_tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_manager_id ON employee_tasks(manager_id);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON employee_tasks(deadline);
CREATE INDEX IF NOT EXISTS idx_tasks_complexity ON employee_tasks(complexity);
CREATE INDEX IF NOT EXISTS idx_tasks_submitted_at ON employee_tasks(submitted_at);
CREATE INDEX IF NOT EXISTS idx_tasks_task_score ON employee_tasks(task_score);

-- =====================================================
-- 2. ENHANCED EMPLOYEE_PROFILES (Manager Hierarchy)
-- =====================================================
-- Already has reporting_to_id, just add indexes
CREATE INDEX IF NOT EXISTS idx_employee_profiles_reporting_to ON employee_profiles(reporting_to_id);
CREATE INDEX IF NOT EXISTS idx_employee_profiles_designation ON employee_profiles(designation);

-- =====================================================
-- 3. EMPLOYEE KPI HISTORY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS employee_kpi_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_tasks INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  avg_task_score DECIMAL(5,2),
  normalized_score DECIMAL(5,2),
  percentile DECIMAL(5,2),
  role_mean DECIMAL(5,2),
  role_stddev DECIMAL(5,2),
  timeliness_score DECIMAL(5,2),
  quality_score DECIMAL(5,2),
  effort_accuracy_score DECIMAL(5,2),
  peer_score DECIMAL(5,2),
  gaming_penalty_total DECIMAL(5,2),
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_kpi_history_employee ON employee_kpi_history(employee_id, period_end DESC);
CREATE INDEX idx_kpi_history_company ON employee_kpi_history(company_id, period_end DESC);
CREATE INDEX idx_kpi_history_period ON employee_kpi_history(period_start, period_end);

-- =====================================================
-- 4. ROLE KPI CONFIGURATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS role_kpi_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role VARCHAR(50) NOT NULL UNIQUE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  timeliness_weight DECIMAL(3,2) DEFAULT 0.25,
  quality_weight DECIMAL(3,2) DEFAULT 0.35,
  effort_accuracy_weight DECIMAL(3,2) DEFAULT 0.15,
  peer_review_weight DECIMAL(3,2) DEFAULT 0.15,
  auto_verification_weight DECIMAL(3,2) DEFAULT 0.10,
  complexity_multipliers JSONB DEFAULT '{"trivial": 0.8, "small": 1.0, "medium": 1.2, "complex": 1.4, "critical": 1.6}'::jsonb,
  min_proof_requirements JSONB DEFAULT '{"medium": 1, "complex": 2, "critical": 3}'::jsonb,
  gaming_detection_rules JSONB DEFAULT '{"min_completion_pct": 5, "min_duration_minutes": 5}'::jsonb,
  normalization_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default configurations for all roles
INSERT INTO role_kpi_configs (role, company_id) 
SELECT DISTINCT 
  unnest(enum_range(NULL::user_role_type))::VARCHAR,
  NULL
ON CONFLICT (role) DO NOTHING;

-- =====================================================
-- 5. TASK AUDIT LOG TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS task_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES employee_tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event VARCHAR(50) NOT NULL,
  old_value JSONB,
  new_value JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_task_id ON task_audit_logs(task_id, timestamp DESC);
CREATE INDEX idx_audit_user_id ON task_audit_logs(user_id);
CREATE INDEX idx_audit_event ON task_audit_logs(event);
CREATE INDEX idx_audit_timestamp ON task_audit_logs(timestamp DESC);

-- =====================================================
-- 6. TASK PROOFS TABLE (Evidence Storage)
-- =====================================================
CREATE TABLE IF NOT EXISTS task_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES employee_tasks(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_type VARCHAR(50),
  file_size BIGINT,
  description TEXT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_proofs_task_id ON task_proofs(task_id);
CREATE INDEX idx_proofs_uploaded_by ON task_proofs(uploaded_by);

-- =====================================================
-- 7. NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id, read, created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- =====================================================
-- 8. NOTIFICATION SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  task_assigned BOOLEAN DEFAULT TRUE,
  task_submitted BOOLEAN DEFAULT TRUE,
  task_approved BOOLEAN DEFAULT TRUE,
  task_rejected BOOLEAN DEFAULT TRUE,
  task_deadline_near BOOLEAN DEFAULT TRUE,
  kpi_published BOOLEAN DEFAULT TRUE,
  email_enabled BOOLEAN DEFAULT TRUE,
  push_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 9. TEAM STRUCTURE VIEW (Manager Hierarchy)
-- =====================================================
CREATE OR REPLACE VIEW team_hierarchy AS
WITH RECURSIVE team_tree AS (
  -- Base case: all employees
  SELECT 
    ep.id,
    ep.user_id,
    ep.employee_id,
    ep.designation,
    ep.department,
    ep.role,
    ep.reporting_to_id,
    u.first_name,
    u.last_name,
    u.email,
    1 as level,
    ARRAY[ep.id] as path
  FROM employee_profiles ep
  JOIN users u ON ep.user_id = u.id
  WHERE ep.reporting_to_id IS NULL
  
  UNION ALL
  
  -- Recursive case: employees reporting to someone
  SELECT 
    ep.id,
    ep.user_id,
    ep.employee_id,
    ep.designation,
    ep.department,
    ep.role,
    ep.reporting_to_id,
    u.first_name,
    u.last_name,
    u.email,
    tt.level + 1,
    tt.path || ep.id
  FROM employee_profiles ep
  JOIN users u ON ep.user_id = u.id
  JOIN team_tree tt ON ep.reporting_to_id = tt.id
  WHERE NOT ep.id = ANY(tt.path) -- Prevent cycles
)
SELECT * FROM team_tree;

-- =====================================================
-- 10. KPI CALCULATION VIEW
-- =====================================================
CREATE OR REPLACE VIEW employee_kpi_summary AS
SELECT 
  u.id as user_id,
  u.first_name || ' ' || u.last_name as employee_name,
  ep.employee_id,
  ep.designation,
  ep.department,
  ep.role,
  COUNT(et.id) as total_tasks,
  COUNT(et.id) FILTER (WHERE et.status = 'completed') as completed_tasks,
  COUNT(et.id) FILTER (WHERE et.status = 'approved') as approved_tasks,
  ROUND(AVG(et.task_score), 2) as avg_task_score,
  ROUND(AVG(et.quality_score), 2) as avg_quality_score,
  ROUND(AVG(et.penalty_pct), 2) as avg_penalty,
  SUM(et.estimated_hours) as total_estimated_hours,
  SUM(et.actual_hours) as total_actual_hours,
  COUNT(et.id) FILTER (WHERE et.completed_at <= et.deadline) as on_time_completions,
  COUNT(et.id) FILTER (WHERE et.completed_at > et.deadline) as late_completions,
  ROUND(
    COUNT(et.id) FILTER (WHERE et.completed_at <= et.deadline)::DECIMAL * 100 / 
    NULLIF(COUNT(et.id) FILTER (WHERE et.completed_at IS NOT NULL), 0),
    2
  ) as on_time_percentage
FROM users u
LEFT JOIN employee_profiles ep ON u.id = ep.user_id
LEFT JOIN employee_tasks et ON u.id = et.assigned_to
WHERE u.deleted_at IS NULL
GROUP BY u.id, u.first_name, u.last_name, ep.employee_id, ep.designation, ep.department, ep.role;

-- =====================================================
-- 11. TRIGGERS FOR AUTO-TIMESTAMPING
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_employee_kpi_history_updated_at 
  BEFORE UPDATE ON employee_kpi_history 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_role_kpi_configs_updated_at 
  BEFORE UPDATE ON role_kpi_configs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_settings_updated_at 
  BEFORE UPDATE ON notification_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 12. FUNCTION TO LOG TASK CHANGES
-- =====================================================
CREATE OR REPLACE FUNCTION log_task_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO task_audit_logs (task_id, user_id, event, old_value, new_value)
  VALUES (
    NEW.id,
    NEW.updated_at::TEXT::UUID, -- This should be set by application
    TG_OP,
    CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
    to_jsonb(NEW)
  );
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER audit_task_changes
  AFTER INSERT OR UPDATE ON employee_tasks
  FOR EACH ROW EXECUTE FUNCTION log_task_changes();

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
