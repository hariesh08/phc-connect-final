-- PHC ADMIN MODULE MIGRATION
-- Run in Supabase SQL Editor

-- 1. Create vaccinations table
CREATE TABLE IF NOT EXISTS public.vaccinations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_name TEXT NOT NULL,
    vaccine_name TEXT NOT NULL,
    dose TEXT,
    date DATE DEFAULT CURRENT_DATE,
    phc_id UUID REFERENCES public.phcs(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.vaccinations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow All" ON public.vaccinations FOR ALL USING (true) WITH CHECK (true);

-- 2. Enable realtime on inventory table
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory;
