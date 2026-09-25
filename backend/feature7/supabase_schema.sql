-- =====================================================
-- Feature 7: Warehouse Safety Monitoring System
-- Run this SQL in Supabase Dashboard → SQL Editor
-- =====================================================

-- Table 1: Gas Monitoring Data
CREATE TABLE IF NOT EXISTS warehouse_gas_monitoring (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT DEFAULT 'WAREHOUSE_DEFAULT',
    gas_level REAL DEFAULT 0,
    status TEXT DEFAULT 'good',           -- 'good', 'moderate', 'bad'
    unit TEXT DEFAULT 'ppm',
    alert_triggered BOOLEAN DEFAULT FALSE,
    call_triggered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 2: Fire Detection Data
CREATE TABLE IF NOT EXISTS warehouse_fire_detection (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT DEFAULT 'WAREHOUSE_DEFAULT',
    fire_detected BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'safe',           -- 'safe', 'fire_detected'
    call_triggered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 3: Warehouse Alerts Log (for both gas and fire alerts)
CREATE TABLE IF NOT EXISTS warehouse_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    alert_type TEXT NOT NULL,             -- 'gas_moderate', 'gas_bad', 'gas_emergency_call', 'fire', 'fire_emergency_call', 'manual_emergency_call'
    user_id TEXT DEFAULT 'WAREHOUSE_DEFAULT',
    gas_level REAL,                        -- NULL for fire alerts
    fire_detected BOOLEAN,                 -- NULL for gas alerts
    status TEXT,                           -- 'moderate', 'bad', 'fire_detected', etc.
    call_triggered BOOLEAN DEFAULT FALSE,
    phone_number TEXT,                     -- Phone number called (if call was triggered)
    call_result TEXT,                      -- 'called', 'mock_called', 'failed'
    message TEXT,                          -- Human-readable alert message
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE warehouse_gas_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_fire_detection ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_alerts ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access (since we use anon key)
CREATE POLICY "Allow all access to warehouse_gas_monitoring" ON warehouse_gas_monitoring
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to warehouse_fire_detection" ON warehouse_fire_detection
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to warehouse_alerts" ON warehouse_alerts
    FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_gas_user_id ON warehouse_gas_monitoring(user_id);
CREATE INDEX IF NOT EXISTS idx_gas_created_at ON warehouse_gas_monitoring(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fire_user_id ON warehouse_fire_detection(user_id);
CREATE INDEX IF NOT EXISTS idx_fire_created_at ON warehouse_fire_detection(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON warehouse_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON warehouse_alerts(created_at DESC);
