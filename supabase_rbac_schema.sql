-- 1. Create the schools table (if it doesn't already exist)
CREATE TABLE IF NOT EXISTS public.schools (
    custom_id text PRIMARY KEY,
    school_name text NOT NULL,
    admin_auth_id uuid, -- Optional: used by createSchoolTenant
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create the user_roles table linking to auth.users (if it doesn't already exist)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('super_admin', 'school_admin', 'student')),
    school_id text REFERENCES public.schools(custom_id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Note: 'school_id' is nullable because the 'super_admin' doesn't belong to a specific school.

-- Enable Row Level Security (safe to run multiple times)
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Create Trigger to automatically assign 'super_admin'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  IF NEW.email = 'princedas000555@gmail.com' THEN
    INSERT INTO public.user_roles (id, role, school_id)
    VALUES (NEW.id, 'super_admin', NULL);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it already exists to avoid collisions, then create anew
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
