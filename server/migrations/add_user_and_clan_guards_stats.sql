DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = current_schema() 
        AND table_name = 'user' 
        AND column_name = 'strength'
    ) THEN
        ALTER TABLE "user" ADD COLUMN strength BIGINT NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = current_schema() 
        AND table_name = 'user' 
        AND column_name = 'guards_count'
    ) THEN
        ALTER TABLE "user" ADD COLUMN guards_count INTEGER NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = current_schema() 
        AND table_name = 'user' 
        AND column_name = 'referrals_count'
    ) THEN
        ALTER TABLE "user" ADD COLUMN referrals_count INTEGER NOT NULL DEFAULT 0;
    END IF;
END $$;

UPDATE "user" u
SET 
    guards_count = COALESCE((
        SELECT COUNT(*) 
        FROM user_guard ug 
        WHERE ug.user_id = u.id
    ), 0),
    strength = COALESCE((
        SELECT SUM(ug.strength) 
        FROM user_guard ug 
        WHERE ug.user_id = u.id
    ), 0),
    referrals_count = COALESCE((
        SELECT COUNT(*) 
        FROM "user" u2 
        WHERE u2."referrerId" = u.id
    ), 0);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = current_schema() 
        AND table_name = 'clan' 
        AND column_name = 'strength'
    ) THEN
        ALTER TABLE "clan" ADD COLUMN strength BIGINT NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = current_schema() 
        AND table_name = 'clan' 
        AND column_name = 'guards_count'
    ) THEN
        ALTER TABLE "clan" ADD COLUMN guards_count INTEGER NOT NULL DEFAULT 0;
    END IF;
END $$;

UPDATE "clan" c
SET 
    guards_count = COALESCE((
        SELECT SUM(u.guards_count)
        FROM "user" u
        WHERE u.clan_id = c.id
    ), 0),
    strength = COALESCE((
        SELECT SUM(u.strength)
        FROM "user" u
        WHERE u.clan_id = c.id
    ), 0);