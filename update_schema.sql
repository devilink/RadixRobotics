-- Add 'is_approved' boolean column and default it to true 
-- (This ensures your Super Admin and existing School Admins stay approved instantly)
ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT true;
