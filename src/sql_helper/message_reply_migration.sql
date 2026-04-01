-- Migration: Add reply support to messages
-- Run this in the Supabase SQL Editor

ALTER TABLE public.messages 
ADD COLUMN reply_to_id UUID REFERENCES public.messages(id) ON DELETE SET NULL;
