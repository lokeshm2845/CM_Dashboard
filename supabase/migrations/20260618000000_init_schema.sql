-- Create custom roles and tables for Delhi CM Grievance Redressal Dashboard

-- Enable standard extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Departments Table
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE,
    active_officers_count INT DEFAULT 0,
    rating DECIMAL(3, 2) DEFAULT 5.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. User Profiles Table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY, -- references auth.users(id)
    email VARCHAR(255),
    role VARCHAR(50) NOT NULL CHECK (role IN ('cm', 'admin', 'officer', 'citizen')),
    phone VARCHAR(20),
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    district VARCHAR(100),
    full_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Officers Table
CREATE TABLE IF NOT EXISTS public.officers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    workload_count INT DEFAULT 0,
    max_workload INT DEFAULT 15,
    is_active BOOLEAN DEFAULT true,
    avg_rating DECIMAL(3,2) DEFAULT 5.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Category Department Mapping Table
CREATE TABLE IF NOT EXISTS public.category_department_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(100) NOT NULL UNIQUE,
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    priority INT DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Complaints Table
CREATE TABLE IF NOT EXISTS public.complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracking_no VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    department_id UUID REFERENCES public.departments(id),
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

-- 6. Complaint Timeline Table
CREATE TABLE IF NOT EXISTS public.complaint_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    action_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action_by_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. CM Visit Logs Table
CREATE TABLE IF NOT EXISTS public.visit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    district VARCHAR(100) NOT NULL,
    visit_date DATE NOT NULL,
    purpose TEXT NOT NULL,
    notes TEXT,
    complaint_count_at_visit INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Feedback Table
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Re-Inspections Table
CREATE TABLE IF NOT EXISTS public.re_inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    assigned_inspector_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'failed')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- TRIGGERS AND CORE PROCEDURAL FUNCTIONS
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

    -- If a department_id is resolved/provided, assign to active officer with lowest workload
    IF NEW.department_id IS NOT NULL AND NEW.assigned_officer_id IS NULL THEN
        SELECT id INTO target_officer_id
        FROM public.officers
        WHERE department_id = NEW.department_id AND is_active = true
        ORDER BY workload_count ASC, created_at ASC
        LIMIT 1;

        IF target_officer_id IS NOT NULL THEN
            NEW.assigned_officer_id := target_officer_id;
            NEW.status := 'assigned';
            UPDATE public.officers SET workload_count = workload_count + 1 WHERE id = target_officer_id;
        ELSE
            NEW.status := 'pending';
        END IF;
    ELSIF NEW.assigned_officer_id IS NOT NULL THEN
        NEW.status := 'assigned';
        UPDATE public.officers SET workload_count = workload_count + 1 WHERE id = NEW.assigned_officer_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_route_complaint_assignment
BEFORE INSERT ON public.complaints
FOR EACH ROW
WHEN (NEW.assigned_officer_id IS NULL OR NEW.department_id IS NULL)
EXECUTE FUNCTION public.route_complaint_assignment();


CREATE OR REPLACE FUNCTION public.log_complaint_timeline_event()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.complaint_timeline (complaint_id, status, description, action_by_name)
        VALUES (NEW.id, NEW.status, 'Grievance submitted in district: ' || NEW.district, 'Citizen Portal');
    ELSIF OLD.status <> NEW.status OR OLD.assigned_officer_id IS DISTINCT FROM NEW.assigned_officer_id THEN
        INSERT INTO public.complaint_timeline (complaint_id, status, description, action_by_name)
        VALUES (NEW.id, NEW.status, 'Complaint updated. Status: ' || NEW.status, 'Department/Admin');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_log_complaint_timeline
AFTER INSERT OR UPDATE ON public.complaints
FOR EACH ROW
EXECUTE FUNCTION public.log_complaint_timeline_event();


CREATE OR REPLACE FUNCTION public.adjust_officer_workload()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.assigned_officer_id IS DISTINCT FROM NEW.assigned_officer_id THEN
        IF OLD.assigned_officer_id IS NOT NULL AND OLD.status IN ('assigned', 'in_progress', 'reopened') THEN
            UPDATE public.officers SET workload_count = GREATEST(0, workload_count - 1) WHERE id = OLD.assigned_officer_id;
        END IF;
        IF NEW.assigned_officer_id IS NOT NULL AND NEW.status IN ('assigned', 'in_progress', 'reopened') THEN
            UPDATE public.officers SET workload_count = workload_count + 1 WHERE id = NEW.assigned_officer_id;
        END IF;
    END IF;

    IF OLD.status IN ('assigned', 'in_progress', 'reopened') AND NEW.status = 'resolved' THEN
        IF NEW.assigned_officer_id IS NOT NULL THEN
            UPDATE public.officers SET workload_count = GREATEST(0, workload_count - 1) WHERE id = NEW.assigned_officer_id;
        END IF;
        IF random() < 0.10 THEN
            INSERT INTO public.re_inspections (complaint_id, status) VALUES (NEW.id, 'pending');
            INSERT INTO public.complaint_timeline (complaint_id, status, description, action_by_name)
            VALUES (NEW.id, NEW.status, 'Complaint selected for random 10% quality audit re-inspection.', 'System Audit');
        END IF;
    ELSIF OLD.status = 'resolved' AND NEW.status = 'reopened' THEN
        IF NEW.assigned_officer_id IS NOT NULL THEN
            UPDATE public.officers SET workload_count = workload_count + 1 WHERE id = NEW.assigned_officer_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_adjust_officer_workload
AFTER UPDATE ON public.complaints
FOR EACH ROW
EXECUTE FUNCTION public.adjust_officer_workload();


CREATE OR REPLACE FUNCTION public.reopen_on_low_rating()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.rating < 3 THEN
        UPDATE public.complaints SET status = 'reopened', updated_at = now() WHERE id = NEW.complaint_id;
        INSERT INTO public.complaint_timeline (complaint_id, status, description, action_by_name)
        VALUES (NEW.complaint_id, 'reopened', 'Auto-reopened due to poor citizen rating: ' || NEW.rating || '/5.', 'Citizen Feedback Loop');
    END IF;
    
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

CREATE OR REPLACE TRIGGER trigger_reopen_on_low_rating
AFTER INSERT ON public.feedback
FOR EACH ROW
EXECUTE FUNCTION public.reopen_on_low_rating();


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

CREATE OR REPLACE TRIGGER trigger_handle_new_officer_profile
AFTER INSERT OR UPDATE OF role, department_id ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_officer_profile();

-- RLS policies setup
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_department_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.re_inspections ENABLE ROW LEVEL SECURITY;

-- Select policies
CREATE POLICY "Allow public read access to departments" ON public.departments FOR SELECT USING (true);
CREATE POLICY "Allow public read access to users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow public read access to officers" ON public.officers FOR SELECT USING (true);
CREATE POLICY "Allow public read access to mappings" ON public.category_department_mapping FOR SELECT USING (true);
CREATE POLICY "Allow select complaints" ON public.complaints FOR SELECT USING (true);
CREATE POLICY "Allow public read/write to timelines" ON public.complaint_timeline USING (true);
CREATE POLICY "Allow public read access to visit logs" ON public.visit_logs FOR SELECT USING (true);
CREATE POLICY "Allow public read/write to feedback" ON public.feedback USING (true);
CREATE POLICY "Allow public read/write to re-inspections" ON public.re_inspections USING (true);

-- Allow authenticated edits
CREATE POLICY "Allow authenticated inserts to users" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated updates to users" ON public.users FOR UPDATE USING (true);
CREATE POLICY "Allow CM/Admin delete to users" ON public.users FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('cm', 'admin'))
);
CREATE POLICY "Allow public inserts to complaints" ON public.complaints FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public updates to complaints" ON public.complaints FOR UPDATE USING (true);
CREATE POLICY "Allow public updates to officers" ON public.officers FOR UPDATE USING (true);

-- Allow CM/Admin write access to departments, mappings, officers, and visit logs
CREATE POLICY "Allow CM/Admin write to departments" ON public.departments FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('cm', 'admin'))
);

CREATE POLICY "Allow CM/Admin write to mappings" ON public.category_department_mapping FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('cm', 'admin'))
);

CREATE POLICY "Allow CM/Admin write to officers" ON public.officers FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('cm', 'admin'))
);

CREATE POLICY "Allow CM/Admin write to visit logs" ON public.visit_logs FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('cm', 'admin'))
);

-- Seed core departments and categories for the jury demo
INSERT INTO public.departments (id, name, code, active_officers_count, rating) VALUES
('d0000000-0000-0000-0000-000000000001', 'Public Works Department (PWD)', 'PWD', 1, 3.80),
('d0000000-0000-0000-0000-000000000002', 'Delhi Jal Board (DJB)', 'DJB', 1, 3.20),
('d0000000-0000-0000-0000-000000000003', 'MCD Garbage & Sanitation', 'MCD', 1, 3.50),
('d0000000-0000-0000-0000-000000000004', 'Power & Electricity (DISCOMs)', 'DISCOM', 1, 4.50),
('d0000000-0000-0000-0000-000000000005', 'Delhi Police & Security', 'POLICE', 1, 4.10),
('d0000000-0000-0000-0000-000000000030', 'Health Department', 'HEALTH', 0, 4.60),
('d0000000-0000-0000-0000-000000000034', 'Education Department', 'EDUCATION', 0, 4.80),
('d0000000-0000-0000-0000-000000000066', 'Hospital Department', 'HOSPITAL', 0, 4.20)
ON CONFLICT (code) DO UPDATE 
SET name = EXCLUDED.name;

-- Seed default category routing mappings
INSERT INTO public.category_department_mapping (category, department_id, priority) VALUES
('Roads / Potholes', 'd0000000-0000-0000-0000-000000000001', 1),
('Water Leakage / Shortage', 'd0000000-0000-0000-0000-000000000002', 1),
('Garbage / Waste Pile', 'd0000000-0000-0000-0000-000000000003', 1),
('Streetlight / Power Outage', 'd0000000-0000-0000-0000-000000000004', 1),
('Public Nuisance / Safety', 'd0000000-0000-0000-0000-000000000005', 1),
('Sewage Overflow', 'd0000000-0000-0000-0000-000000000002', 1),
('Road Damage', 'd0000000-0000-0000-0000-000000000001', 1),
('Health & Clinics / Hospitals', 'd0000000-0000-0000-0000-000000000030', 1),
('School Education / Infrastructure', 'd0000000-0000-0000-0000-000000000034', 1)
ON CONFLICT (category) DO UPDATE
SET department_id = EXCLUDED.department_id, priority = EXCLUDED.priority;


