-- APPROVAL WORKFLOW MIGRATION
-- Run in Supabase SQL Editor

-- 1. Add 'rejected' to users status constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_status_check;
ALTER TABLE public.users ADD CONSTRAINT users_status_check 
  CHECK (status IN ('pending', 'active', 'rejected'));

-- 2. Performance indexes
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_district_id ON public.users(district_id);
CREATE INDEX IF NOT EXISTS idx_users_phc_id ON public.users(phc_id);
