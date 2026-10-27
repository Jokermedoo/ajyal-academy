-- Ajyal Academy schema (Supabase/Postgres)

create table if not exists settings (
  key text primary key,
  value text not null default ''
);

create table if not exists subjects (
  id bigserial primary key,
  title text not null,
  description text not null default '',
  icon text not null default 'BookOpen',
  image text,
  sort_order integer not null default 0,
  visible integer not null default 1
);

create table if not exists activities (
  id bigserial primary key,
  title text not null,
  description text not null default '',
  image text,
  event_date text,
  visible integer not null default 1
);

create table if not exists gallery (
  id bigserial primary key,
  image text not null,
  caption text not null default '',
  visible integer not null default 1,
  sort_order integer not null default 0
);

create table if not exists courses (
  id bigserial primary key,
  title text not null,
  description text not null default '',
  image text,
  schedule text not null default '',
  visible integer not null default 1
);

create table if not exists users (
  id bigserial primary key,
  username text not null unique,
  password_hash text not null
);

-- Storage bucket (create manually in Supabase dashboard): "uploads" (public)