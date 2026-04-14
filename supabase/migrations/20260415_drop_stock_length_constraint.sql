DO $$
DECLARE
    row record;
BEGIN
    FOR row IN
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = 'stocks' AND constraint_type = 'CHECK' 
          -- Ensure we drop the relevant length constraint
          AND constraint_name LIKE '%length%'
    LOOP
        EXECUTE 'ALTER TABLE stocks DROP CONSTRAINT ' || quote_ident(row.constraint_name);
    END LOOP;
END;
$$;
