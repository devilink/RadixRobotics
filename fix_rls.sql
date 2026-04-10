-- Allow users to read their own roles
CREATE POLICY "Users can read own role"
  ON public.user_roles
  FOR SELECT
  USING ( auth.uid() = id );

-- Allow public read access to schools so users can fetch school names
CREATE POLICY "Public can view schools"
  ON public.schools
  FOR SELECT
  USING ( true );
