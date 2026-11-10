-- Migration: add exclude_from_spending to categories
-- Run once in the Supabase SQL Editor.
-- Idempotent — safe to run again if the column already exists.

alter table categories
  add column if not exists exclude_from_spending boolean not null default false;
