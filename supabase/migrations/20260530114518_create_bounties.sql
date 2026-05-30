create table public.bounties (
    id uuid default gen_random_uuid() primary key,
    buyer_id uuid references public.profiles(id) on delete cascade not null,
    title text not null,
    description text not null,
    category text not null,
    budget numeric,
    zip_code text,
    latitude numeric,
    longitude numeric,
    status text default 'active' check (status in ('active', 'fulfilled', 'cancelled')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table public.bounties enable row level security;

create policy "Bounties are viewable by everyone."
    on public.bounties for select
    using ( true );

create policy "Users can create their own bounties."
    on public.bounties for insert
    with check ( auth.uid() = buyer_id );

create policy "Users can update their own bounties."
    on public.bounties for update
    using ( auth.uid() = buyer_id );

create policy "Users can delete their own bounties."
    on public.bounties for delete
    using ( auth.uid() = buyer_id );
