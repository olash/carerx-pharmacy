-- Run in Supabase → SQL Editor AFTER the person has signed up on the website.
-- Grants full admin access (inventory, requests, consultations, settings, team).
update public.profiles
   set role = 'admin'
 where email = 'you@example.com';   -- ← change this

-- Pharmacists (no team management) can then be added from Admin → Team,
-- or here with: update public.profiles set role = 'pharmacist' where email = '...';
