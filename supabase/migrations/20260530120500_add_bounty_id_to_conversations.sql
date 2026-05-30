ALTER TABLE public.conversations ADD COLUMN bounty_id uuid references public.bounties(id) on delete cascade;
