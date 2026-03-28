-- =====================================================
-- PHC Connect: DDHS Backend Migration
-- Run this in your Supabase SQL Editor
-- =====================================================

-- 1. Create feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phc_id UUID REFERENCES public.phcs(id) ON DELETE CASCADE,
    patient_name TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create alerts table
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    district_id UUID REFERENCES public.districts(id) ON DELETE CASCADE,
    phc_id UUID REFERENCES public.phcs(id) ON DELETE CASCADE,
    alert_type TEXT CHECK (alert_type IN ('attendance', 'medicine', 'emergency')),
    message TEXT NOT NULL,
    severity TEXT DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high')),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- 4. Policies (permissive for hackathon) — idempotent
DROP POLICY IF EXISTS "Allow All" ON public.feedback;
DROP POLICY IF EXISTS "Allow All" ON public.alerts;
CREATE POLICY "Allow All" ON public.feedback FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All" ON public.alerts FOR ALL USING (true) WITH CHECK (true);

-- 5. Add unique constraint on attendance (doctor_id + date)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_attendance_doctor_date'
  ) THEN
    ALTER TABLE public.attendance ADD CONSTRAINT unique_attendance_doctor_date UNIQUE (doctor_id, date);
  END IF;
END $$;
