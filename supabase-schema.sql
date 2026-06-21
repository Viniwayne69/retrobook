create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  username text not null unique,
  bio text default '',
  current_book text default '',
  favorite_author text default '',
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  book_title text not null,
  content text not null,
  likes_count integer not null default 0 check (likes_count >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create table if not exists public.tribes (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references public.profiles(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text not null,
  main_book_or_author text not null,
  category text not null,
  members_count integer not null default 0 check (members_count >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.tribe_members (
  id uuid primary key default gen_random_uuid(),
  tribe_id uuid not null references public.tribes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (tribe_id, user_id)
);

create table if not exists public.discussions (
  id uuid primary key default gen_random_uuid(),
  tribe_id uuid not null references public.tribes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  question text not null,
  book_title text not null,
  chapter text default '',
  created_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  discussion_id uuid not null references public.discussions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists posts_created_at_idx on public.posts (created_at desc);
create index if not exists posts_user_id_idx on public.posts (user_id);
create index if not exists post_likes_post_id_idx on public.post_likes (post_id);
create index if not exists tribes_slug_idx on public.tribes (slug);
create index if not exists tribe_members_user_id_idx on public.tribe_members (user_id);
create index if not exists discussions_tribe_id_idx on public.discussions (tribe_id);
create index if not exists comments_discussion_id_idx on public.comments (discussion_id);

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  desired_username text;
  final_username text;
  counter integer := 0;
begin
  desired_username := regexp_replace(lower(coalesce(new.raw_user_meta_data ->> 'username', '')), '[^a-z0-9_]+', '', 'g');

  if desired_username = '' then
    desired_username := 'leitor_' || substr(new.id::text, 1, 8);
  end if;

  final_username := desired_username;

  while exists (
    select 1 from public.profiles
    where username = final_username
  ) loop
    counter := counter + 1;
    final_username := desired_username || '_' || counter::text;
  end loop;

  insert into public.profiles (
    id,
    name,
    username,
    bio,
    current_book,
    favorite_author,
    avatar_url
  ) values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), 'Leitor Retrobooks'),
    final_username,
    coalesce(new.raw_user_meta_data ->> 'bio', ''),
    coalesce(new.raw_user_meta_data ->> 'current_book', ''),
    coalesce(new.raw_user_meta_data ->> 'favorite_author', ''),
    nullif(new.raw_user_meta_data ->> 'avatar_url', '')
  )
  on conflict (id) do update set
    name = excluded.name,
    username = excluded.username,
    bio = excluded.bio,
    current_book = excluded.current_book,
    favorite_author = excluded.favorite_author,
    avatar_url = excluded.avatar_url;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_retrobooks on auth.users;
create trigger on_auth_user_created_retrobooks
after insert on auth.users
for each row execute function public.handle_new_user_profile();

create or replace function public.refresh_post_likes_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_post_id uuid;
begin
  if tg_op = 'DELETE' then
    target_post_id := old.post_id;
  else
    target_post_id := new.post_id;
  end if;

  update public.posts
  set likes_count = (
    select count(*) from public.post_likes
    where post_id = target_post_id
  )
  where id = target_post_id;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

drop trigger if exists refresh_post_likes_count_insert on public.post_likes;
drop trigger if exists refresh_post_likes_count_delete on public.post_likes;

create trigger refresh_post_likes_count_insert
after insert on public.post_likes
for each row execute function public.refresh_post_likes_count();

create trigger refresh_post_likes_count_delete
after delete on public.post_likes
for each row execute function public.refresh_post_likes_count();

create or replace function public.refresh_tribe_members_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_tribe_id uuid;
begin
  if tg_op = 'DELETE' then
    target_tribe_id := old.tribe_id;
  else
    target_tribe_id := new.tribe_id;
  end if;

  update public.tribes
  set members_count = (
    select count(*) from public.tribe_members
    where tribe_id = target_tribe_id
  )
  where id = target_tribe_id;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

drop trigger if exists refresh_tribe_members_count_insert on public.tribe_members;
drop trigger if exists refresh_tribe_members_count_delete on public.tribe_members;

create trigger refresh_tribe_members_count_insert
after insert on public.tribe_members
for each row execute function public.refresh_tribe_members_count();

create trigger refresh_tribe_members_count_delete
after delete on public.tribe_members
for each row execute function public.refresh_tribe_members_count();

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.tribes enable row level security;
alter table public.tribe_members enable row level security;
alter table public.discussions enable row level security;
alter table public.comments enable row level security;

drop policy if exists "Profiles are readable by everyone" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

create policy "Profiles are readable by everyone"
on public.profiles for select
using (true);

create policy "Users can insert own profile"
on public.profiles for insert
to authenticated
with check (auth.uid() = id);

create policy "Users can update own profile"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Posts are readable by everyone" on public.posts;
drop policy if exists "Authenticated users can create posts" on public.posts;
drop policy if exists "Users can update own posts" on public.posts;
drop policy if exists "Users can delete own posts" on public.posts;

create policy "Posts are readable by everyone"
on public.posts for select
using (true);

create policy "Authenticated users can create posts"
on public.posts for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own posts"
on public.posts for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own posts"
on public.posts for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Post likes are readable by everyone" on public.post_likes;
drop policy if exists "Users can like posts" on public.post_likes;
drop policy if exists "Users can remove own likes" on public.post_likes;

create policy "Post likes are readable by everyone"
on public.post_likes for select
using (true);

create policy "Users can like posts"
on public.post_likes for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can remove own likes"
on public.post_likes for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Tribes are readable by everyone" on public.tribes;
drop policy if exists "Authenticated users can create tribes" on public.tribes;
drop policy if exists "Users can update own tribes" on public.tribes;
drop policy if exists "Users can delete own tribes" on public.tribes;

create policy "Tribes are readable by everyone"
on public.tribes for select
using (true);

create policy "Authenticated users can create tribes"
on public.tribes for insert
to authenticated
with check (auth.uid() = created_by);

create policy "Users can update own tribes"
on public.tribes for update
to authenticated
using (auth.uid() = created_by)
with check (auth.uid() = created_by);

create policy "Users can delete own tribes"
on public.tribes for delete
to authenticated
using (auth.uid() = created_by);

drop policy if exists "Tribe members are readable by everyone" on public.tribe_members;
drop policy if exists "Users can join tribes" on public.tribe_members;
drop policy if exists "Users can leave tribes" on public.tribe_members;

create policy "Tribe members are readable by everyone"
on public.tribe_members for select
using (true);

create policy "Users can join tribes"
on public.tribe_members for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can leave tribes"
on public.tribe_members for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Discussions are readable by everyone" on public.discussions;
drop policy if exists "Authenticated users can create discussions" on public.discussions;
drop policy if exists "Users can update own discussions" on public.discussions;
drop policy if exists "Users can delete own discussions" on public.discussions;

create policy "Discussions are readable by everyone"
on public.discussions for select
using (true);

create policy "Authenticated users can create discussions"
on public.discussions for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own discussions"
on public.discussions for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own discussions"
on public.discussions for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Comments are readable by everyone" on public.comments;
drop policy if exists "Authenticated users can comment" on public.comments;
drop policy if exists "Users can update own comments" on public.comments;
drop policy if exists "Users can delete own comments" on public.comments;

create policy "Comments are readable by everyone"
on public.comments for select
using (true);

create policy "Authenticated users can comment"
on public.comments for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own comments"
on public.comments for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own comments"
on public.comments for delete
to authenticated
using (auth.uid() = user_id);

insert into public.tribes (
  created_by,
  name,
  slug,
  description,
  main_book_or_author,
  category
) values
  (null, 'Tribo Dostoiévski', 'tribo-dostoievski', 'Um salão para leitores que gostam de culpa, fé, liberdade e personagens que parecem carregar tempestades por dentro.', 'Fiódor Dostoiévski', 'Romance russo'),
  (null, 'Clube Machado de Assis', 'clube-machado-de-assis', 'Leituras com ironia fina, narradores suspeitos e conversas sobre memória, desejo e linguagem.', 'Machado de Assis', 'Clássicos brasileiros'),
  (null, 'Leituras Existenciais', 'leituras-existenciais', 'Para quem procura livros que olham para o vazio sem perder a delicadeza do pensamento.', 'Camus, Sartre, Clarice e Kafka', 'Existencialismo'),
  (null, 'Poesia e Devaneios', 'poesia-e-devaneios', 'Uma tribo para versos, imagens, silêncios e cadernos onde a vida aprende outra música.', 'Poesia', 'Poesia'),
  (null, 'Filosofia Antiga', 'filosofia-antiga', 'Leitores de Platão, Aristóteles, Sêneca e Marco Aurélio em busca de uma vida examinada com serenidade.', 'Filosofia clássica', 'Filosofia'),
  (null, 'Tolkien Sociedade', 'tolkien-sociedade', 'Mapas, línguas antigas, jornadas longas e aquela coragem pequena que nasce quando alguém decide continuar.', 'J. R. R. Tolkien', 'Fantasia clássica')
on conflict (slug) do nothing;

-- Social app evolution
alter table public.posts
add column if not exists author_name text,
add column if not exists image_url text;

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  title text,
  type text not null default 'direct' check (type in ('direct', 'club')),
  tribe_id uuid references public.tribes(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversation_members (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  unread_count integer not null default 0,
  created_at timestamptz not null default now(),
  unique (conversation_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;

drop policy if exists "Conversation members can read conversations" on public.conversations;
drop policy if exists "Authenticated users can create conversations" on public.conversations;
drop policy if exists "Conversation members are readable by members" on public.conversation_members;
drop policy if exists "Authenticated users can join conversations" on public.conversation_members;
drop policy if exists "Conversation members can read messages" on public.messages;
drop policy if exists "Conversation members can send messages" on public.messages;

create policy "Conversation members can read conversations"
on public.conversations for select
to authenticated
using (
  exists (
    select 1 from public.conversation_members cm
    where cm.conversation_id = conversations.id
    and cm.user_id = auth.uid()
  )
);

create policy "Authenticated users can create conversations"
on public.conversations for insert
to authenticated
with check (auth.uid() = created_by);

create policy "Conversation members are readable by members"
on public.conversation_members for select
to authenticated
using (
  exists (
    select 1 from public.conversation_members cm
    where cm.conversation_id = conversation_members.conversation_id
    and cm.user_id = auth.uid()
  )
);

create policy "Authenticated users can join conversations"
on public.conversation_members for insert
to authenticated
with check (
  auth.uid() = user_id
  or exists (
    select 1 from public.conversations c
    where c.id = conversation_members.conversation_id
    and c.created_by = auth.uid()
  )
);

create policy "Conversation members can read messages"
on public.messages for select
to authenticated
using (
  exists (
    select 1 from public.conversation_members cm
    where cm.conversation_id = messages.conversation_id
    and cm.user_id = auth.uid()
  )
);

create policy "Conversation members can send messages"
on public.messages for insert
to authenticated
with check (
  auth.uid() = sender_id
  and exists (
    select 1 from public.conversation_members cm
    where cm.conversation_id = messages.conversation_id
    and cm.user_id = auth.uid()
  )
);

-- Core social network evolution
create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  open_library_id text unique,
  title text not null,
  author text default '',
  cover_url text default '',
  description text default '',
  genre text default '',
  created_at timestamptz not null default now()
);

create table if not exists public.user_books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  status text not null default 'reading' check (status in ('reading', 'want_to_read', 'finished')),
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, book_id, status)
);

create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.book_topics (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (book_id, topic_id)
);

create table if not exists public.user_topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, topic_id)
);

create table if not exists public.saved_posts (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (requester_id <> addressee_id),
  unique (requester_id, addressee_id)
);

alter table public.profiles
add column if not exists current_book_id uuid references public.books(id) on delete set null,
add column if not exists updated_at timestamptz not null default now();

alter table public.posts
add column if not exists book_id uuid references public.books(id) on delete set null,
add column if not exists author_name text,
add column if not exists image_url text,
add column if not exists visibility text not null default 'public' check (visibility in ('public', 'tribe')),
add column if not exists updated_at timestamptz not null default now();

alter table public.conversations
add column if not exists book_id uuid references public.books(id) on delete set null;

create index if not exists books_title_idx on public.books using gin (to_tsvector('simple', title));
create index if not exists books_author_idx on public.books (author);
create index if not exists user_books_user_id_idx on public.user_books (user_id);
create index if not exists user_books_book_id_idx on public.user_books (book_id);
create index if not exists posts_book_id_idx on public.posts (book_id);
create index if not exists saved_posts_user_id_idx on public.saved_posts (user_id);
create index if not exists friendships_requester_idx on public.friendships (requester_id);
create index if not exists friendships_addressee_idx on public.friendships (addressee_id);
create index if not exists conversations_book_id_idx on public.conversations (book_id);

alter table public.books enable row level security;
alter table public.user_books enable row level security;
alter table public.topics enable row level security;
alter table public.book_topics enable row level security;
alter table public.user_topics enable row level security;
alter table public.saved_posts enable row level security;
alter table public.friendships enable row level security;

drop policy if exists "Books are readable by everyone" on public.books;
drop policy if exists "Authenticated users can create books" on public.books;
drop policy if exists "User books are readable by everyone" on public.user_books;
drop policy if exists "Users can manage own books" on public.user_books;
drop policy if exists "Topics are readable by everyone" on public.topics;
drop policy if exists "Authenticated users can create topics" on public.topics;
drop policy if exists "Book topics are readable by everyone" on public.book_topics;
drop policy if exists "Authenticated users can create book topics" on public.book_topics;
drop policy if exists "User topics are readable by everyone" on public.user_topics;
drop policy if exists "Users can manage own topics" on public.user_topics;
drop policy if exists "Saved posts are readable by owners" on public.saved_posts;
drop policy if exists "Users can save posts" on public.saved_posts;
drop policy if exists "Users can remove own saved posts" on public.saved_posts;
drop policy if exists "Friendships are readable by participants" on public.friendships;
drop policy if exists "Users can request friendship" on public.friendships;
drop policy if exists "Users can answer friendship requests" on public.friendships;

create policy "Books are readable by everyone"
on public.books for select
using (true);

create policy "Authenticated users can create books"
on public.books for insert
to authenticated
with check (true);

create policy "User books are readable by everyone"
on public.user_books for select
using (true);

create policy "Users can manage own books"
on public.user_books for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Topics are readable by everyone"
on public.topics for select
using (true);

create policy "Authenticated users can create topics"
on public.topics for insert
to authenticated
with check (true);

create policy "Book topics are readable by everyone"
on public.book_topics for select
using (true);

create policy "Authenticated users can create book topics"
on public.book_topics for insert
to authenticated
with check (true);

create policy "User topics are readable by everyone"
on public.user_topics for select
using (true);

create policy "Users can manage own topics"
on public.user_topics for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Saved posts are readable by owners"
on public.saved_posts for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can save posts"
on public.saved_posts for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can remove own saved posts"
on public.saved_posts for delete
to authenticated
using (auth.uid() = user_id);

create policy "Friendships are readable by participants"
on public.friendships for select
to authenticated
using (auth.uid() = requester_id or auth.uid() = addressee_id);

create policy "Users can request friendship"
on public.friendships for insert
to authenticated
with check (auth.uid() = requester_id);

create policy "Users can answer friendship requests"
on public.friendships for update
to authenticated
using (auth.uid() = addressee_id)
with check (auth.uid() = addressee_id);

insert into storage.buckets (id, name, public)
values ('post_images', 'post_images', true)
on conflict (id) do nothing;

drop policy if exists "Post images are public" on storage.objects;
drop policy if exists "Users can upload post images" on storage.objects;

create policy "Post images are public"
on storage.objects for select
using (bucket_id = 'post_images');

create policy "Users can upload post images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'post_images'
  and auth.uid()::text = (storage.foldername(name))[1]
);
