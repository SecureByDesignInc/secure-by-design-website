-- Membership tiers removed, 16 October 2026 (owner request): every account is a free Community account.
-- The founding waitlist table came from migration 0010, which was applied to production outside this
-- repository, so local and test databases never had it; IF EXISTS keeps this safe everywhere.
-- Dropping the table deletes any waitlist sign-ups it holds. Export them first if they are needed.
DROP TABLE IF EXISTS membership_waitlist;
