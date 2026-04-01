-- Migration: Add Wallpaper Support to Rooms
-- Run this in your Supabase SQL Editor

ALTER TABLE public.rooms 
ADD COLUMN IF NOT EXISTS wallpaper_url TEXT,
ADD COLUMN IF NOT EXISTS wallpaper_color TEXT;

-- Optional: Add a comment for better documentation
COMMENT ON COLUMN public.rooms.wallpaper_url IS 'Custom background image URL for the chat room';
COMMENT ON COLUMN public.rooms.wallpaper_color IS 'Custom background color hex or CSS gradient for the chat room';
