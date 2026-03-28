-- ALERT SETTINGS FOR DDHS DASHBOARD

CREATE TABLE IF NOT EXISTS public.alert_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    district_id UUID NOT NULL REFERENCES public.districts(id) ON DELETE CASCADE,
    attendance_interval_hours INTEGER NOT NULL DEFAULT 2,
    min_attendance_threshold INTEGER NOT NULL DEFAULT 75,
    absence_trigger_count INTEGER NOT NULL DEFAULT 3,
    medicine_shortage_threshold INTEGER NOT NULL DEFAULT 20,
    emergency_escalation_minutes INTEGER NOT NULL DEFAULT 30,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(district_id)
);

-- RLS setup
ALTER TABLE public.alert_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all public read" ON public.alert_settings
FOR SELECT USING (true);

-- DDHS Admin can insert/update their district settings
CREATE POLICY "DDHS Admin manage alert settings" ON public.alert_settings
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND users.role = 'ddhs_admin' 
        AND users.district_id = alert_settings.district_id
    )
);

-- Enable real-time
ALTER PUBLICATION supabase_realtime ADD TABLE public.alert_settings;
