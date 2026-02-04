-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  "appName" TEXT DEFAULT 'TriVerse ERP/CRM',
  language TEXT DEFAULT 'en',
  country TEXT DEFAULT 'India',
  "dateFormat" TEXT DEFAULT 'DD/MM/YYYY',
  timezone TEXT DEFAULT 'Asia/Kolkata',
  currency TEXT DEFAULT 'INR',
  "smtpHost" TEXT,
  "smtpPort" INTEGER DEFAULT 587,
  "smtpUsername" TEXT,
  "smtpPassword" TEXT,
  "fromEmail" TEXT,
  "fromName" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  CONSTRAINT settings_single_row CHECK (id = 1)
);

-- Insert default settings
INSERT INTO settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
