-- DATABASE SCHEMA FOR PHC CONNECT
-- Run this in your Supabase SQL Editor
-- WARNING: This will drop existing data! Use this for a clean start.

-- 0. Clean Rebuild (Optional but recommended for FK issues)
DROP TABLE IF EXISTS public.ambulance_requests CASCADE;
DROP TABLE IF EXISTS public.inventory CASCADE;
DROP TABLE IF EXISTS public.patients CASCADE;
DROP TABLE IF EXISTS public.attendance CASCADE;
DROP TABLE IF EXISTS public.doctors CASCADE;
DROP TABLE IF EXISTS public.phcs CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.districts CASCADE;

-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2. Create Districts Table
CREATE TABLE public.districts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    ddhs_admin_id UUID, -- References users.id later
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Users Table (Custom Profile)
CREATE TABLE public.users (
    id UUID PRIMARY KEY, -- Matches auth.users.id but without strict FK constraint to avoid sync issues
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    role TEXT CHECK (role IN ('doctor', 'phc_admin', 'ddhs_admin')) NOT NULL,
    district_id UUID REFERENCES public.districts(id),
    phc_id UUID, -- References phcs.id later
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Update Districts to link to Users
ALTER TABLE public.districts ADD CONSTRAINT fk_ddhs_admin FOREIGN KEY (ddhs_admin_id) REFERENCES public.users(id);

-- 4. Create PHCs Table
CREATE TABLE public.phcs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    district_id UUID REFERENCES public.districts(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES public.users(id),
    location TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Update Users to link to PHCs
ALTER TABLE public.users ADD CONSTRAINT fk_phc FOREIGN KEY (phc_id) REFERENCES public.phcs(id);

-- 5. Create Doctors Table
CREATE TABLE public.doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    phc_id UUID REFERENCES public.phcs(id) ON DELETE CASCADE,
    specialization TEXT,
    qualification TEXT,
    experience TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Create Attendance Table
CREATE TABLE public.attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    phc_id UUID REFERENCES public.phcs(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    checkin_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    status TEXT DEFAULT 'present',
    face_verified BOOLEAN DEFAULT false,
    gps_verified BOOLEAN DEFAULT false
);

-- 7. Create Patients Table
CREATE TABLE public.patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    phc_id UUID REFERENCES public.phcs(id) ON DELETE CASCADE,
    patient_name TEXT NOT NULL,
    disease TEXT NOT NULL,
    medicine TEXT NOT NULL,
    mobile TEXT,
    visit_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Create Inventory Table
CREATE TABLE public.inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phc_id UUID REFERENCES public.phcs(id) ON DELETE CASCADE,
    medicine_name TEXT NOT NULL,
    quantity INTEGER DEFAULT 0,
    threshold INTEGER DEFAULT 10,
    expiry_date DATE
);

-- 9. Create Ambulance Requests Table
CREATE TABLE public.ambulance_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requesting_phc UUID REFERENCES public.phcs(id) ON DELETE CASCADE,
    district_id UUID REFERENCES public.districts(id) ON DELETE CASCADE,
    accepted_phc UUID REFERENCES public.phcs(id),
    patient_name TEXT NOT NULL,
    emergency_type TEXT NOT NULL,
    contact TEXT NOT NULL,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Accepted', 'Completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- SETTINGS: Enable RLS for all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phcs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ambulance_requests ENABLE ROW LEVEL SECURITY;

-- POLICIES: Allow all operations for all tables (Simplification for Hackathon)
CREATE POLICY "Allow All" ON public.districts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All" ON public.phcs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All" ON public.doctors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All" ON public.attendance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All" ON public.patients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All" ON public.inventory FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All" ON public.ambulance_requests FOR ALL USING (true) WITH CHECK (true);
