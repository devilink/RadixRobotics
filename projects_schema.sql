-- SQL script to create the projects table for RADIX
-- Please run this script in your Supabase Dashboard -> SQL Editor

CREATE TABLE IF NOT EXISTS public.projects (
    id text PRIMARY KEY,
    name text NOT NULL,
    description text,
    status text NOT NULL CHECK (status IN ('Upcoming', 'Ongoing', 'Completed', 'Archived')),
    date_added text NOT NULL,
    modules jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) on the table
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Note: Since projects are managed by Super Admins bypassing RLS via the service role key 
-- in server actions, we don't strictly need RLS policies for read/write access. 
-- The service role key inherently bypasses RLS.
