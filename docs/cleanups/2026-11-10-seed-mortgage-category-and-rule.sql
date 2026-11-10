-- Seed: Mortgage (UK) category + category rule + backfill
--
-- Run once in the Supabase SQL Editor (paste the whole block).
-- Idempotent: a second run is a no-op if the same config is already in place.
-- Rolls back automatically if conflicting data is detected.
--
-- What it does:
--   1. Resolves your user_id from the accounts table.
--   2. Upserts a "Mortgage (UK)" expense category with exclude_from_spending=true.
--   3. Upserts a category rule: match_text='Halifax', match_key='halifax', equals.
--      The app's matchTarget() uses merchant first, so this fires on any row
--      whose merchant normalises to 'halifax'.
--   4. Backfills existing transactions whose description = '1056324050010000'
--      (the Halifax account reference that appears in the description field).
--   5. Returns a final SELECT with category id, rule id, and backfilled row count.

begin;

do $$
declare
  v_user_id    uuid;
  v_cat_id     uuid;
  v_rule_id    uuid;
  v_backfilled int;
  v_existing_kind text;
  v_existing_exclude boolean;
begin

  -- 1. Resolve user_id
  select distinct user_id into strict v_user_id from accounts limit 1;

  -- 2. Upsert category "Mortgage (UK)"
  select id, kind, exclude_from_spending
    into v_cat_id, v_existing_kind, v_existing_exclude
    from categories
   where user_id = v_user_id
     and name = 'Mortgage (UK)'
  limit 1;

  if found then
    if v_existing_kind <> 'expense' or v_existing_exclude <> true then
      raise exception
        'Category "Mortgage (UK)" already exists but has unexpected config (kind=%, exclude_from_spending=%). Fix manually or drop it first.',
        v_existing_kind, v_existing_exclude;
    end if;
  else
    insert into categories (user_id, name, kind, exclude_from_spending)
    values (v_user_id, 'Mortgage (UK)', 'expense', true)
    returning id into v_cat_id;
  end if;

  -- 3. Upsert category rule matching merchant 'Halifax'
  --    match_key is the normalised form (lowercase, no accents) used by findMatchingRule().
  select id into v_rule_id
    from category_rules
   where user_id    = v_user_id
     and match_text = 'Halifax'
  limit 1;

  if found then
    update category_rules
       set category_id = v_cat_id,
           match_key   = 'halifax',
           match_type  = 'equals'
     where id = v_rule_id;
  else
    insert into category_rules (user_id, match_text, match_key, match_type, category_id)
    values (v_user_id, 'Halifax', 'halifax', 'equals', v_cat_id)
    returning id into v_rule_id;
  end if;

  -- 4. Backfill existing transactions by description (the Halifax account reference)
  update transactions
     set category_id = v_cat_id
   where user_id     = v_user_id
     and description = '1056324050010000';

  get diagnostics v_backfilled = row_count;

  -- Stash counts for the final SELECT below
  perform set_config('app.seed_cat_id',     v_cat_id::text,    true);
  perform set_config('app.seed_rule_id',    v_rule_id::text,   true);
  perform set_config('app.seed_backfilled', v_backfilled::text, true);

end $$;

-- 5. Summary
select
  current_setting('app.seed_cat_id')      as category_id,
  current_setting('app.seed_rule_id')     as rule_id,
  current_setting('app.seed_backfilled')  as backfilled_rows;

commit;
