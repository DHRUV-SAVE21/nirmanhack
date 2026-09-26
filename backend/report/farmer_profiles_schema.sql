-- ============================================================
--  ANNADATA SAATHI — Farmer Profiles Table
--  Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Create the farmer_profiles table
CREATE TABLE IF NOT EXISTS farmer_profiles (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             TEXT        NOT NULL,           -- from auth users table
    farmer_name         TEXT        NOT NULL,
    farm_size           TEXT,                           -- e.g. "2.5 Acres"
    soil_type           TEXT,                           -- e.g. "Black Cotton", "Alluvial"
    gps                 TEXT        DEFAULT 'N/A',
    irrigation_status   BOOLEAN     DEFAULT TRUE,
    role                TEXT        DEFAULT 'farmer'    CHECK (role IN ('farmer', 'visitor', 'admin')),
    state               TEXT,                           -- optional: Maharashtra, UP etc.
    district            TEXT,                           -- optional
    village             TEXT,                           -- optional
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_farmer_profiles_user_id  ON farmer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_farmer_profiles_created  ON farmer_profiles(created_at DESC);

-- 3. Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_farmer_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

DROP TRIGGER IF EXISTS trg_farmer_profiles_updated_at ON farmer_profiles;
CREATE TRIGGER trg_farmer_profiles_updated_at
    BEFORE UPDATE ON farmer_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_farmer_profiles_updated_at();

-- 4. Row Level Security (optional but recommended)
ALTER TABLE farmer_profiles ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated operations (adjust as needed)
CREATE POLICY "Public read-write for now"
    ON farmer_profiles FOR ALL
    USING (true)
    WITH CHECK (true);

-- 5. Report logs table — tracks every PDF generated
CREATE TABLE IF NOT EXISTS report_logs (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         TEXT,
    farmer_name     TEXT,
    language        TEXT        DEFAULT 'en',
    soil_type       TEXT,
    farm_size       TEXT,
    sensor_snapshot JSONB,      -- snapshot of sensor values used in this report
    generated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_logs_user_id ON report_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_report_logs_generated ON report_logs(generated_at DESC);

ALTER TABLE report_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read-write for now"
    ON report_logs FOR ALL
    USING (true)
    WITH CHECK (true);

-- ============================================================
--  DONE — You now have:
--  • farmer_profiles  : stores onboarding data per user
--  • report_logs      : records every PDF generated
-- ============================================================
