-- =============================================================================
-- Study Hub, Ablage: Supabase-Schema (PostgreSQL 15+)
-- =============================================================================
--
-- WAS DIESES SKRIPT TUT
--   Legt Tabellen, Regeln (Row Level Security), Funktionen, die zwei Speicher
--   (Buckets) und den Auth Hook für die Ablage an. Ausführen im Supabase-Dashboard:
--   SQL Editor, New query, ganzen Inhalt einfügen, Run. Das Skript darf beliebig
--   oft laufen (if not exists, create or replace, drop ... if exists), Daten
--   bleiben erhalten. Einrichtung Schritt für Schritt: supabase/README.md.
--
-- TABELLEN
--   allowed_logins      zugelassene Mail-Domains (students.hochschule.ch) und
--                       einzelne Adressen (für Ausnahmen wie die Moderation)
--   profiles            eine Zeile pro Person: Rolle, gesperrt, Regeln angenommen
--   programs            Studiengänge
--   modules             Module; ein Modul kann zu mehreren Studiengängen gehören
--   program_modules     Modul im Studiengang, mit Semester (leer: frei wählbar)
--   program_moderators  wer welchen Studiengang moderiert (vorerst nur per SQL)
--   documents           Formelsammlungen, Probeprüfungen, Prüfungen, Lösungen
--   reports             Meldungen zu Dokumenten
--   ratings             Einschätzung: Probeprüfung leichter oder schwerer als
--                       die echte Prüfung (-2 viel leichter bis +2 viel schwerer)
--   access_log          jeder Abruf eines Dokuments (für das Rate-Limit)
--
-- WER DARF WAS
--   ohne Login          Studiengänge und Module lesen, sonst nichts
--   angemeldet          eigenes Profil lesen, Regeln annehmen (nur zugelassene
--                       Mail-Adressen)
--   Mitglied            (zugelassen, Regeln angenommen, nicht gesperrt)
--                       freigegebene Dokumente sehen und abrufen (mit Grenze),
--                       hochladen, eigene offene Uploads zurückziehen, melden,
--                       Probeprüfungen einschätzen
--   Moderation          Dokumente der eigenen Studiengänge prüfen, korrigieren,
--                       freigeben, ablehnen, entfernen; Module pflegen
--   Admin               alles, dazu Studiengänge und zugelassene Adressen
--   Wer hochgeladen hat, sieht nur die Moderation (moderation_queue).
--
-- ABLAUF EINES DOKUMENTS
--   1. App: insert in documents mit eigener id (Status pending)
--   2. App: Datei nach eingang/<user_id>/<id>.pdf
--   3. Moderation: Original laden, Wasserzeichen im Browser (pdf-lib), Datei nach
--      freigegeben/<id>.pdf, dann approve_document(id)
--   4. Mitglied: request_document(id, 'view' | 'download') prüft die Grenze,
--      protokolliert und liefert den Pfad; der Speicher gibt die Datei nur mit
--      einem Abruf aus den letzten 2 Minuten heraus
--
-- FEHLER (message der Exception, die App übersetzt sie)
--   not_authenticated, email_not_allowed, not_member, not_allowed   (42501)
--   not_found (P0002), invalid_state, missing_file (55000),
--   note_required (22023), rate_limit (P0001),
--   solution_of_invalid, has_solutions (23514)
--   Prüfregeln heissen <tabelle>_<spalte>_check, eindeutige Indizes _uidx.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. Schema für interne Hilfsfunktionen
-- -----------------------------------------------------------------------------

-- Nicht über die API erreichbar; die Regeln (Policies) rufen diese Funktionen auf,
-- darum braucht die Rolle authenticated das Recht, das Schema zu benutzen.
create schema if not exists app_private;
revoke all on schema app_private from public, anon, authenticated;
grant usage on schema app_private to authenticated;


-- -----------------------------------------------------------------------------
-- 2. Tabellen
-- -----------------------------------------------------------------------------

create table if not exists public.allowed_logins (
  entry      text        not null primary key,
  note       text        not null default '',
  created_at timestamptz not null default now(),
  constraint allowed_logins_entry_check
    check (entry = lower(entry) and entry ~ '^([a-z0-9._%+-]+@)?[a-z0-9-]+(\.[a-z0-9-]+)+$'),
  constraint allowed_logins_note_check check (length(note) <= 200)
);

create table if not exists public.profiles (
  user_id           uuid        not null primary key references auth.users (id) on delete cascade,
  email             text        not null default '',
  role              text        not null default 'student',
  blocked           boolean     not null default false,
  rules_accepted_at timestamptz,
  created_at        timestamptz not null default now(),
  constraint profiles_role_check check (role in ('student', 'admin'))
);

create table if not exists public.programs (
  id         text        not null primary key,
  name       text        not null,
  sort_order integer     not null default 0,
  active     boolean     not null default true,
  created_at timestamptz not null default now(),
  constraint programs_id_check   check (id ~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,31}$'),
  constraint programs_name_check check (name ~ '\S' and length(name) <= 120)
);
create unique index if not exists programs_id_uidx on public.programs (lower(id));

create table if not exists public.modules (
  id         text        not null primary key,
  name       text        not null,
  active     boolean     not null default true,
  created_at timestamptz not null default now(),
  constraint modules_id_check   check (id ~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,31}$'),
  constraint modules_name_check check (name ~ '\S' and length(name) <= 160)
);
create unique index if not exists modules_id_uidx on public.modules (lower(id));

create table if not exists public.program_modules (
  program_id text     not null references public.programs (id) on update cascade on delete cascade,
  module_id  text     not null references public.modules (id) on update cascade on delete cascade,
  semester   smallint,
  primary key (program_id, module_id),
  constraint program_modules_semester_check check (semester between 1 and 12)
);
create index if not exists program_modules_module_idx on public.program_modules (module_id);

create table if not exists public.program_moderators (
  program_id text        not null references public.programs (id) on update cascade on delete cascade,
  user_id    uuid        not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (program_id, user_id)
);
create index if not exists program_moderators_user_idx on public.program_moderators (user_id);

create table if not exists public.documents (
  id                 uuid        not null default gen_random_uuid() primary key,
  title              text        not null,
  doc_type           text        not null,
  module_id          text        not null references public.modules (id) on update cascade,
  solution_of        uuid        references public.documents (id) on delete cascade,
  solution_kind      text,
  includes_solution  boolean     not null default false,
  year               smallint    not null,
  term               text,
  author             text        not null,
  provenance         text        not null default 'studierende',
  alumni_year        smallint,
  old_plan_module    text,
  description        text        not null default '',
  linked_formula_ids text[]      not null default '{}',
  page_count         integer     not null,
  size_bytes         bigint      not null,
  sha256             text        not null,
  status             text        not null default 'pending',
  uploaded_by        uuid        default auth.uid() references auth.users (id) on delete set null,
  original_path      text,
  public_path        text,
  review_note        text        not null default '',
  reviewed_by        uuid        references auth.users (id) on delete set null,
  reviewed_at        timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint documents_title_check     check (title ~ '\S' and length(title) <= 160),
  constraint documents_doc_type_check  check (doc_type in ('pruefung', 'probepruefung', 'formelsammlung', 'loesung')),
  -- Eine Lösung gehört immer zu einer Prüfung oder Probeprüfung
  constraint documents_solution_of_check check ((doc_type = 'loesung') = (solution_of is not null)),
  constraint documents_solution_kind_check check (
    (doc_type = 'loesung' and solution_kind is not null and solution_kind in ('offiziell', 'studierende'))
    or (doc_type <> 'loesung' and solution_kind is null)),
  constraint documents_includes_solution_check check (not includes_solution or doc_type in ('pruefung', 'probepruefung')),
  constraint documents_year_check      check (year between 1990 and 2100),
  constraint documents_term_check      check (term in ('HS', 'FS')),
  constraint documents_author_check    check (author ~ '\S' and length(author) <= 160),
  constraint documents_provenance_check check (provenance in ('studierende', 'alumni')),
  constraint documents_alumni_year_check check (
    (provenance = 'alumni' and alumni_year is not null and alumni_year between 1990 and 2100)
    or (provenance <> 'alumni' and alumni_year is null)),
  constraint documents_old_plan_module_check check (length(old_plan_module) <= 160),
  constraint documents_description_check check (length(description) <= 1000),
  constraint documents_linked_formula_ids_check check (cardinality(linked_formula_ids) <= 200),
  constraint documents_page_count_check check (page_count between 1 and 2000),
  constraint documents_size_bytes_check check (size_bytes between 1 and 20971520),
  constraint documents_sha256_check    check (sha256 ~ '^[0-9a-f]{64}$'),
  constraint documents_status_check    check (status in ('pending', 'approved', 'rejected', 'removed')),
  constraint documents_public_path_check check (status <> 'approved' or public_path is not null),
  constraint documents_review_note_check check (length(review_note) <= 1000)
);
create index if not exists documents_module_idx on public.documents (module_id, status);
create index if not exists documents_solution_of_idx on public.documents (solution_of);
create index if not exists documents_uploaded_by_idx on public.documents (uploaded_by);
create index if not exists documents_formula_idx on public.documents using gin (linked_formula_ids);
create unique index if not exists documents_public_path_uidx on public.documents (public_path);
-- Dieselbe Datei nur einmal; nach einer Ablehnung darf sie neu kommen, nach dem
-- Entfernen (z. B. auf Wunsch der Dozentin) nicht
create unique index if not exists documents_sha256_uidx on public.documents (sha256) where status <> 'rejected';

create table if not exists public.reports (
  id          uuid        not null default gen_random_uuid() primary key,
  document_id uuid        not null references public.documents (id) on delete cascade,
  reported_by uuid        default auth.uid() references auth.users (id) on delete set null,
  reason      text        not null,
  message     text        not null default '',
  created_at  timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid        references auth.users (id) on delete set null,
  resolution  text        not null default '',
  constraint reports_reason_check
    check (reason in ('urheberrecht', 'unterrichtsunterlage', 'falsche-angaben', 'qualitaet', 'anderes')),
  constraint reports_message_check    check (length(message) <= 1000),
  constraint reports_resolution_check check (length(resolution) <= 1000)
);
create index if not exists reports_document_idx on public.reports (document_id);
create unique index if not exists reports_open_uidx on public.reports (document_id, reported_by) where resolved_at is null;

create table if not exists public.ratings (
  document_id uuid        not null references public.documents (id) on delete cascade,
  user_id     uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  value       smallint    not null,
  updated_at  timestamptz not null default now(),
  primary key (document_id, user_id),
  constraint ratings_value_check check (value between -2 and 2)
);

create table if not exists public.access_log (
  id          bigint      generated always as identity primary key,
  user_id     uuid        not null references auth.users (id) on delete cascade,
  document_id uuid        not null references public.documents (id) on delete cascade,
  action      text        not null,
  created_at  timestamptz not null default now(),
  constraint access_log_action_check check (action in ('view', 'download'))
);
create index if not exists access_log_user_idx on public.access_log (user_id, created_at);
create index if not exists access_log_document_idx on public.access_log (document_id, user_id, created_at);


-- -----------------------------------------------------------------------------
-- 3. Hilfsfunktionen für die Regeln
-- -----------------------------------------------------------------------------

-- Mail-Adresse aus dem Token der Anmeldung, klein geschrieben
create or replace function app_private.jwt_email()
returns text
language sql
stable
set search_path = ''
as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''))
$$;

-- Steht die Adresse oder ihre Domain in allowed_logins? (Unterdomains zählen nicht)
create or replace function app_private.email_allowed(p_email text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(p_email, '') ~ '^[^@[:space:]]+@[^@[:space:]]+$'
     and exists (
       select 1 from public.allowed_logins l
        where l.entry in (lower(p_email), lower(split_part(p_email, '@', 2))))
$$;

create or replace function app_private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
     where p.user_id = auth.uid() and p.role = 'admin' and not p.blocked)
$$;

-- Mitglied: Regeln angenommen, nicht gesperrt, Adresse zugelassen (Admin immer)
create or replace function app_private.is_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
     where p.user_id = auth.uid()
       and not p.blocked
       and p.rules_accepted_at is not null
       and (p.role = 'admin' or app_private.email_allowed(app_private.jwt_email())))
$$;

create or replace function app_private.is_moderator()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select app_private.is_admin()
      or (app_private.is_member()
          and exists (select 1 from public.program_moderators m where m.user_id = auth.uid()))
$$;

create or replace function app_private.can_moderate_program(p_program text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select app_private.is_admin()
      or (app_private.is_member()
          and exists (select 1 from public.program_moderators m
                       where m.program_id = p_program and m.user_id = auth.uid()))
$$;

-- Moderation eines Moduls: über einen der Studiengänge, zu denen es gehört
create or replace function app_private.can_moderate_module(p_module text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select app_private.is_admin()
      or (app_private.is_member()
          and exists (select 1 from public.program_moderators m
                        join public.program_modules pm on pm.program_id = m.program_id
                       where pm.module_id = p_module and m.user_id = auth.uid()))
$$;

-- Speicher eingang: hochladen nur auf den eigenen, offenen Eintrag
create or replace function app_private.may_upload_original(p_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select app_private.is_member()
     and exists (select 1 from public.documents d
                  where d.original_path = p_name and d.uploaded_by = auth.uid() and d.status = 'pending')
$$;

create or replace function app_private.may_read_original(p_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.documents d
                  where d.original_path = p_name
                    and (d.uploaded_by = auth.uid() or app_private.can_moderate_module(d.module_id)))
$$;

create or replace function app_private.may_delete_original(p_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.documents d
                  where d.original_path = p_name
                    and ((d.uploaded_by = auth.uid() and d.status = 'pending')
                         or app_private.can_moderate_module(d.module_id)))
$$;

-- Speicher freigegeben: schreiben nur die Moderation, Name <id>.pdf
create or replace function app_private.may_write_public(p_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.documents d
                  where d.id::text || '.pdf' = p_name and app_private.can_moderate_module(d.module_id))
$$;

-- Lesen: Moderation immer, Mitglieder nur mit einem Abruf aus den letzten 2 Minuten
create or replace function app_private.may_read_public(p_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select app_private.may_write_public(p_name)
      or exists (
        select 1 from public.documents d
         where d.public_path = p_name
           and d.status = 'approved'
           and app_private.is_member()
           and exists (select 1 from public.access_log a
                        where a.document_id = d.id and a.user_id = auth.uid()
                          and a.created_at > now() - interval '2 minutes'))
$$;


-- -----------------------------------------------------------------------------
-- 4. Trigger auf documents
-- -----------------------------------------------------------------------------

create or replace function app_private.documents_before_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  exam_type   text;
  exam_module text;
  exam_status text;
begin
  new.title := btrim(new.title);
  new.author := btrim(new.author);
  new.description := btrim(coalesce(new.description, ''));
  new.old_plan_module := nullif(btrim(new.old_plan_module), '');
  if tg_op = 'INSERT' then
    new.original_path := coalesce(new.uploaded_by::text, 'ohne-konto') || '/' || new.id::text || '.pdf';
    new.updated_at := now();
  else
    -- Datei und Herkunft ändern sich nach dem Hochladen nicht mehr
    new.id := old.id;
    new.uploaded_by := old.uploaded_by;
    new.original_path := old.original_path;
    new.sha256 := old.sha256;
    new.size_bytes := old.size_bytes;
    new.page_count := old.page_count;
    new.created_at := old.created_at;
    new.updated_at := now();
    if old.doc_type in ('pruefung', 'probepruefung')
       and new.doc_type not in ('pruefung', 'probepruefung')
       and exists (select 1 from public.documents s where s.solution_of = old.id) then
      raise exception 'has_solutions' using errcode = '23514';
    end if;
  end if;
  -- Nur bei direkten Änderungen; beim Umbenennen eines Moduls (Fremdschlüssel) oder
  -- beim Nachziehen der Lösungen (Trigger unten) ist die Prüfung schon passend
  if new.solution_of is not null and pg_trigger_depth() = 1 then
    select d.doc_type, d.module_id, d.status into exam_type, exam_module, exam_status
      from public.documents d where d.id = new.solution_of;
    if exam_type is null or exam_type not in ('pruefung', 'probepruefung')
       or (tg_op = 'INSERT' and exam_status <> 'approved') then
      raise exception 'solution_of_invalid' using errcode = '23514';
    end if;
    -- Eine Lösung liegt immer beim Modul ihrer Prüfung
    new.module_id := exam_module;
  end if;
  return new;
end
$$;

-- Wechselt eine Prüfung das Modul, ziehen ihre Lösungen mit
create or replace function app_private.documents_after_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.documents s set module_id = new.module_id
   where s.solution_of = new.id and s.module_id <> new.module_id;
  return null;
end
$$;

drop trigger if exists documents_before_write on public.documents;
create trigger documents_before_write
  before insert or update on public.documents
  for each row execute function app_private.documents_before_write();

drop trigger if exists documents_after_update on public.documents;
create trigger documents_after_update
  after update of module_id on public.documents
  for each row when (old.module_id is distinct from new.module_id)
  execute function app_private.documents_after_update();


-- -----------------------------------------------------------------------------
-- 5. Row Level Security
-- -----------------------------------------------------------------------------

alter table public.allowed_logins     enable row level security;
alter table public.profiles           enable row level security;
alter table public.programs           enable row level security;
alter table public.modules            enable row level security;
alter table public.program_modules    enable row level security;
alter table public.program_moderators enable row level security;
alter table public.documents          enable row level security;
alter table public.reports            enable row level security;
alter table public.ratings            enable row level security;
alter table public.access_log         enable row level security;
-- reports, ratings und access_log: keine Policies, Zugriff nur über die Funktionen

drop policy if exists allowed_logins_admin on public.allowed_logins;
create policy allowed_logins_admin on public.allowed_logins for all to authenticated
  using ((select app_private.is_admin())) with check ((select app_private.is_admin()));

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (user_id = (select auth.uid()) or (select app_private.is_admin()));

-- Studiengänge: lesen alle, anlegen und löschen der Admin, ändern auch die Moderation
drop policy if exists programs_select on public.programs;
create policy programs_select on public.programs for select to anon, authenticated using (true);
drop policy if exists programs_insert on public.programs;
create policy programs_insert on public.programs for insert to authenticated
  with check ((select app_private.is_admin()));
drop policy if exists programs_update on public.programs;
create policy programs_update on public.programs for update to authenticated
  using (app_private.can_moderate_program(id)) with check (app_private.can_moderate_program(id));
drop policy if exists programs_delete on public.programs;
create policy programs_delete on public.programs for delete to authenticated
  using ((select app_private.is_admin()));

-- Module: neu anlegen darf jede Moderation, ändern nur die der eigenen Studiengänge
drop policy if exists modules_select on public.modules;
create policy modules_select on public.modules for select to anon, authenticated using (true);
drop policy if exists modules_insert on public.modules;
create policy modules_insert on public.modules for insert to authenticated
  with check ((select app_private.is_moderator()));
drop policy if exists modules_update on public.modules;
create policy modules_update on public.modules for update to authenticated
  using (app_private.can_moderate_module(id)) with check (app_private.can_moderate_module(id));
drop policy if exists modules_delete on public.modules;
create policy modules_delete on public.modules for delete to authenticated
  using ((select app_private.is_admin()));

drop policy if exists program_modules_select on public.program_modules;
create policy program_modules_select on public.program_modules for select to anon, authenticated using (true);
drop policy if exists program_modules_write on public.program_modules;
create policy program_modules_write on public.program_modules for all to authenticated
  using (app_private.can_moderate_program(program_id)) with check (app_private.can_moderate_program(program_id));

drop policy if exists program_moderators_select on public.program_moderators;
create policy program_moderators_select on public.program_moderators for select to authenticated
  using (user_id = (select auth.uid()) or (select app_private.is_admin()));
drop policy if exists program_moderators_admin on public.program_moderators;
create policy program_moderators_admin on public.program_moderators for all to authenticated
  using ((select app_private.is_admin())) with check ((select app_private.is_admin()));

-- Dokumente: Mitglieder sehen freigegebene, alle ihre eigenen, die Moderation die
-- ihrer Module. Status, Prüfung und Pfade ändern nur die Funktionen in Abschnitt 7.
drop policy if exists documents_select on public.documents;
create policy documents_select on public.documents for select to authenticated
  using ((status = 'approved' and (select app_private.is_member()))
         or uploaded_by = (select auth.uid())
         or app_private.can_moderate_module(module_id));
drop policy if exists documents_insert on public.documents;
create policy documents_insert on public.documents for insert to authenticated
  with check (uploaded_by = (select auth.uid()) and status = 'pending' and (select app_private.is_member()));
drop policy if exists documents_update on public.documents;
create policy documents_update on public.documents for update to authenticated
  using (app_private.can_moderate_module(module_id)) with check (app_private.can_moderate_module(module_id));
drop policy if exists documents_delete on public.documents;
create policy documents_delete on public.documents for delete to authenticated
  using (uploaded_by = (select auth.uid()) and status = 'pending');


-- -----------------------------------------------------------------------------
-- 6. Rechte auf Tabellen
-- -----------------------------------------------------------------------------

-- Supabase gibt anon und authenticated standardmässig alle Rechte; hier nur das Nötige
revoke all on public.allowed_logins, public.profiles, public.programs, public.modules,
  public.program_modules, public.program_moderators, public.documents, public.reports,
  public.ratings, public.access_log from public, anon, authenticated;

grant select, insert, update, delete on public.allowed_logins to authenticated;
grant select on public.profiles to authenticated;
grant select on public.programs, public.modules, public.program_modules to anon, authenticated;
grant insert, update, delete on public.programs, public.modules, public.program_modules to authenticated;
grant select, insert, delete on public.program_moderators to authenticated;

-- Wer hochgeladen hat (uploaded_by, original_path), Prüfsumme und Notizen der
-- Moderation bleiben verborgen. Die App fragt darum nie select=*, sondern Spalten.
grant select (id, title, doc_type, module_id, solution_of, solution_kind, includes_solution, year, term,
              author, provenance, alumni_year, old_plan_module, description, linked_formula_ids,
              page_count, size_bytes, status, reviewed_at, created_at)
  on public.documents to authenticated;
grant insert (id, title, doc_type, module_id, solution_of, solution_kind, includes_solution, year, term,
              author, provenance, alumni_year, old_plan_module, description, linked_formula_ids,
              page_count, size_bytes, sha256)
  on public.documents to authenticated;
grant update (title, doc_type, module_id, solution_of, solution_kind, includes_solution, year, term,
              author, provenance, alumni_year, old_plan_module, description, linked_formula_ids)
  on public.documents to authenticated;
grant delete on public.documents to authenticated;

revoke all on all functions in schema app_private from public, anon, authenticated;
grant execute on function
  app_private.jwt_email(), app_private.email_allowed(text), app_private.is_admin(),
  app_private.is_member(), app_private.is_moderator(), app_private.can_moderate_program(text),
  app_private.can_moderate_module(text), app_private.may_upload_original(text),
  app_private.may_read_original(text), app_private.may_delete_original(text),
  app_private.may_write_public(text), app_private.may_read_public(text)
  to authenticated;


-- -----------------------------------------------------------------------------
-- 7. Funktionen für die App (supabase.rpc)
-- -----------------------------------------------------------------------------

-- Wer bin ich? Für die Anzeige in der App; die Rechte prüft die Datenbank selbst.
create or replace function public.me()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'user_id', auth.uid(),
    'email', app_private.jwt_email(),
    'email_allowed', app_private.email_allowed(app_private.jwt_email()),
    'rules_accepted', coalesce(p.rules_accepted_at is not null, false),
    'blocked', coalesce(p.blocked, false),
    'member', app_private.is_member(),
    'admin', app_private.is_admin(),
    'moderates', coalesce((select jsonb_agg(m.program_id order by m.program_id)
                             from public.program_moderators m where m.user_id = auth.uid()), '[]'::jsonb))
  from (select 1) as one
  left join public.profiles p on p.user_id = auth.uid()
$$;

-- Nutzungsregeln annehmen; legt das Profil an
create or replace function public.accept_rules()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid  uuid := auth.uid();
  mail text := app_private.jwt_email();
begin
  if uid is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  if not app_private.email_allowed(mail)
     and not exists (select 1 from public.profiles p where p.user_id = uid and p.role = 'admin') then
    raise exception 'email_not_allowed' using errcode = '42501';
  end if;
  insert into public.profiles (user_id, email, rules_accepted_at)
  values (uid, mail, now())
  on conflict (user_id) do update set rules_accepted_at = now(), email = excluded.email;
end
$$;

-- Für die Anmeldeseite: zugelassene Domains (einzelne Adressen bleiben verborgen)
create or replace function public.login_domains()
returns setof text
language sql
stable
security definer
set search_path = ''
as $$
  select l.entry from public.allowed_logins l where position('@' in l.entry) = 0 order by l.entry
$$;

create or replace function public.my_uploads()
returns setof jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
      'id', d.id, 'title', d.title, 'doc_type', d.doc_type, 'module_id', d.module_id,
      'status', d.status, 'review_note', d.review_note, 'created_at', d.created_at,
      'reviewed_at', d.reviewed_at, 'original_path', d.original_path)
    from public.documents d
   where d.uploaded_by = auth.uid()
   order by d.created_at desc
$$;

-- Dokumente mit diesem Status in den Modulen, die ich moderiere, mit Absender
create or replace function public.moderation_queue(p_status text default 'pending')
returns setof jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select to_jsonb(d) || jsonb_build_object(
      'uploader_email', coalesce(p.email, ''),
      'open_reports', (select count(*) from public.reports r
                        where r.document_id = d.id and r.resolved_at is null))
    from public.documents d
    left join public.profiles p on p.user_id = d.uploaded_by
   where d.status = p_status and app_private.can_moderate_module(d.module_id)
   order by d.created_at
$$;

-- Freigeben, nachdem die Fassung mit Wasserzeichen unter freigegeben/<id>.pdf liegt.
-- Auch für freigegebene Dokumente, wenn das Wasserzeichen neu erzeugt wurde.
create or replace function public.approve_document(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  d    public.documents;
  path text := p_id::text || '.pdf';
begin
  select * into d from public.documents where id = p_id for update;
  if not found then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  if not app_private.can_moderate_module(d.module_id) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if d.status not in ('pending', 'approved') then
    raise exception 'invalid_state' using errcode = '55000';
  end if;
  if not exists (select 1 from storage.objects o where o.bucket_id = 'freigegeben' and o.name = path) then
    raise exception 'missing_file' using errcode = '55000';
  end if;
  update public.documents
     set status = 'approved', public_path = path, review_note = '',
         reviewed_by = auth.uid(), reviewed_at = now()
   where id = p_id;
end
$$;

-- Ablehnen mit Begründung; liefert den Pfad des Originals zum Löschen
create or replace function public.reject_document(p_id uuid, p_note text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  d public.documents;
begin
  select * into d from public.documents where id = p_id for update;
  if not found then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  if not app_private.can_moderate_module(d.module_id) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if d.status <> 'pending' then
    raise exception 'invalid_state' using errcode = '55000';
  end if;
  if coalesce(btrim(p_note), '') = '' then
    raise exception 'note_required' using errcode = '22023';
  end if;
  update public.documents
     set status = 'rejected', review_note = btrim(p_note), reviewed_by = auth.uid(), reviewed_at = now()
   where id = p_id;
  return d.original_path;
end
$$;

-- Freigegebenes Dokument entfernen, zusammen mit seinen Lösungen. Der Eintrag bleibt
-- (dieselbe Datei kann nicht wieder hochgeladen werden). Liefert die Dateien, die die
-- App danach löscht: {"bucket": "...", "path": "..."}.
create or replace function public.remove_document(p_id uuid, p_note text)
returns setof jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  d public.documents;
begin
  select * into d from public.documents where id = p_id for update;
  if not found then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  if not app_private.can_moderate_module(d.module_id) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if d.status <> 'approved' then
    raise exception 'invalid_state' using errcode = '55000';
  end if;
  if coalesce(btrim(p_note), '') = '' then
    raise exception 'note_required' using errcode = '22023';
  end if;
  update public.reports r
     set resolved_at = now(), resolved_by = auth.uid(), resolution = 'entfernt'
   where r.resolved_at is null
     and r.document_id in (select x.id from public.documents x where x.id = p_id or x.solution_of = p_id);
  return query
    with gone as (
      update public.documents x
         set status = 'removed', review_note = btrim(p_note), reviewed_by = auth.uid(), reviewed_at = now()
       where (x.id = p_id or x.solution_of = p_id) and x.status in ('pending', 'approved')
      returning x.original_path, x.public_path)
    select jsonb_build_object('bucket', 'eingang', 'path', g.original_path) from gone g where g.original_path is not null
    union all
    select jsonb_build_object('bucket', 'freigegeben', 'path', g.public_path) from gone g where g.public_path is not null;
end
$$;

-- Abruf eines Dokuments: prüft Rechte und Grenze, protokolliert, liefert den Pfad im
-- Speicher freigegeben. Gezählt werden verschiedene Dokumente; was man in den letzten
-- 24 Stunden schon geöffnet hat, geht immer. Die Moderation hat keine Grenze.
create or replace function public.request_document(p_id uuid, p_action text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  -- Grenzen pro Person: verschiedene Dokumente pro Stunde und pro Tag
  view_hour     constant integer := 60;
  view_day      constant integer := 200;
  download_hour constant integer := 10;
  download_day  constant integer := 30;
  uid    uuid := auth.uid();
  d      public.documents;
  n_hour integer;
  n_day  integer;
  max_hour integer;
  max_day  integer;
begin
  if p_action is null or p_action not in ('view', 'download') then
    raise exception 'invalid_action' using errcode = '22023';
  end if;
  max_hour := case p_action when 'view' then view_hour else download_hour end;
  max_day := case p_action when 'view' then view_day else download_day end;
  select * into d from public.documents where id = p_id;
  if not found or d.public_path is null then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  if not app_private.can_moderate_module(d.module_id) then
    if not app_private.is_member() then
      raise exception 'not_member' using errcode = '42501';
    end if;
    if d.status <> 'approved' then
      raise exception 'not_found' using errcode = 'P0002';
    end if;
    if not exists (select 1 from public.access_log a
                    where a.user_id = uid and a.document_id = p_id and a.action = p_action
                      and a.created_at > now() - interval '1 day') then
      select count(distinct a.document_id) filter (where a.created_at > now() - interval '1 hour'),
             count(distinct a.document_id)
        into n_hour, n_day
        from public.access_log a
       where a.user_id = uid and a.action = p_action and a.created_at > now() - interval '1 day';
      if n_hour >= max_hour or n_day >= max_day then
        raise exception 'rate_limit' using errcode = 'P0001';
      end if;
    end if;
  end if;
  insert into public.access_log (user_id, document_id, action) values (uid, p_id, p_action);
  return d.public_path;
end
$$;

-- Melden; eine offene Meldung pro Person und Dokument (erneutes Melden ersetzt sie)
create or replace function public.report_document(p_id uuid, p_reason text, p_message text default '')
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not app_private.is_member() then
    raise exception 'not_member' using errcode = '42501';
  end if;
  if not exists (select 1 from public.documents d where d.id = p_id and d.status = 'approved') then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  insert into public.reports (document_id, reported_by, reason, message)
  values (p_id, auth.uid(), p_reason, btrim(coalesce(p_message, '')))
  on conflict (document_id, reported_by) where resolved_at is null
  do update set reason = excluded.reason, message = excluded.message, created_at = now();
end
$$;

create or replace function public.moderation_reports()
returns setof jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
      'id', r.id, 'document_id', r.document_id, 'reason', r.reason, 'message', r.message,
      'created_at', r.created_at, 'title', d.title, 'module_id', d.module_id,
      'doc_type', d.doc_type, 'status', d.status)
    from public.reports r
    join public.documents d on d.id = r.document_id
   where r.resolved_at is null and app_private.can_moderate_module(d.module_id)
   order by r.created_at
$$;

create or replace function public.resolve_report(p_id uuid, p_resolution text default '')
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  mod_id text;
begin
  select d.module_id into mod_id
    from public.reports r join public.documents d on d.id = r.document_id
   where r.id = p_id;
  if not found then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  if not app_private.can_moderate_module(mod_id) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  update public.reports
     set resolved_at = now(), resolved_by = auth.uid(), resolution = btrim(coalesce(p_resolution, ''))
   where id = p_id and resolved_at is null;
end
$$;

-- Einschätzung einer Probeprüfung: -2 viel leichter ... +2 viel schwerer als die
-- echte Prüfung; null löscht die eigene Einschätzung
create or replace function public.rate_document(p_id uuid, p_value smallint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not app_private.is_member() then
    raise exception 'not_member' using errcode = '42501';
  end if;
  if not exists (select 1 from public.documents d
                  where d.id = p_id and d.status = 'approved' and d.doc_type = 'probepruefung') then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  if p_value is null then
    delete from public.ratings where document_id = p_id and user_id = auth.uid();
  else
    insert into public.ratings (document_id, user_id, value) values (p_id, auth.uid(), p_value)
    on conflict (document_id, user_id) do update set value = excluded.value, updated_at = now();
  end if;
end
$$;

-- Verteilung der Einschätzungen pro Probeprüfung eines Moduls: counts[0] zählt -2,
-- counts[4] zählt +2; mine ist die eigene Einschätzung
create or replace function public.rating_summary(p_module text)
returns setof jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
      'document_id', d.id,
      'counts', jsonb_build_array(
        count(r.value) filter (where r.value = -2), count(r.value) filter (where r.value = -1),
        count(r.value) filter (where r.value = 0), count(r.value) filter (where r.value = 1),
        count(r.value) filter (where r.value = 2)),
      'mine', max(r.value) filter (where r.user_id = auth.uid()))
    from public.documents d
    left join public.ratings r on r.document_id = d.id
   where app_private.is_member() and d.status = 'approved' and d.doc_type = 'probepruefung'
     and d.module_id = p_module
   group by d.id
$$;

-- Nur angemeldete Personen; login_domains auch ohne Login
revoke all on function
  public.me(), public.accept_rules(), public.login_domains(), public.my_uploads(),
  public.moderation_queue(text), public.approve_document(uuid), public.reject_document(uuid, text),
  public.remove_document(uuid, text), public.request_document(uuid, text),
  public.report_document(uuid, text, text), public.moderation_reports(), public.resolve_report(uuid, text),
  public.rate_document(uuid, smallint), public.rating_summary(text)
  from public, anon, authenticated;
grant execute on function
  public.me(), public.accept_rules(), public.login_domains(), public.my_uploads(),
  public.moderation_queue(text), public.approve_document(uuid), public.reject_document(uuid, text),
  public.remove_document(uuid, text), public.request_document(uuid, text),
  public.report_document(uuid, text, text), public.moderation_reports(), public.resolve_report(uuid, text),
  public.rate_document(uuid, smallint), public.rating_summary(text)
  to authenticated;
grant execute on function public.login_domains() to anon;


-- -----------------------------------------------------------------------------
-- 8. Speicher: zwei private Buckets
-- -----------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('eingang', 'eingang', false, 20971520, array['application/pdf']),
       ('freigegeben', 'freigegeben', false, 26214400, array['application/pdf'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists ablage_eingang_insert on storage.objects;
create policy ablage_eingang_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'eingang' and app_private.may_upload_original(name));
drop policy if exists ablage_eingang_select on storage.objects;
create policy ablage_eingang_select on storage.objects for select to authenticated
  using (bucket_id = 'eingang' and app_private.may_read_original(name));
drop policy if exists ablage_eingang_delete on storage.objects;
create policy ablage_eingang_delete on storage.objects for delete to authenticated
  using (bucket_id = 'eingang' and app_private.may_delete_original(name));

drop policy if exists ablage_freigegeben_select on storage.objects;
create policy ablage_freigegeben_select on storage.objects for select to authenticated
  using (bucket_id = 'freigegeben' and app_private.may_read_public(name));
drop policy if exists ablage_freigegeben_insert on storage.objects;
create policy ablage_freigegeben_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'freigegeben' and app_private.may_write_public(name));
drop policy if exists ablage_freigegeben_update on storage.objects;
create policy ablage_freigegeben_update on storage.objects for update to authenticated
  using (bucket_id = 'freigegeben' and app_private.may_write_public(name))
  with check (bucket_id = 'freigegeben' and app_private.may_write_public(name));
drop policy if exists ablage_freigegeben_delete on storage.objects;
create policy ablage_freigegeben_delete on storage.objects for delete to authenticated
  using (bucket_id = 'freigegeben' and app_private.may_write_public(name));


-- -----------------------------------------------------------------------------
-- 9. Auth Hook «Before User Created»: nur zugelassene Mail-Adressen
-- -----------------------------------------------------------------------------
-- Einschalten: Authentication, Hooks, «Before User Created», Postgres,
-- Funktion public.hook_before_user_created. Ohne Hook entsteht zwar ein Konto,
-- es sieht aber nichts (is_member prüft die Adresse ebenfalls).

create or replace function public.hook_before_user_created(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if app_private.email_allowed(event -> 'user' ->> 'email') then
    return '{}'::jsonb;
  end if;
  return jsonb_build_object('error', jsonb_build_object(
    'http_code', 403,
    'message', 'Nur Mail-Adressen für Studierende der Hochschule sind zugelassen.'));
end
$$;

revoke all on function public.hook_before_user_created(jsonb) from public, anon, authenticated;
grant execute on function public.hook_before_user_created(jsonb) to supabase_auth_admin;
