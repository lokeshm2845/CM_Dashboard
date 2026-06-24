-- ====================================================================
-- DELHI CM GRIEVANCE REDRESSAL DASHBOARD - SUPABASE MASTER SETUP SCRIPT
-- ====================================================================
-- Copy and paste this entire script into your Supabase SQL Editor and run it.
-- This will initialize all tables, triggers, policies, and seed users & data.

-- Enable standard extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS postgis;

-- ------------------------------------------------------------------
-- 1. DROP EXISTING TABLE SCHEMAS (To allow a clean slate if needed)
-- ------------------------------------------------------------------
DROP TRIGGER IF EXISTS trigger_reopen_on_low_rating ON public.feedback;
DROP TRIGGER IF EXISTS trigger_adjust_officer_workload ON public.complaints;
DROP TRIGGER IF EXISTS trigger_log_complaint_timeline ON public.complaints;
DROP TRIGGER IF EXISTS trigger_route_complaint_assignment ON public.complaints;
DROP TRIGGER IF EXISTS trigger_handle_new_officer_profile ON public.users;

DROP TABLE IF EXISTS public.re_inspections CASCADE;
DROP TABLE IF EXISTS public.feedback CASCADE;
DROP TABLE IF EXISTS public.visit_logs CASCADE;
DROP TABLE IF EXISTS public.complaint_timeline CASCADE;
DROP TABLE IF EXISTS public.complaints CASCADE;
DROP TABLE IF EXISTS public.category_department_mapping CASCADE;
DROP TABLE IF EXISTS public.officers CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.departments CASCADE;

-- ------------------------------------------------------------------
-- 2. CREATE DATABASE TABLES
-- ------------------------------------------------------------------

-- A. Departments Table
CREATE TABLE public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE,
    active_officers_count INT DEFAULT 0,
    rating DECIMAL(3, 2) DEFAULT 5.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- B. User Profiles Table (extends auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY, -- matches auth.users(id)
    email VARCHAR(255),
    role VARCHAR(50) NOT NULL CHECK (role IN ('cm', 'admin', 'officer', 'citizen')),
    phone VARCHAR(20),
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    district VARCHAR(100),
    full_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- C. Officers Table (extends public.users)
CREATE TABLE public.officers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    workload_count INT DEFAULT 0,
    max_workload INT DEFAULT 15,
    is_active BOOLEAN DEFAULT true,
    avg_rating DECIMAL(3,2) DEFAULT 5.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- D. Category Department Mapping Table
CREATE TABLE public.category_department_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(100) NOT NULL UNIQUE,
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    priority INT DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- E. Complaints Table
CREATE TABLE public.complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracking_no VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    department_id UUID REFERENCES public.departments(id), -- Nullable initially for auto-routing
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'resolved', 'reopened', 'escalated')),
    severity VARCHAR(50) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    district VARCHAR(100) NOT NULL,
    latitude DECIMAL(9, 6) NOT NULL,
    longitude DECIMAL(9, 6) NOT NULL,
    photo_before TEXT,
    photo_after TEXT,
    citizen_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    citizen_name VARCHAR(255),
    citizen_phone VARCHAR(50),
    citizen_email VARCHAR(255),
    assigned_officer_id UUID REFERENCES public.officers(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    is_critical BOOLEAN DEFAULT false,
    source VARCHAR(50) DEFAULT 'web',
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- F. Complaint Timeline Table
CREATE TABLE public.complaint_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    action_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action_by_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- G. CM Visit Logs Table
CREATE TABLE public.visit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    district VARCHAR(100) NOT NULL,
    visit_date DATE NOT NULL,
    purpose TEXT NOT NULL,
    notes TEXT,
    complaint_count_at_visit INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- H. Feedback Table
CREATE TABLE public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- I. Re-Inspections Table
CREATE TABLE public.re_inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    assigned_inspector_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'failed')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------
-- 3. TRIGGERS AND CORE PROCEDURAL FUNCTIONS
-- ------------------------------------------------------------------

-- A. Auto assignment trigger function
-- Assigns a newly inserted complaint to the active officer in that department with the lowest workload count.
CREATE OR REPLACE FUNCTION public.route_complaint_assignment()
RETURNS TRIGGER AS $$
DECLARE
    target_officer_id UUID;
    resolved_dept_id UUID;
BEGIN
    -- Resolve department from mapping table if null
    IF NEW.department_id IS NULL THEN
        SELECT department_id INTO resolved_dept_id
        FROM public.category_department_mapping
        WHERE category = NEW.category
        ORDER BY priority ASC, created_at ASC
        LIMIT 1;

        NEW.department_id := resolved_dept_id;
    END IF;

    -- If a department_id is resolved/provided, find an active officer with the lowest workload
    IF NEW.department_id IS NOT NULL AND NEW.assigned_officer_id IS NULL THEN
        SELECT id INTO target_officer_id
        FROM public.officers
        WHERE department_id = NEW.department_id AND is_active = true
        ORDER BY workload_count ASC, created_at ASC
        LIMIT 1;

        IF target_officer_id IS NOT NULL THEN
            NEW.assigned_officer_id := target_officer_id;
            NEW.status := 'assigned';
            
            -- Increment officer workload
            UPDATE public.officers 
            SET workload_count = workload_count + 1 
            WHERE id = target_officer_id;
        ELSE
            -- No active officer, keep as pending
            NEW.status := 'pending';
        END IF;
    ELSIF NEW.assigned_officer_id IS NOT NULL THEN
        -- If officer is manually specified, set status to assigned
        NEW.status := 'assigned';
        
        -- Increment officer workload
        UPDATE public.officers 
        SET workload_count = workload_count + 1 
        WHERE id = NEW.assigned_officer_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_route_complaint_assignment
BEFORE INSERT ON public.complaints
FOR EACH ROW
WHEN (NEW.assigned_officer_id IS NULL OR NEW.department_id IS NULL)
EXECUTE FUNCTION public.route_complaint_assignment();


-- B. Timeline logging trigger
CREATE OR REPLACE FUNCTION public.log_complaint_timeline_event()
RETURNS TRIGGER AS $$
DECLARE
    editor_name VARCHAR(255) := 'System Auto-Router';
BEGIN
    -- Capture timeline history records on status changes
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.complaint_timeline (complaint_id, status, description, action_by_name)
        VALUES (NEW.id, NEW.status, 'Grievance submitted in district: ' || NEW.district, 'Citizen Portal');
    ELSIF OLD.status <> NEW.status OR OLD.assigned_officer_id IS DISTINCT FROM NEW.assigned_officer_id THEN
        INSERT INTO public.complaint_timeline (complaint_id, status, description, action_by_name)
        VALUES (
            NEW.id, 
            NEW.status, 
            'Complaint updated. Status: ' || NEW.status || COALESCE('. Officer status changed.', '.'),
            'Department/Admin'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_complaint_timeline
AFTER INSERT OR UPDATE ON public.complaints
FOR EACH ROW
EXECUTE FUNCTION public.log_complaint_timeline_event();


-- C. Decrement workload upon resolution / Re-inspection logic
CREATE OR REPLACE FUNCTION public.adjust_officer_workload()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle officer workload adjustments on reassignment
    IF OLD.assigned_officer_id IS DISTINCT FROM NEW.assigned_officer_id THEN
        -- Decrement workload for old officer if they were active
        IF OLD.assigned_officer_id IS NOT NULL AND OLD.status IN ('assigned', 'in_progress', 'reopened') THEN
            UPDATE public.officers
            SET workload_count = GREATEST(0, workload_count - 1)
            WHERE id = OLD.assigned_officer_id;
        END IF;
        -- Increment workload for new officer if they are active
        IF NEW.assigned_officer_id IS NOT NULL AND NEW.status IN ('assigned', 'in_progress', 'reopened') THEN
            UPDATE public.officers
            SET workload_count = workload_count + 1
            WHERE id = NEW.assigned_officer_id;
        END IF;
    END IF;

    -- Handle resolution status
    IF OLD.status IN ('assigned', 'in_progress', 'reopened') AND NEW.status = 'resolved' THEN
        IF NEW.assigned_officer_id IS NOT NULL THEN
            UPDATE public.officers
            SET workload_count = GREATEST(0, workload_count - 1)
            WHERE id = NEW.assigned_officer_id;
        END IF;
        
        -- Trigger random 10% re-inspection selection
        IF random() < 0.10 THEN
            INSERT INTO public.re_inspections (complaint_id, status)
            VALUES (NEW.id, 'pending');
            
            INSERT INTO public.complaint_timeline (complaint_id, status, description, action_by_name)
            VALUES (NEW.id, NEW.status, 'Complaint selected for random 10% quality audit re-inspection.', 'System Audit');
        END IF;
    ELSIF OLD.status = 'resolved' AND NEW.status = 'reopened' THEN
        -- If complaint is reopened, increment workload
        IF NEW.assigned_officer_id IS NOT NULL THEN
            UPDATE public.officers
            SET workload_count = workload_count + 1
            WHERE id = NEW.assigned_officer_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_adjust_officer_workload
AFTER UPDATE ON public.complaints
FOR EACH ROW
EXECUTE FUNCTION public.adjust_officer_workload();


-- D. Low rating auto-reopen trigger
CREATE OR REPLACE FUNCTION public.reopen_on_low_rating()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.rating < 3 THEN
        -- Reopen complaint
        UPDATE public.complaints
        SET status = 'reopened', updated_at = now()
        WHERE id = NEW.complaint_id;

        -- Log timeline audit
        INSERT INTO public.complaint_timeline (complaint_id, status, description, action_by_name)
        VALUES (
            NEW.complaint_id, 
            'reopened', 
            'Auto-reopened due to poor citizen rating: ' || NEW.rating || '/5. Rating Comment: ' || COALESCE(NEW.comments, ''), 
            'Citizen Feedback Loop'
        );
    END IF;
    
    -- Recalculate officer ratings
    UPDATE public.officers
    SET avg_rating = (
        SELECT AVG(f.rating)::DECIMAL(3,2) 
        FROM public.feedback f
        JOIN public.complaints c ON c.id = f.complaint_id
        WHERE c.assigned_officer_id = public.officers.id
    )
    WHERE id = (SELECT assigned_officer_id FROM public.complaints WHERE id = NEW.complaint_id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_reopen_on_low_rating
AFTER INSERT ON public.feedback
FOR EACH ROW
EXECUTE FUNCTION public.reopen_on_low_rating();


-- E. Auto-create officer profile when a user with role 'officer' is created
CREATE OR REPLACE FUNCTION public.handle_new_officer_profile()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role = 'officer' AND NEW.department_id IS NOT NULL THEN
        INSERT INTO public.officers (user_id, department_id, workload_count, max_workload, is_active, avg_rating)
        VALUES (NEW.id, NEW.department_id, 0, 15, true, 5.00)
        ON CONFLICT (user_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_handle_new_officer_profile
AFTER INSERT OR UPDATE OF role, department_id ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_officer_profile();

-- ------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_department_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.re_inspections ENABLE ROW LEVEL SECURITY;

-- Helper RLS Functions
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS VARCHAR AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_district()
RETURNS VARCHAR AS $$
  SELECT district FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_officer_id()
RETURNS UUID AS $$
  SELECT id FROM public.officers WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_cm() RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'cm');
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin');
$$ LANGUAGE sql SECURITY DEFINER;

-- Policies for departments
CREATE POLICY "Allow public read access to departments" ON public.departments FOR SELECT USING (true);
CREATE POLICY "Allow CM/Admin write to departments" ON public.departments FOR ALL USING (public.is_cm() OR public.is_admin());

-- Policies for users
CREATE POLICY "Allow public read access to users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow authenticated updates to own profile" ON public.users FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Allow authenticated inserts/signups" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow CM/Admin full access to users" ON public.users FOR ALL USING (public.is_cm() OR public.is_admin());

-- Policies for officers
CREATE POLICY "Allow public read access to officers" ON public.officers FOR SELECT USING (true);
CREATE POLICY "Allow CM/Admin full access to officers" ON public.officers FOR ALL USING (public.is_cm() OR public.is_admin());
CREATE POLICY "Allow officer update own profile" ON public.officers FOR UPDATE USING (user_id = auth.uid());

-- Policies for category mapping
CREATE POLICY "Allow public read access to mappings" ON public.category_department_mapping FOR SELECT USING (true);
CREATE POLICY "Allow CM/Admin write to mappings" ON public.category_department_mapping FOR ALL USING (public.is_cm() OR public.is_admin());

-- Policies for complaints
CREATE POLICY "Allow select complaints" ON public.complaints FOR SELECT USING (
  public.is_cm()
  OR (public.is_admin() AND (public.get_user_district() IS NULL OR district = public.get_user_district()))
  OR (public.get_my_role() = 'officer' AND assigned_officer_id = public.get_officer_id())
  OR (public.get_my_role() = 'citizen' AND citizen_id = auth.uid())
  OR (auth.uid() IS NULL) -- Allow public tracking without login
);
CREATE POLICY "Allow insert complaints" ON public.complaints FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update complaints" ON public.complaints FOR UPDATE USING (
  public.is_cm()
  OR (public.is_admin() AND (public.get_user_district() IS NULL OR district = public.get_user_district()))
  OR (public.get_my_role() = 'officer' AND assigned_officer_id = public.get_officer_id())
  OR (public.get_my_role() = 'citizen' AND citizen_id = auth.uid())
  OR (auth.uid() IS NULL)
);

-- Policies for timeline
CREATE POLICY "Allow public read/write to timelines" ON public.complaint_timeline USING (true);

-- Policies for visit logs
CREATE POLICY "Allow public read access to visit logs" ON public.visit_logs FOR SELECT USING (true);
CREATE POLICY "Allow CM/Admin write to visit logs" ON public.visit_logs FOR ALL USING (public.is_cm() OR public.is_admin());

-- Policies for feedback
CREATE POLICY "Allow public read/write to feedback" ON public.feedback USING (true);

-- Policies for re-inspections
CREATE POLICY "Allow public read/write to re-inspections" ON public.re_inspections USING (true);


-- ------------------------------------------------------------------
-- 5. SEED DATA - ALL 64 DELHI DEPARTMENTS
-- ------------------------------------------------------------------
INSERT INTO public.departments (id, name, code, active_officers_count, rating) VALUES
-- Core Administrative
('d0000000-0000-0000-0000-000000000001', 'Public Works Department (PWD)', 'PWD', 1, 3.80),
('d0000000-0000-0000-0000-000000000002', 'Delhi Jal Board (DJB)', 'DJB', 1, 3.20),
('d0000000-0000-0000-0000-000000000003', 'MCD Garbage & Sanitation', 'MCD', 1, 3.50),
('d0000000-0000-0000-0000-000000000004', 'Power & Electricity (DISCOMs)', 'DISCOM', 1, 4.50),
('d0000000-0000-0000-0000-000000000005', 'Delhi Police & Security', 'POLICE', 1, 4.10),
('d0000000-0000-0000-0000-000000000006', 'Administrative Reforms', 'AR', 0, 5.00),
('d0000000-0000-0000-0000-000000000007', 'Archaeology & Delhi Gazetteer', 'ARCH', 0, 5.00),
('d0000000-0000-0000-0000-000000000008', 'Archives', 'ARCHIVES', 0, 5.00),
('d0000000-0000-0000-0000-000000000009', 'Audit', 'AUDIT', 0, 5.00),
('d0000000-0000-0000-0000-000000000010', 'Chief Electoral Officer', 'CEO', 0, 5.00),
('d0000000-0000-0000-0000-000000000011', 'Development Department & its Units', 'DEV', 0, 5.00),
('d0000000-0000-0000-0000-000000000012', 'Finance', 'FIN', 0, 5.00),
('d0000000-0000-0000-0000-000000000013', 'General Administration', 'GAD', 0, 5.00),
('d0000000-0000-0000-0000-000000000014', 'Information and Public Relations', 'IPR', 0, 5.00),
('d0000000-0000-0000-0000-000000000015', 'Planning', 'PLAN', 0, 5.00),
('d0000000-0000-0000-0000-000000000016', 'Services', 'SERVICES', 0, 5.00),
('d0000000-0000-0000-0000-000000000017', 'Vigilance', 'VIG', 0, 5.00),
('d0000000-0000-0000-0000-000000000018', 'Weights & Measures', 'WM', 0, 5.00),
-- Infrastructure & Public Works
('d0000000-0000-0000-0000-000000000019', 'Urban Development Department', 'UD', 0, 5.00),
('d0000000-0000-0000-0000-000000000020', 'Irrigation & Flood Control', 'IFC', 0, 5.00),
('d0000000-0000-0000-0000-000000000021', 'Power', 'POWER', 0, 5.00),
('d0000000-0000-0000-0000-000000000022', 'Water', 'WATER', 0, 5.00),
-- Health & Social Welfare
('d0000000-0000-0000-0000-000000000023', 'Aruna Asaf Ali Hospital', 'AAAH', 0, 5.00),
('d0000000-0000-0000-0000-000000000024', 'Ayurvedic and Unani Tibbia College', 'AUTC', 0, 5.00),
('d0000000-0000-0000-0000-000000000025', 'Board of Ayurvedic and Unani System of Medicine', 'BAUSM', 0, 5.00),
('d0000000-0000-0000-0000-000000000026', 'Central Accident and Trauma Service', 'CATS', 0, 5.00),
('d0000000-0000-0000-0000-000000000027', 'Deen Dayal Upadhyay Hospital', 'DDUH', 0, 5.00),
('d0000000-0000-0000-0000-000000000028', 'Delhi College of Engineering', 'DCE', 0, 5.00),
('d0000000-0000-0000-0000-000000000029', 'Directorate of Family Welfare', 'DFW', 0, 5.00),
('d0000000-0000-0000-0000-000000000030', 'Health Department', 'HEALTH', 0, 5.00),
('d0000000-0000-0000-0000-000000000031', 'Social Welfare Department', 'SWD', 0, 5.00),
('d0000000-0000-0000-0000-000000000032', 'Welfare of Scheduled Castes/Scheduled Tribes/OBC/Minorities', 'WSCST', 0, 5.00),
('d0000000-0000-0000-0000-000000000033', 'Women & Child Development', 'WCD', 0, 5.00),
-- Education & Training
('d0000000-0000-0000-0000-000000000034', 'Education Department', 'EDUCATION', 0, 5.00),
('d0000000-0000-0000-0000-000000000035', 'Higher Education', 'HEDU', 0, 5.00),
('d0000000-0000-0000-0000-000000000036', 'Training & Technical Education', 'TTE', 0, 5.00),
('d0000000-0000-0000-0000-000000000037', 'Directorate of Training, UTCS', 'DT_UTCS', 0, 5.00),
('d0000000-0000-0000-0000-000000000038', 'College of Art', 'COA', 0, 5.00),
-- Law, Safety & Justice
('d0000000-0000-0000-0000-000000000039', 'Central Jail', 'JAIL', 0, 5.00),
('d0000000-0000-0000-0000-000000000040', 'Chit Fund', 'CF', 0, 5.00),
('d0000000-0000-0000-0000-000000000041', 'Consumer Affairs', 'CA', 0, 5.00),
('d0000000-0000-0000-0000-000000000042', 'Drug Control', 'DC', 0, 5.00),
('d0000000-0000-0000-0000-000000000043', 'Excise', 'EXCISE', 0, 5.00),
('d0000000-0000-0000-0000-000000000044', 'Home', 'HOME', 0, 5.00),
('d0000000-0000-0000-0000-000000000045', 'Legislative Affairs', 'LA', 0, 5.00),
('d0000000-0000-0000-0000-000000000046', 'Lok Shikayat Ayog (Public Grievance Commission)', 'LSA', 0, 5.00),
('d0000000-0000-0000-0000-000000000047', 'State Election Commission', 'SEC', 0, 5.00),
-- Transport
('d0000000-0000-0000-0000-000000000048', 'Delhi Transport Corporation (DTC)', 'DTC', 0, 5.00),
('d0000000-0000-0000-0000-000000000049', 'Delhi Transco Ltd', 'TRANSCO', 0, 5.00),
('d0000000-0000-0000-0000-000000000050', 'Transport Department', 'TRANS', 0, 5.00),
-- Environment
('d0000000-0000-0000-0000-000000000051', 'Agricultural Marketing (Directorate)', 'AM', 0, 5.00),
('d0000000-0000-0000-0000-000000000052', 'Agriculture Department', 'AGRI', 0, 5.00),
('d0000000-0000-0000-0000-000000000053', 'Conservator of Forest', 'CFOREST', 0, 5.00),
('d0000000-0000-0000-0000-000000000054', 'Environment Department', 'ENV', 0, 5.00),
('d0000000-0000-0000-0000-000000000055', 'Forest Department', 'FOREST', 0, 5.00),
('d0000000-0000-0000-0000-000000000056', 'Food Safety (Department of)', 'FOODS', 0, 5.00),
('d0000000-0000-0000-0000-000000000057', 'Food & Supplies', 'FOOD_SUPP', 0, 5.00),
-- Revenue & Finance
('d0000000-0000-0000-0000-000000000058', 'Revenue Department', 'REV', 0, 5.00),
('d0000000-0000-0000-0000-000000000059', 'Trade and Taxes Department', 'TAX', 0, 5.00),
('d0000000-0000-0000-0000-000000000060', 'Cooperative Societies (Registrar)', 'RCS', 0, 5.00),
('d0000000-0000-0000-0000-000000000061', 'Delhi Disaster Management Authority (DDMA)', 'DDMA', 0, 5.00),
-- Other
('d0000000-0000-0000-0000-000000000062', 'Delhi Fire Service', 'FIRE', 0, 5.00),
('d0000000-0000-0000-0000-000000000063', 'Employment', 'EMP', 0, 5.00),
('d0000000-0000-0000-0000-000000000064', 'Industries Department', 'IND', 0, 5.00),
('d0000000-0000-0000-0000-000000000065', 'Tourism Department', 'TOUR', 0, 5.00),
('d0000000-0000-0000-0000-000000000066', 'Hospital Department', 'HOSPITAL', 0, 5.00),
('d0000000-0000-0000-0000-000000000067', 'Delhi Archives', 'D_ARCHIVES', 0, 5.00),
('d0000000-0000-0000-0000-000000000068', 'Food & Supply', 'FOOD_SUPPLY', 0, 5.00),
-- Autonomous
('d0000000-0000-0000-0000-000000000069', 'New Delhi Municipal Council (NDMC)', 'NDMC', 0, 5.00)
ON CONFLICT (code) DO UPDATE 
SET name = EXCLUDED.name;

-- ------------------------------------------------------------------
-- 6. SEED DATA - DEFAULT CATEGORY MAPPINGS
-- ------------------------------------------------------------------
INSERT INTO public.category_department_mapping (category, department_id, priority) VALUES
('Roads / Potholes', 'd0000000-0000-0000-0000-000000000001', 1), -- PWD
('Water Leakage / Shortage', 'd0000000-0000-0000-0000-000000000002', 1), -- DJB
('Garbage / Waste Pile', 'd0000000-0000-0000-0000-000000000003', 1), -- MCD
('Streetlight / Power Outage', 'd0000000-0000-0000-0000-000000000004', 1), -- DISCOM
('Public Nuisance / Safety', 'd0000000-0000-0000-0000-000000000005', 1), -- POLICE
('Sewage Overflow', 'd0000000-0000-0000-0000-000000000002', 1), -- DJB
('Road Damage', 'd0000000-0000-0000-0000-000000000001', 1), -- PWD
('Tree Fall / Trimming', 'd0000000-0000-0000-0000-000000000055', 1), -- Forest Department
('Stray Animals', 'd0000000-0000-0000-0000-000000000003', 1), -- MCD
('Traffic Violation', 'd0000000-0000-0000-0000-000000000005', 1), -- POLICE
('Health & Clinics / Hospitals', 'd0000000-0000-0000-0000-000000000030', 1),
('School Education / Infrastructure', 'd0000000-0000-0000-0000-000000000034', 1)
ON CONFLICT (category) DO UPDATE
SET department_id = EXCLUDED.department_id, priority = EXCLUDED.priority;

-- ------------------------------------------------------------------
-- 7. SEED DATA - AUTH USERS (PASSWORD IS 'password' FOR ALL)
-- ------------------------------------------------------------------

-- Delete existing users to prevent duplicate key violations (cascades to identities)
DELETE FROM auth.users WHERE email IN (
  'cm@delhi.gov.in',
  'admin@delhi.gov.in',
  'pwd.officer@delhi.gov.in',
  'djb.officer@delhi.gov.in',
  'mcd.officer@delhi.gov.in',
  'priya@gmail.com'
);

-- A. Chief Minister User (cm@delhi.gov.in)
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
  raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change, phone_change_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000001',
  'authenticated', 'authenticated',
  'cm@delhi.gov.in',
  crypt('password', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Hon''ble Chief Minister"}'::jsonb,
  false, now(), now(),
  '', '', '', '', ''
);

INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '{"sub":"00000000-0000-0000-0000-000000000001","email":"cm@delhi.gov.in"}'::jsonb,
  'email',
  '00000000-0000-0000-0000-000000000001',
  now(), now(), now()
);

-- B. State Admin User (admin@delhi.gov.in)
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
  raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change, phone_change_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000002',
  'authenticated', 'authenticated',
  'admin@delhi.gov.in',
  crypt('password', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Rajesh Kumar (State Admin)"}'::jsonb,
  false, now(), now(),
  '', '', '', '', ''
);

INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000002',
  '{"sub":"00000000-0000-0000-0000-000000000002","email":"admin@delhi.gov.in"}'::jsonb,
  'email',
  '00000000-0000-0000-0000-000000000002',
  now(), now(), now()
);

-- C. PWD Officer User (pwd.officer@delhi.gov.in)
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
  raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change, phone_change_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000003',
  'authenticated', 'authenticated',
  'pwd.officer@delhi.gov.in',
  crypt('password', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"S.K. Sharma (EE, PWD)"}'::jsonb,
  false, now(), now(),
  '', '', '', '', ''
);

INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000003',
  '{"sub":"00000000-0000-0000-0000-000000000003","email":"pwd.officer@delhi.gov.in"}'::jsonb,
  'email',
  '00000000-0000-0000-0000-000000000003',
  now(), now(), now()
);

-- D. DJB Officer User (djb.officer@delhi.gov.in)
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
  raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change, phone_change_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000004',
  'authenticated', 'authenticated',
  'djb.officer@delhi.gov.in',
  crypt('password', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Meena Das (AE, DJB)"}'::jsonb,
  false, now(), now(),
  '', '', '', '', ''
);

INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000004',
  '{"sub":"00000000-0000-0000-0000-000000000004","email":"djb.officer@delhi.gov.in"}'::jsonb,
  'email',
  '00000000-0000-0000-0000-000000000004',
  now(), now(), now()
);

-- E. MCD Officer User (mcd.officer@delhi.gov.in)
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
  raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change, phone_change_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000005',
  'authenticated', 'authenticated',
  'mcd.officer@delhi.gov.in',
  crypt('password', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Rakesh Yadav (SI, MCD)"}'::jsonb,
  false, now(), now(),
  '', '', '', '', ''
);

INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000005',
  '{"sub":"00000000-0000-0000-0000-000000000005","email":"mcd.officer@delhi.gov.in"}'::jsonb,
  'email',
  '00000000-0000-0000-0000-000000000005',
  now(), now(), now()
);

-- F. Citizen User (priya@gmail.com)
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
  raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change, phone_change_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000008',
  'authenticated', 'authenticated',
  'priya@gmail.com',
  crypt('password', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Priya Sharma"}'::jsonb,
  false, now(), now(),
  '', '', '', '', ''
);

INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000008',
  '00000000-0000-0000-0000-000000000008',
  '{"sub":"00000000-0000-0000-0000-000000000008","email":"priya@gmail.com"}'::jsonb,
  'email',
  '00000000-0000-0000-0000-000000000008',
  now(), now(), now()
);

-- ------------------------------------------------------------------
-- 8. SEED DATA - PUBLIC USERS
-- ------------------------------------------------------------------
INSERT INTO public.users (id, email, role, phone, district, full_name, department_id) VALUES
('00000000-0000-0000-0000-000000000001', 'cm@delhi.gov.in', 'cm', '9876543201', 'New Delhi', 'Hon''ble Chief Minister', NULL),
('00000000-0000-0000-0000-000000000002', 'admin@delhi.gov.in', 'admin', '9876543202', 'Central Delhi', 'Rajesh Kumar (State Admin)', NULL),
('00000000-0000-0000-0000-000000000003', 'pwd.officer@delhi.gov.in', 'officer', '9876543203', 'North Delhi', 'S.K. Sharma (EE, PWD)', 'd0000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-0000-000000000004', 'djb.officer@delhi.gov.in', 'officer', '9876543204', 'South Delhi', 'Meena Das (AE, DJB)', 'd0000000-0000-0000-0000-000000000002'),
('00000000-0000-0000-0000-000000000005', 'mcd.officer@delhi.gov.in', 'officer', '9876543205', 'East Delhi', 'Rakesh Yadav (SI, MCD)', 'd0000000-0000-0000-0000-000000000003'),
('00000000-0000-0000-0000-000000000008', 'priya@gmail.com', 'citizen', '9876543210', 'South West Delhi', 'Priya Sharma (Citizen)', NULL);

-- (The trigger `trigger_handle_new_officer_profile` will automatically insert rows into `public.officers` for user 3, 4, and 5)

-- ------------------------------------------------------------------
-- 9. SEED DATA - COMPLAINTS
-- ------------------------------------------------------------------
INSERT INTO public.complaints (id, tracking_no, title, description, category, department_id, status, severity, district, latitude, longitude, photo_before, citizen_id, created_at, updated_at) VALUES
(
    'c0000000-0000-0000-0000-000000000001',
    'CMP-2026-8921',
    'Severe pothole cluster on Ring Road near Lajpat Nagar',
    'A cluster of deep potholes is causing severe traffic congestion and minor accidents. Needs immediate resurfacing.',
    'Roads / Potholes',
    'd0000000-0000-0000-0000-000000000001',
    'assigned',
    'high',
    'South East Delhi',
    28.5678,
    77.2435,
    'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=600&q=80',
    '00000000-0000-0000-0000-000000000008',
    now() - interval '4 days',
    now() - interval '4 days'
),
(
    'c0000000-0000-0000-0000-000000000002',
    'CMP-2026-4421',
    'Major water pipe burst near Dwarka Mor Metro',
    'Drinking water has been leaking continuously from an underground main line, flooding the main corridor.',
    'Water Leakage / Shortage',
    'd0000000-0000-0000-0000-000000000002',
    'escalated',
    'critical',
    'West Delhi',
    28.6185,
    77.0321,
    'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=600&q=80',
    NULL,
    now() - interval '9 days',
    now() - interval '9 days'
),
(
    'c0000000-0000-0000-0000-000000000003',
    'CMP-2026-3091',
    'Garbage dump near primary school in Karol Bagh',
    'An unauthorized trash dumping spot has developed directly adjacent to the MCD Primary School, creating severe hygienic risks.',
    'Garbage / Waste Pile',
    'd0000000-0000-0000-0000-000000000003',
    'resolved',
    'medium',
    'Central Delhi',
    28.6445,
    77.1912,
    'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=600&q=80',
    '00000000-0000-0000-0000-000000000008',
    now() - interval '2 days',
    now() - interval '1 days'
),
(
    'c0000000-0000-0000-0000-000000000004',
    'CMP-2026-1211',
    'Lack of policing & lighting in Connaught Place outer circle pocket',
    'Multiple streetlights are broken. Anti-social elements gather after dark, making it unsafe for pedestrians.',
    'Public Nuisance / Safety',
    'd0000000-0000-0000-0000-000000000005',
    'pending',
    'medium',
    'New Delhi',
    28.6304,
    77.2177,
    NULL,
    '00000000-0000-0000-0000-000000000008',
    now() - interval '12 days',
    now() - interval '12 days'
);

-- Update resolved state data
UPDATE public.complaints 
SET photo_after = 'https://images.unsplash.com/photo-1618477388954-7852f32655ec?auto=format&fit=crop&w=600&q=80',
    resolution_notes = 'Area cleared of all debris, bleaching powder applied, and warning banners installed.',
    resolved_at = now() - interval '1 days'
WHERE id = 'c0000000-0000-0000-0000-000000000003';

-- ------------------------------------------------------------------
-- 10. SEED DATA - VISIT LOGS
-- ------------------------------------------------------------------
INSERT INTO public.visit_logs (district, visit_date, purpose, notes, complaint_count_at_visit) VALUES
('West Delhi', current_date - interval '10 days', 'Sub-division hospital review & drainage progress inspection', 'Reviewed 15 complaints, ordered immediate action on water logging near metro.', 15),
('Central Delhi', current_date - interval '5 days', 'Karol Bagh market vendor grievance session', 'Addressed garbage cleanup delay. Placed MCD agency on 24-hr notice.', 8);
