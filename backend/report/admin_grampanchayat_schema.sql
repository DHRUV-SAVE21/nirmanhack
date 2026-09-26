-- ============================================================
--  ANNADATA SAATHI — Admin Panel & Grampanchayat Mock Data
--  Run this ENTIRE script in Supabase SQL Editor
--  Creates tables + inserts realistic Indian agricultural data
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- TABLE 1: grampanchayat_users (GP Admin logins)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS grampanchayat_users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gp_name         TEXT NOT NULL,
    district        TEXT NOT NULL,
    taluka          TEXT NOT NULL,
    state           TEXT NOT NULL DEFAULT 'Maharashtra',
    sarpanch_name   TEXT,
    phone           TEXT,
    email           TEXT,
    password_hash   TEXT DEFAULT 'gp_secure_2024',
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- TABLE 2: grampanchayat_schemes (Central/State schemes list)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS grampanchayat_schemes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gp_id           UUID REFERENCES grampanchayat_users(id),
    scheme_name     TEXT NOT NULL,
    ministry        TEXT,
    budget_allotted NUMERIC(14,2),
    budget_used     NUMERIC(14,2) DEFAULT 0,
    beneficiaries   INTEGER DEFAULT 0,
    status          TEXT DEFAULT 'active' CHECK (status IN ('active','completed','paused')),
    deadline        DATE,
    description     TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- TABLE 3: grampanchayat_submissions (farmer → GP requests)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS grampanchayat_submissions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gp_id           UUID REFERENCES grampanchayat_users(id),
    farmer_name     TEXT NOT NULL,
    village         TEXT,
    mobile          TEXT,
    aadhaar_last4   TEXT,
    land_size       TEXT,
    soil_type       TEXT,
    crop_type       TEXT,
    request_type    TEXT, -- 'scheme_enrollment','certificate','complaint','subsidy'
    scheme_name     TEXT,
    description     TEXT,
    priority        TEXT DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
    status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','under_review','approved','rejected','forwarded')),
    submitted_at    TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at     TIMESTAMPTZ,
    reviewer_note   TEXT
);

-- ─────────────────────────────────────────────────────────────
-- TABLE 4: admin_stats (cached dashboard metrics)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_stats (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name     TEXT UNIQUE NOT NULL,
    metric_value    NUMERIC,
    metric_label    TEXT,
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- TABLE 5: admin_activity_log
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_activity_log (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor       TEXT,
    action      TEXT,
    target      TEXT,
    details     TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS with permissive policies (tighten for production)
ALTER TABLE grampanchayat_users       ENABLE ROW LEVEL SECURITY;
ALTER TABLE grampanchayat_schemes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE grampanchayat_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_stats               ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_log        ENABLE ROW LEVEL SECURITY;

CREATE POLICY "open_gp_users"    ON grampanchayat_users       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_gp_schemes"  ON grampanchayat_schemes     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_gp_subs"     ON grampanchayat_submissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_admin_stats" ON admin_stats               FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_admin_log"   ON admin_activity_log        FOR ALL USING (true) WITH CHECK (true);


-- ═════════════════════════════════════════════════════════════
-- MOCK DATA
-- ═════════════════════════════════════════════════════════════

-- ── 1. Grampanchayat Users ────────────────────────────────────
INSERT INTO grampanchayat_users (id, gp_name, district, taluka, state, sarpanch_name, phone, email) VALUES
  ('11111111-0000-0000-0000-000000000001', 'Dahanu Gram Panchayat',    'Palghar',   'Dahanu',     'Maharashtra', 'Leelabai Kokate',    '9881234504', 'dahanu.gp@maha.gov.in'),
  ('11111111-0000-0000-0000-000000000002', 'Vasai Virar GP',           'Palghar',   'Vasai',      'Maharashtra', 'Kashinath Mhatre',   '9881234506', 'vasai.gp@maha.gov.in'),
  ('11111111-0000-0000-0000-000000000003', 'Palghar Rural GP',         'Palghar',   'Palghar',    'Maharashtra', 'Suresh Patil',       '9881234507', 'palghar.gp@maha.gov.in'),
  ('11111111-0000-0000-0000-000000000004', 'Pingli Gram Panchayat',    'Pune',      'Purandar',   'Maharashtra', 'Ramesh Bhosale',     '9881234501', 'pingli.gp@maha.gov.in'),
  ('11111111-0000-0000-0000-000000000005', 'Vadgaon Gram Panchayat',   'Nashik',    'Niphad',     'Maharashtra', 'Sunitabai Patil',    '9881234502', 'vadgaon.gp@maha.gov.in');

-- ── 2. Government Schemes (per GP) ───────────────────────────
INSERT INTO grampanchayat_schemes (gp_id, scheme_name, ministry, budget_allotted, budget_used, beneficiaries, status, deadline, description) VALUES
-- Dahanu GP
('11111111-0000-0000-0000-000000000001', 'Palghar Coastal Horticulture',   'State Horticulture',        4500000, 2800000, 142, 'active',    '2025-12-31', 'Subsidy on Chikoo, Coconut, and Mango farming tools for coastal region.'),
('11111111-0000-0000-0000-000000000001', 'PM Kisan Samman Nidhi',          'Ministry of Agriculture',   1200000,  980000,  82, 'active',    '2025-03-31', 'Direct income support ₹6000/year to small & marginal farmers.'),
('11111111-0000-0000-0000-000000000001', 'Drip Irrigation Subsidy (PMKSY)','Jal Shakti Ministry',       880000,  880000,  41, 'completed', '2024-12-31', 'Subsidy on micro-irrigation systems, drip & sprinkler.'),
-- Vasai Virar GP
('11111111-0000-0000-0000-000000000002', 'Greenhouse Subsidy Yojana',      'Ministry of Agriculture',   3500000, 1290000,  45, 'active',    '2026-03-31', 'Support for floriculture and greenhouse banana farming.'),
('11111111-0000-0000-0000-000000000002', 'e-NAM (Online Agri Market)',     'Ministry of Agriculture',    350000,  170000,  38, 'active',    '2025-09-30', 'Online trading platform for agricultural commodities.'),
('11111111-0000-0000-0000-000000000002', 'Kisan Credit Card',              'Ministry of Finance',       3200000, 2100000,  74, 'active',    '2025-12-31', 'Short-term credit for agriculture up to ₹3 lakh at 4%.'),
-- Palghar GP
('11111111-0000-0000-0000-000000000003', 'PMFBY Crop Insurance',           'Ministry of Finance',       1900000,  900000,  44, 'active',    '2025-12-31', 'Coverage against crop loss due to natural calamities.'),
('11111111-0000-0000-0000-000000000003', 'Paramparagat Krishi Vikas Yojana','Ministry of Agriculture',   620000,  410000,  28, 'active',    '2025-08-31', 'Organic farming promotion and certification support.');

-- ── 3. Farmer → GP Submissions ───────────────────────────────
INSERT INTO grampanchayat_submissions 
  (gp_id, farmer_name, village, mobile, aadhaar_last4, land_size, soil_type, crop_type, request_type, scheme_name, description, priority, status, submitted_at, reviewed_at, reviewer_note)
VALUES
-- Dahanu GP - Submissions
('11111111-0000-0000-0000-000000000001', 'Tukaram Bari',        'Bordi',       '9765008001', '8821', '4.5 Acres', 'Coastal Alluvial','Chikoo, Coconut',   'scheme_enrollment', 'Palghar Coastal Horticulture','Need subsidy for new Chikoo saplings after storm damage.',              'urgent', 'pending',     NOW() - INTERVAL '1 day',  NULL,                       NULL),
('11111111-0000-0000-0000-000000000001', 'Sunita Machhi',       'Gholvad',     '9765008002', '4492', '1.8 Acres', 'Alluvial',        'Vegetables',        'subsidy',           'Drip Irrigation Subsidy',     'Apply for drip irrigation. Water scarce in summer.',                     'high',   'under_review', NOW() - INTERVAL '5 days',  NULL,                       NULL),
('11111111-0000-0000-0000-000000000001', 'Vitthal Rathad',      'Aswali',      '9765008003', '7734', '5.0 Acres', 'Sandy Loam',      'Paddy',             'scheme_enrollment', 'PMFBY Crop Insurance',        'Unseasonal rains ruined early paddy crop.',                              'urgent', 'approved',    NOW() - INTERVAL '3 days',  NOW() - INTERVAL '1 day',   'Verification complete. Claim approved 50%.'),
-- Vasai Virar GP - Submissions
('11111111-0000-0000-0000-000000000002', 'Anandi Vartak',       'Arnala',      '9765008004', '5567', '2.0 Acres', 'Alluvial',        'Banana, Vegetables','scheme_enrollment','Greenhouse Subsidy Yojana',        'Building polyhouse for export quality banana.',                          'high',   'under_review',     NOW() - INTERVAL '4 days', NULL, 'Awaiting Bank verification for KCC loan.'),
('11111111-0000-0000-0000-000000000002', 'Priya Koli',          'Nalasopara',  '9765008005', '3312', '1.5 Acres', 'Red Laterite',    'Onion, Garlic',     'subsidy',           'Kisan Credit Card',           'First time applying for KCC.',                                           'normal', 'under_review', NOW() - INTERVAL '8 days',  NULL,                       'Documents submitted. Bank verification pending.'),
-- Palghar Rural - Submissions
('11111111-0000-0000-0000-000000000003', 'Navnath Save',        'Kelve',       '9765008006', '6620', '5.2 Acres', 'Sandy Loam',      'Paddy, Betelnut',   'complaint',          NULL,                         'Electricity lines to farm pump completely broken.',                      'urgent', 'forwarded',    NOW() - INTERVAL '5 days', NOW() - INTERVAL '2 days', 'Forwarded to MSEB. Electricity issue.'),
('11111111-0000-0000-0000-000000000003', 'Deepak Patil',        'Boisar',      '9765008007', '8834', '7.2 Acres', 'Black Cotton',    'Sugarcane',         'scheme_enrollment', 'PMFBY Crop Insurance',        'Acreage increased to 7.2 acres. Need insurance update.',                 'high',   'pending',     NOW() - INTERVAL '2 days',  NULL,                       NULL);

-- ── 4. Admin Stats (Dashboard summary numbers) ────────────────
INSERT INTO admin_stats (metric_name, metric_value, metric_label) VALUES
  ('total_farmers',           14284, 'Registered Farmers'),
  ('active_gp_portals',          42, 'Active GPs'),
  ('total_scheme_beneficiaries', 4843,'Scheme Beneficiaries'),
  ('reports_generated',         840, 'Soil Reports Generated'),
  ('pending_submissions',        21, 'Pending Farmer Requests'),
  ('total_budget_disbursed',  84000000,'Budget Disbursed (₹)'),
  ('soil_tests_done',          1203, 'Soil Tests Completed'),
  ('schemes_active',            18,  'Active Schemes')
ON CONFLICT (metric_name) DO UPDATE SET
  metric_value = EXCLUDED.metric_value,
  metric_label = EXCLUDED.metric_label,
  updated_at   = NOW();

-- ── 5. Admin Activity Log ─────────────────────────────────────
INSERT INTO admin_activity_log (actor, action, target, details) VALUES
  ('Admin',         'approved',   'Submission',     'Horticulture subsidy for 24 farmers in Vasai Virar'),
  ('Dahanu GP',     'submitted',  'NewRequest',     'Chikoo storm damage assessment request — Tukaram Bari'),
  ('System',        'generated',  'SoilReport',     'Soil PDF report — Anandi Vartak (Marathi)'),
  ('Palghar GP',    'forwarded',  'Complaint',      'Irrigation electricity complaint → MSEB Dahanu branch'),
  ('Admin',         'disbursed',  'PMKisan',        'PM Kisan March installment ₹2000 × 274 farmers via DBT');

-- ── 6. Farmer Profiles (Admin view mock data) ─────────────────
INSERT INTO farmer_profiles 
  (user_id, name, land_size, district, village, state, crops)
VALUES
  ('FARM-PLG-001', 'Tukaram Bari',      4.5,  'Palghar', 'Bordi', 'Maharashtra', 'Chikoo, Coconut'),
  ('FARM-PLG-002', 'Anandi Vartak',     2.0,  'Palghar', 'Arnala', 'Maharashtra', 'Banana, Vegetables'),
  ('FARM-PLG-003', 'Navnath Save',      5.2,  'Palghar', 'Kelve', 'Maharashtra', 'Paddy, Betelnut'),
  ('FARM-PLG-004', 'Samir Koli',        1.5,  'Palghar', 'Nalasopara', 'Maharashtra', 'Onion, Garlic'),
  ('FARM-MH-001',  'Ramchandra Jagtap', 3.5,  'Pune',    'Pingli', 'Maharashtra', 'Soybean, Wheat')
ON CONFLICT DO NOTHING;

-- ── 7. Report Logs (mock history) ────────────────────────────
INSERT INTO report_logs (user_id, farmer_name, language, soil_type, farm_size, sensor_snapshot, generated_at) VALUES
  ('FARM-PLG-001', 'Tukaram Bari',      'mr', 'Coastal Alluvial', '4.5',
   '{"ph":7.1,"nitrogen":220,"phosphorus":24,"potassium":110,"conductivity":480,"soil_moisture":45,"soil_temperature":28}',
   NOW() - INTERVAL '1 days'),
  ('FARM-PLG-002', 'Anandi Vartak',     'mr', 'Alluvial',         '2.0',
   '{"ph":6.8,"nitrogen":280,"phosphorus":32,"potassium":140,"conductivity":380,"soil_moisture":55,"soil_temperature":24}',
   NOW() - INTERVAL '2 days'),
  ('FARM-PLG-003', 'Navnath Save',      'en', 'Sandy Loam',       '5.2',
   '{"ph":6.5,"nitrogen":190,"phosphorus":18,"potassium":95,"conductivity":320,"soil_moisture":40,"soil_temperature":26}',
   NOW() - INTERVAL '3 days');

-- ============================================================
--  DONE. Your admin panel and Grampanchayat portal
--  now feature Palghar, Dahanu, and Vasai Virar data!
-- ============================================================
