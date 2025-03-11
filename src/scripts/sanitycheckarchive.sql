
DO $$
DECLARE
    r RECORD;
    diff_row RECORD;
    public_count BIGINT;
    archive_count BIGINT;
BEGIN
    -- Loop through each base table in the public schema
    FOR r IN
        SELECT table_name
          FROM information_schema.tables
         WHERE table_schema = 'public'
           AND table_type = 'BASE TABLE'
    LOOP
        -- Check that the table exists in archive_2023
        PERFORM 1
          FROM information_schema.tables
         WHERE table_schema = 'archive_2023'
           AND table_name = r.table_name;
        IF NOT FOUND THEN
            RAISE NOTICE 'Table "%" exists in public but not in "archive_2023"', r.table_name;
        ELSE
            -- Compare row counts first
            EXECUTE format('SELECT count(*) FROM public.%I', r.table_name)
              INTO public_count;
            EXECUTE format('SELECT count(*) FROM "archive_2023".%I', r.table_name)
              INTO archive_count;
            IF public_count <> archive_count THEN
                RAISE NOTICE 'Row count mismatch in table "%" : public = %, archive_2023 = %', r.table_name, public_count, archive_count;
            ELSE
                RAISE NOTICE 'Row counts match for table "%" : % rows', r.table_name, public_count;
            END IF;

            -- Find rows in public that are not in archive_2023
            FOR diff_row IN EXECUTE format(
                'SELECT row_to_json(t) AS diff FROM (SELECT * FROM public.%I EXCEPT SELECT * FROM "archive_2023".%I) t',
                r.table_name, r.table_name
            )
            LOOP
                RAISE NOTICE 'Difference in table "%" (row exists in public but not in archive_2023): %', r.table_name, diff_row.diff;
            END LOOP;

            -- Find rows in archive_2023 that are not in public
            FOR diff_row IN EXECUTE format(
                'SELECT row_to_json(t) AS diff FROM (SELECT * FROM "archive_2023".%I EXCEPT SELECT * FROM public.%I) t',
                r.table_name, r.table_name
            )
            LOOP
                RAISE NOTICE 'Difference in table "%" (row exists in archive_2023 but not in public): %', r.table_name, diff_row.diff;
            END LOOP;
        END IF;
    END LOOP;
END $$;
