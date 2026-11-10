-- Seed: Mortgage (UK) category + category rule + backfill
--
-- Run once in the Supabase SQL Editor (paste the whole block).
-- Idempotent: a second run is a no-op if the same config is already in place.
-- Rolls back automatically if conflicting data is detected.
--
-- What it does:
--   1. Resolves your user_id from the accounts table.
--   2. Upserts a "Mortgage (UK)" expense category with exclude_from_spending=true.
--   3. Upserts a category rule matching the Halifax account reference "1056324050010000".
--   4. Backfills any existing transactions whose merchant OR description equals
--      "1056324050010000" to point to the new category.
--   5. Prints the category id, rule id, and backfilled row count via RAISE NOTICE.

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
  raise notice 'User id: %', v_user_id;

  -- 2. Upsert category "Mortgage (UK)"
  --    Conflict on (user_id, kind, name) — guard against stale config.
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
    raise notice 'Category already exists: %', v_cat_id;
  else
    insert into categories (user_id, name, kind, exclude_from_spending)
    values (v_user_id, 'Mortgage (UK)', 'expense', true)
    returning id into v_cat_id;
    raise notice 'Category created: %', v_cat_id;
  end if;

  -- 3. Upsert category rule for description "1056324050010000"
  select id into v_rule_id
    from category_rules
   where user_id    = v_user_id
     and match_text = '1056324050010000'
  limit 1;

  if found then
    -- Update to point at the (possibly just-created) category
    update category_rules
       set category_id = v_cat_id,
           match_key   = '1056324050010000',
           match_type  = 'equals'
     where id = v_rule_id;
    raise notice 'Category rule updated: %', v_rule_id;
  else
    insert into category_rules (user_id, match_text, match_key, match_type, category_id)
    values (v_user_id, '1056324050010000', '1056324050010000', 'equals', v_cat_id)
    returning id into v_rule_id;
    raise notice 'Category rule created: %', v_rule_id;
  end if;

  -- 4. Backfill existing transactions
  update transactions
     set category_id = v_cat_id
   where user_id = v_user_id
     and (merchant = '1056324050010000' or description = '1056324050010000');

  get diagnostics v_backfilled = row_count;
  raise notice 'Backfilled % transaction(s).', v_backfilled;

end $$;

commit;
