-- ATTENDANCE SYSTEM UPGRADE
-- Adds GPS + face verification columns to attendance table

ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS gps_lat DECIMAL;
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS gps_long DECIMAL;
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS distance_from_phc INTEGER;
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS face_verified BOOLEAN DEFAULT false;
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS checkin_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Enable realtime on attendance for PHC admin auto-refresh
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance;
