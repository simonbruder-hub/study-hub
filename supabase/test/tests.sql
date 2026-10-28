-- =============================================================================
-- Tests für supabase/schema.sql (ausgeführt von run.sh mit ON_ERROR_STOP=1).
-- Jede Prüfung meldet «ok ...»; die erste fehlgeschlagene bricht den Lauf ab.
--
-- Rollenwechsel wie in Supabase (PostgREST):
--   set role authenticated; set request.jwt.claims = '{"sub": ..., "email": ...}';
-- Personen:
--   Anna, Eva   Studierende (students.example.ch)
--   Ben         Studierender, moderiert den Studiengang ME
--   Carla       fremde Adresse (gmail.com), nicht zugelassen
--   Simon       Admin, als einzelne Adresse zugelassen (simon@example.org)
-- Den Speicher spielt der Test nach: hochladen = insert in storage.objects,
-- herunterladen = select, löschen = delete, jeweils als angemeldete Person.
-- =============================================================================

\set ON_ERROR_STOP 1
\o /dev/null

\set als_anna  'set role authenticated; set request.jwt.claims = ''{"sub":"00000000-0000-4000-8000-0000000000a1","email":"anna@students.example.ch"}'';'
\set als_ben   'set role authenticated; set request.jwt.claims = ''{"sub":"00000000-0000-4000-8000-0000000000b1","email":"Ben@Students.Example.CH"}'';'
\set als_carla 'set role authenticated; set request.jwt.claims = ''{"sub":"00000000-0000-4000-8000-0000000000c1","email":"carla@gmail.com"}'';'
\set als_eva   'set role authenticated; set request.jwt.claims = ''{"sub":"00000000-0000-4000-8000-0000000000e1","email":"eva@students.example.ch"}'';'
\set als_simon 'set role authenticated; set request.jwt.claims = ''{"sub":"00000000-0000-4000-8000-0000000000f1","email":"simon@example.org"}'';'
\set als_anon  'set role anon; set request.jwt.claims = ''{"role":"anon"}'';'
\set als_admin 'reset role; reset request.jwt.claims;'


-- -----------------------------------------------------------------------------
-- Hilfsfunktionen
-- -----------------------------------------------------------------------------

create schema test;
grant usage on schema test to public;

create function test.section(title text) returns void
language plpgsql as $$
begin
  raise notice '── %', title;
end $$;

create function test.pass(msg text) returns void
language plpgsql as $$
begin
  perform set_config('test.passed', (coalesce(nullif(current_setting('test.passed', true), ''), '0')::int + 1)::text, false);
  raise notice '   ok  %', msg;
end $$;

create function test.ok(cond boolean, msg text) returns void
language plpgsql as $$
begin
  if cond is distinct from true then
    raise exception 'FEHLGESCHLAGEN: %', msg;
  end if;
  perform test.pass(msg);
end $$;

create function test.eq(actual anycompatible, expected anycompatible, msg text) returns void
language plpgsql as $$
begin
  if actual is distinct from expected then
    raise exception 'FEHLGESCHLAGEN: %, erwartet %, erhalten %',
      msg, coalesce(expected::text, 'NULL'), coalesce(actual::text, 'NULL');
  end if;
  perform test.pass(msg);
end $$;

-- Führt eine Anweisung aus und liefert die Anzahl betroffener Zeilen
create function test.affected(stmt text) returns bigint
language plpgsql as $$
declare
  n bigint;
begin
  execute stmt;
  get diagnostics n = row_count;
  return n;
end $$;

-- Erwartet, dass die Anweisung mit dem angegebenen SQLSTATE scheitert (wird zurückgerollt)
create function test.fails(stmt text, expected_state text, msg text) returns void
language plpgsql as $$
declare
  state text;
  detail text;
begin
  begin
    execute stmt;
  exception when others then
    get stacked diagnostics state = returned_sqlstate, detail = message_text;
    if state is distinct from expected_state then
      raise exception 'FEHLGESCHLAGEN: %, erwartet SQLSTATE %, erhalten % (%)', msg, expected_state, state, detail;
    end if;
    perform test.pass(format('%s  [%s: %s]', msg, state, detail));
    return;
  end;
  raise exception 'FEHLGESCHLAGEN: %, die Anweisung lief ohne Fehler durch', msg;
end $$;

-- Kurze Namen für die IDs: test.id('d01') = 00000000-0000-4000-8000-000000000d01
create function test.id(k text) returns uuid
language sql immutable as $$
  select ('00000000-0000-4000-8000-' || lpad(k, 12, '0'))::uuid
$$;

create function test.orig(person text, doc text) returns text
language sql immutable as $$
  select test.id(person)::text || '/' || test.id(doc)::text || '.pdf'
$$;

create function test.pub(doc text) returns text
language sql immutable as $$
  select test.id(doc)::text || '.pdf'
$$;

-- Dokument anlegen wie die App (als die gerade angemeldete Person)
create function test.new_doc(k text, p_type text, p_module text, p_sha text, p_extra jsonb default '{}')
returns void
language plpgsql as $$
begin
  insert into public.documents (id, title, doc_type, module_id, year, term, author, page_count, size_bytes,
                                sha256, solution_of, solution_kind, includes_solution, provenance, alumni_year)
  values (coalesce(test.id(k), gen_random_uuid()),
          coalesce(p_extra ->> 'title', 'Test'), p_type, p_module,
          coalesce((p_extra ->> 'year')::smallint, 2024::smallint),
          case when p_extra ? 'term' then p_extra ->> 'term' else 'HS' end,
          coalesce(p_extra ->> 'author', 'Prof. M. Muster'), 3, 1000, repeat(p_sha, 64),
          test.id(p_extra ->> 'solution_of'), p_extra ->> 'solution_kind',
          coalesce((p_extra ->> 'includes_solution')::boolean, false),
          coalesce(p_extra ->> 'provenance', 'studierende'), (p_extra ->> 'alumni_year')::smallint);
end $$;

-- Speicher wie die Speicher-API, mit den Rechten der angemeldeten Person
create function test.upload(bucket text, path text) returns void
language sql as $$
  insert into storage.objects (bucket_id, name) values (bucket, path)
$$;

create function test.can_read(bucket text, path text) returns boolean
language sql as $$
  select exists (select 1 from storage.objects o where o.bucket_id = bucket and o.name = path)
$$;

create function test.remove(bucket text, path text) returns bigint
language sql as $$
  with gone as (delete from storage.objects o where o.bucket_id = bucket and o.name = path returning 1)
  select count(*) from gone
$$;

-- Testdaten: Konten (in Supabase legt Auth sie an) und zugelassene Adressen
insert into auth.users (id) values
  (test.id('a1')), (test.id('b1')), (test.id('c1')), (test.id('e1')), (test.id('f1'));
insert into public.allowed_logins (entry, note) values
  ('students.example.ch', 'Studierende'), ('simon@example.org', 'Moderation');


-- -----------------------------------------------------------------------------
-- 1. Struktur und Rechte (nach zweimaligem Laden von schema.sql)
-- -----------------------------------------------------------------------------
select test.section('1. Struktur und Rechte');

select test.eq((select count(*)::int from pg_class where relnamespace = 'public'::regnamespace and relkind = 'r'),
               10, 'zehn Tabellen in public');
select test.ok((select bool_and(relrowsecurity) from pg_class
                 where relnamespace = 'public'::regnamespace and relkind = 'r'), 'RLS auf allen Tabellen');
select test.eq((select count(*)::int from pg_policies where schemaname = 'public'), 18,
               '18 Policies, auch nach dem zweiten Durchlauf');
select test.eq((select count(*)::int from pg_policies where schemaname = 'storage' and policyname like 'ablage_%'), 7,
               '7 Policies für den Speicher');
select test.ok(not has_table_privilege('anon', 'public.documents', 'select'), 'anon: keine Dokumente');
select test.ok(has_table_privilege('anon', 'public.programs', 'select') and has_table_privilege('anon', 'public.modules', 'select')
               and has_table_privilege('anon', 'public.program_modules', 'select'), 'anon: Studienplan lesen');
select test.ok(not has_table_privilege('anon', 'public.programs', 'insert, update, delete'), 'anon: Studienplan nicht ändern');
select test.ok(not has_table_privilege('authenticated', 'public.access_log', 'select, insert')
               and not has_table_privilege('authenticated', 'public.reports', 'select, insert')
               and not has_table_privilege('authenticated', 'public.ratings', 'select, insert'),
               'Protokoll, Meldungen, Einschätzungen nur über Funktionen');
select test.ok(not has_column_privilege('authenticated', 'public.documents', 'uploaded_by', 'select')
               and not has_column_privilege('authenticated', 'public.documents', 'original_path', 'select')
               and not has_column_privilege('authenticated', 'public.documents', 'sha256', 'select')
               and not has_column_privilege('authenticated', 'public.documents', 'review_note', 'select'),
               'Absender, Pfad, Prüfsumme und Notiz der Moderation bleiben verborgen');
select test.ok(not has_column_privilege('authenticated', 'public.documents', 'status', 'insert')
               and not has_column_privilege('authenticated', 'public.documents', 'status', 'update')
               and not has_column_privilege('authenticated', 'public.documents', 'uploaded_by', 'insert')
               and not has_column_privilege('authenticated', 'public.documents', 'public_path', 'update'),
               'Status, Absender und Pfade nicht direkt setzbar');
select test.ok(not has_table_privilege('authenticated', 'public.profiles', 'insert, update, delete'),
               'Profile nur über accept_rules und SQL');
select test.eq((select string_agg(p.proname, ',' order by p.proname) from pg_proc p
                 where p.pronamespace = 'public'::regnamespace and has_function_privilege('anon', p.oid, 'execute')),
               'login_domains', 'ohne Login nur login_domains aufrufbar');
select test.ok(not has_function_privilege('authenticated', 'public.hook_before_user_created(jsonb)', 'execute')
               and has_function_privilege('supabase_auth_admin', 'public.hook_before_user_created(jsonb)', 'execute'),
               'Hook nur für Supabase Auth');
select test.ok(not has_schema_privilege('anon', 'app_private', 'usage')
               and not has_function_privilege('anon', 'app_private.is_member()', 'execute'),
               'anon: interne Funktionen gesperrt');
select test.ok((select bool_and(proconfig = array['search_path=""']) from pg_proc
                 where pronamespace in ('public'::regnamespace, 'app_private'::regnamespace)),
               'alle Funktionen mit search_path = ''''');
select test.eq((select count(*)::int from storage.buckets where id in ('eingang', 'freigegeben') and not public), 2,
               'zwei private Buckets');
select test.eq((select allowed_mime_types from storage.buckets where id = 'eingang'), array['application/pdf'],
               'eingang nur PDF');


-- -----------------------------------------------------------------------------
-- 2. Auth Hook
-- -----------------------------------------------------------------------------
select test.section('2. Konto nur mit zugelassener Adresse (Hook)');

select test.eq(public.hook_before_user_created('{"user":{"email":"Anna@Students.Example.ch"}}'), '{}'::jsonb,
               'Domain der Studierenden, Gross und Klein egal');
select test.eq(public.hook_before_user_created('{"user":{"email":"simon@example.org"}}'), '{}'::jsonb,
               'einzeln zugelassene Adresse');
select test.eq(public.hook_before_user_created('{"user":{"email":"carla@gmail.com"}}') #>> '{error,http_code}', '403',
               'fremde Domain abgelehnt');
select test.eq(public.hook_before_user_created('{"user":{"email":"x@mail.students.example.ch"}}') #>> '{error,http_code}',
               '403', 'Unterdomain abgelehnt');
select test.eq(public.hook_before_user_created('{"user":{"email":"dozent@example.org"}}') #>> '{error,http_code}', '403',
               'andere Adresse derselben Domain abgelehnt');
select test.eq(public.hook_before_user_created('{"user":{"phone":"+41790000000"}}') #>> '{error,http_code}', '403',
               'ohne Mail abgelehnt');


-- -----------------------------------------------------------------------------
-- 3. Regeln annehmen, Mitglied werden
-- -----------------------------------------------------------------------------
select test.section('3. Regeln annehmen, Mitglied werden');

:als_anon
select test.eq((select string_agg(d, ',') from public.login_domains() d), 'students.example.ch',
               'Anmeldeseite zeigt nur Domains, keine einzelnen Adressen');
select test.fails('select public.me()', '42501', 'me() nur mit Login');
select test.fails('select count(*) from public.documents', '42501', 'anon liest keine Dokumente');

:als_anna
select test.eq(public.me() ->> 'email_allowed', 'true', 'Annas Adresse ist zugelassen');
select test.eq(public.me() ->> 'member', 'false', 'vor den Regeln kein Mitglied');
select public.accept_rules();
select test.eq(public.me() ->> 'member', 'true', 'nach den Regeln Mitglied');
select test.eq(public.me() ->> 'admin', 'false', 'kein Admin');
select test.eq((select count(*)::int from public.allowed_logins), 0, 'Liste der Adressen nur für den Admin');

:als_carla
select test.fails('select public.accept_rules()', '42501', 'fremde Adresse kann die Regeln nicht annehmen');
select test.eq(public.me() ->> 'member', 'false', 'fremde Adresse ist kein Mitglied');

:als_ben
select public.accept_rules();
:als_eva
select public.accept_rules();
:als_simon
select public.accept_rules();
:als_admin
update public.profiles set role = 'admin' where user_id = test.id('f1');

:als_simon
select test.eq(public.me() ->> 'admin', 'true', 'Simon ist Admin');
select test.eq((select count(*)::int from public.profiles), 4, 'Admin sieht alle Profile');
select test.eq((select count(*)::int from public.allowed_logins), 2, 'Admin sieht die zugelassenen Adressen');

:als_anna
select test.eq((select count(*)::int from public.profiles), 1, 'Anna sieht nur ihr Profil');
select test.fails('update public.profiles set role = ''admin''', '42501', 'eigene Rolle nicht änderbar');


-- -----------------------------------------------------------------------------
-- 4. Studiengänge und Module
-- -----------------------------------------------------------------------------
select test.section('4. Studiengänge und Module pflegen');

:als_simon
insert into public.programs (id, name, sort_order) values
  ('EIT', 'Elektro- und Informationstechnik', 1), ('ME', 'Maschinentechnik', 2);
insert into public.modules (id, name) values
  ('ETG1', 'Grundlagen der Elektrotechnik 1'), ('MAT1', 'Mathematik 1'), ('TD', 'Thermodynamik');
insert into public.program_modules (program_id, module_id, semester) values
  ('EIT', 'ETG1', 1), ('EIT', 'MAT1', 1), ('ME', 'MAT1', 1), ('ME', 'TD', 3);
insert into public.program_moderators (program_id, user_id) values ('ME', test.id('b1'));
select test.eq((select count(*)::int from public.program_modules where module_id = 'MAT1'), 2,
               'Admin legt an; ein Modul in zwei Studiengängen');
select test.fails('insert into public.programs (id, name) values (''eit'', ''Doppelt'')', '23505',
                  'Kürzel eindeutig, ohne Rücksicht auf Gross und Klein');
select test.fails('insert into public.programs (id, name) values (''E IT'', ''Leer'')', '23514', 'Kürzel ohne Leerzeichen');
select test.fails('insert into public.program_modules (program_id, module_id, semester) values (''EIT'', ''TD'', 13)',
                  '23514', 'Semester 1 bis 12');

:als_ben
select test.eq(public.me() -> 'moderates', '["ME"]'::jsonb, 'Ben moderiert ME');
select test.eq(test.affected('update public.modules set name = ''Thermodynamik 1'' where id = ''TD'''), 1::bigint,
               'Moderation ändert ein Modul im eigenen Studiengang');
select test.eq(test.affected('update public.modules set name = ''X'' where id = ''ETG1'''), 0::bigint,
               'aber keines in fremden');
select test.eq(test.affected('insert into public.modules (id, name) values (''WUE'', ''Wärmeübertragung'')'), 1::bigint,
               'Moderation legt ein Modul an');
select test.eq(test.affected('insert into public.program_modules (program_id, module_id, semester) values (''ME'', ''WUE'', 4)'),
               1::bigint, 'und hängt es an den eigenen Studiengang');
select test.fails('insert into public.program_modules (program_id, module_id) values (''EIT'', ''WUE'')', '42501',
                  'nicht an einen fremden');
select test.fails('insert into public.programs (id, name) values (''BAU'', ''Bauingenieurwesen'')', '42501',
                  'Studiengang anlegen nur der Admin');
select test.eq(test.affected('delete from public.modules where id = ''WUE'''), 0::bigint, 'Modul löschen nur der Admin');

:als_anna
select test.fails('insert into public.modules (id, name) values (''XX'', ''X'')', '42501', 'Studierende legen keine Module an');
select test.eq(test.affected('update public.programs set name = ''X'''), 0::bigint, 'Studierende ändern keine Studiengänge');

:als_anon
select test.eq((select count(*)::int from public.program_modules), 5, 'anon liest den Studienplan');


-- -----------------------------------------------------------------------------
-- 5. Hochladen
-- -----------------------------------------------------------------------------
select test.section('5. Hochladen');

:als_anna
select test.new_doc('d01', 'pruefung', 'ETG1', '1', '{"title": "  Prüfung HS24  "}');
select test.eq((select title from public.documents where id = test.id('d01')), 'Prüfung HS24', 'Titel ohne Leerzeichen am Rand');
select test.eq((select status from public.documents where id = test.id('d01')), 'pending', 'neu: wartet auf Prüfung');
select test.fails('select uploaded_by from public.documents', '42501', 'Absender nicht lesbar');
select test.fails($$insert into public.documents (id, title, doc_type, module_id, year, author, page_count, size_bytes, sha256, status)
                    values (gen_random_uuid(), 'X', 'pruefung', 'ETG1', 2024, 'X', 1, 1, repeat('9', 64), 'approved')$$,
                  '42501', 'Status nicht selbst setzbar');
select test.fails($$insert into public.documents (id, title, doc_type, module_id, year, author, page_count, size_bytes, sha256, uploaded_by)
                    values (gen_random_uuid(), 'X', 'pruefung', 'ETG1', 2024, 'X', 1, 1, repeat('9', 64), test.id('e1'))$$,
                  '42501', 'fremder Absender nicht setzbar');
select test.fails($$select test.new_doc(null, 'pruefung', 'ETG1', '9', '{"term": "WS"}')$$, '23514', 'Semester HS oder FS');
select test.fails($$select test.new_doc(null, 'pruefung', 'ETG1', '9', '{"provenance": "alumni"}')$$, '23514',
                  'Alumni brauchen das Abschlussjahr');
select test.fails($$select test.new_doc(null, 'formelsammlung', 'MAT1', '9', '{"includes_solution": true}')$$, '23514',
                  'Häkchen «Lösung im PDF» nur bei Prüfungen');
select test.fails($$select test.new_doc(null, 'loesung', 'ETG1', '9', '{"solution_of": "d01", "solution_kind": "studierende"}')$$,
                  '23514', 'Lösung nur zu einer freigegebenen Prüfung');
select test.fails($$select test.new_doc(null, 'pruefung', 'ETG1', '1')$$, '23505', 'dieselbe Datei nur einmal');
select test.new_doc('d02', 'formelsammlung', 'MAT1', '2', '{"provenance": "alumni", "alumni_year": 2023, "author": "M. Beispiel", "term": null}');
select test.eq((select count(*)::int from public.documents), 2, 'Anna sieht ihre zwei offenen Uploads');
select test.eq((select count(*)::int from public.my_uploads()), 2, 'my_uploads zeigt beide');

:als_eva
select test.eq((select count(*)::int from public.documents), 0, 'Eva sieht fremde offene Uploads nicht');

:als_ben
select test.eq((select string_agg(title, ',') from public.documents), 'Test',
               'Ben sieht den Upload in MAT1 (gehört auch zu ME), nicht den in ETG1');

:als_carla
select test.fails($$select test.new_doc(null, 'pruefung', 'ETG1', '9')$$, '42501', 'ohne Mitgliedschaft kein Upload');


-- -----------------------------------------------------------------------------
-- 6. Speicher eingang
-- -----------------------------------------------------------------------------
select test.section('6. Original im Speicher eingang');

:als_anna
select test.upload('eingang', test.orig('a1', 'd01'));
select test.ok(test.can_read('eingang', test.orig('a1', 'd01')), 'Anna lädt ihr Original hoch und sieht es');
select test.fails($$select test.upload('eingang', test.orig('a1', 'd99'))$$, '42501', 'nur mit passendem Eintrag');
select test.upload('eingang', test.orig('a1', 'd02'));

:als_eva
select test.fails($$select test.upload('eingang', test.orig('e1', 'd01'))$$, '42501', 'nicht auf einen fremden Eintrag');
select test.ok(not test.can_read('eingang', test.orig('a1', 'd01')), 'Eva sieht fremde Originale nicht');
select test.eq(test.remove('eingang', test.orig('a1', 'd01')), 0::bigint, 'und löscht sie nicht');

:als_ben
select test.ok(test.can_read('eingang', test.orig('a1', 'd02')), 'Moderation ME sieht das Original in MAT1');
select test.ok(not test.can_read('eingang', test.orig('a1', 'd01')), 'aber nicht das in ETG1');

:als_simon
select test.ok(test.can_read('eingang', test.orig('a1', 'd01')), 'Admin sieht das Original');

:als_anna
select test.eq(test.remove('eingang', test.orig('a1', 'd02')), 1::bigint, 'Anna löscht ihr offenes Original');
select test.eq(test.affected($$delete from public.documents where id = test.id('d02')$$), 1::bigint,
               'und zieht den Upload zurück');


-- -----------------------------------------------------------------------------
-- 7. Freigeben
-- -----------------------------------------------------------------------------
select test.section('7. Freigeben mit Wasserzeichen');

:als_anna
select test.fails($$select test.upload('freigegeben', test.pub('d01'))$$, '42501', 'Studierende schreiben nicht in freigegeben');
select test.fails($$select public.approve_document(test.id('d01'))$$, '42501', 'Studierende geben nicht frei');

:als_ben
select test.fails($$select public.approve_document(test.id('d01'))$$, '42501', 'Moderation ME gibt in ETG1 nicht frei');

:als_simon
select test.fails($$select public.approve_document(test.id('d01'))$$, '55000', 'ohne Fassung mit Wasserzeichen keine Freigabe');
select test.upload('freigegeben', test.pub('d01'));
select public.approve_document(test.id('d01'));
select test.eq((select status from public.documents where id = test.id('d01')), 'approved', 'freigegeben');
select public.approve_document(test.id('d01'));
select test.ok(true, 'erneut freigeben geht (Wasserzeichen neu erzeugt)');

:als_admin
select test.eq((select public_path from public.documents where id = test.id('d01')), test.pub('d01'), 'Pfad der Fassung');
select test.eq((select reviewed_by from public.documents where id = test.id('d01')), test.id('f1'), 'wer freigegeben hat');


-- -----------------------------------------------------------------------------
-- 8. Ansehen und Rate-Limit
-- -----------------------------------------------------------------------------
select test.section('8. Ansehen und Rate-Limit');

:als_eva
select test.eq((select count(*)::int from public.documents where status = 'approved'), 1, 'Mitglied sieht das freigegebene Dokument');
select test.ok(not test.can_read('freigegeben', test.pub('d01')), 'Datei erst nach einem Abruf');
select test.eq(public.request_document(test.id('d01'), 'view'), test.pub('d01'), 'Abruf liefert den Pfad');
select test.ok(test.can_read('freigegeben', test.pub('d01')), 'danach ist die Datei lesbar');
select test.fails($$select public.request_document(test.id('d01'), 'print')$$, '22023', 'nur view und download');
select test.fails($$select public.request_document(test.id('d99'), 'view')$$, 'P0002', 'unbekanntes Dokument');

:als_admin
update public.access_log set created_at = now() - interval '3 minutes' where user_id = test.id('e1');

:als_eva
select test.ok(not test.can_read('freigegeben', test.pub('d01')), 'nach 2 Minuten nicht mehr');

:als_anna
select test.ok(not test.can_read('freigegeben', test.pub('d01')), 'der Abruf von Eva gilt nicht für Anna');

:als_carla
select test.fails($$select public.request_document(test.id('d01'), 'view')$$, '42501', 'fremde Adresse ruft nichts ab');
select test.eq((select count(*)::int from public.documents), 0, 'fremde Adresse sieht keine Dokumente');

-- 210 weitere freigegebene Dokumente; Eva hat 60 davon in der letzten Stunde angesehen
:als_admin
insert into public.documents (id, title, doc_type, module_id, year, author, page_count, size_bytes, sha256,
                              status, public_path, uploaded_by)
select x.u, 'Serie ' || g, 'pruefung', 'MAT1', 2020, 'Prof. Serie', 1, 1, lpad(to_hex(g), 64, '0'),
       'approved', x.u::text || '.pdf', test.id('a1')
  from generate_series(1, 210) g,
       lateral (select test.id(to_hex(4096 + g)) as u) x;
insert into public.access_log (user_id, document_id, action, created_at)
select test.id('e1'), test.id(to_hex(4096 + g)), 'view', now() - interval '30 minutes' from generate_series(1, 60) g;

:als_eva
select test.fails($$select public.request_document(test.id(to_hex(4096 + 61)), 'view')$$, 'P0001',
                  'nach 60 verschiedenen Dokumenten in einer Stunde ist Schluss');
select test.eq(public.request_document(test.id(to_hex(4096 + 1)), 'view'), test.pub(to_hex(4096 + 1)),
               'schon geöffnete Dokumente gehen weiter');
select test.eq(public.request_document(test.id('d01'), 'view'), test.pub('d01'), 'auch das von vorhin');

:als_admin
update public.access_log set created_at = now() - interval '5 hours' where user_id = test.id('e1');

:als_eva
select test.eq(public.request_document(test.id(to_hex(4096 + 61)), 'view'), test.pub(to_hex(4096 + 61)),
               'eine Stunde später wieder offen');

:als_admin
insert into public.access_log (user_id, document_id, action, created_at)
select test.id('e1'), test.id(to_hex(4096 + g)), 'view', now() - interval '5 hours' from generate_series(62, 200) g;

:als_eva
select test.fails($$select public.request_document(test.id(to_hex(4096 + 201)), 'view')$$, 'P0001',
                  'höchstens 200 verschiedene Dokumente pro Tag');

:als_admin
insert into public.access_log (user_id, document_id, action, created_at)
select test.id('a1'), test.id(to_hex(4096 + g)), 'download', now() - interval '10 minutes' from generate_series(1, 10) g;

:als_anna
select test.fails($$select public.request_document(test.id(to_hex(4096 + 11)), 'download')$$, 'P0001',
                  '10 Downloads pro Stunde');
select test.eq(public.request_document(test.id(to_hex(4096 + 11)), 'view'), test.pub(to_hex(4096 + 11)),
               'Ansehen zählt getrennt');


-- -----------------------------------------------------------------------------
-- 9. Lösungen
-- -----------------------------------------------------------------------------
select test.section('9. Lösungen');

:als_eva
select test.new_doc('d04', 'loesung', 'MAT1', '4', '{"solution_of": "d01", "solution_kind": "studierende", "title": "Lösung"}');
select test.eq((select module_id from public.documents where id = test.id('d04')), 'ETG1', 'Lösung liegt beim Modul der Prüfung');
select test.fails($$select test.new_doc(null, 'loesung', 'ETG1', '9', '{"solution_of": "d01"}')$$, '23514',
                  'Lösung braucht «offiziell» oder «studierende»');
select test.fails($$select test.new_doc(null, 'pruefung', 'ETG1', '9', '{"solution_of": "d01"}')$$, '23514',
                  'nur Lösungen hängen an einer Prüfung');

:als_simon
select test.fails($$update public.documents set doc_type = 'formelsammlung' where id = test.id('d01')$$, '23514',
                  'eine Prüfung mit Lösungen bleibt eine Prüfung');
select test.eq(test.affected($$update public.documents set module_id = 'MAT1' where id = test.id('d01')$$), 1::bigint,
               'Moderation verschiebt die Prüfung');
select test.eq((select module_id from public.documents where id = test.id('d04')), 'MAT1', 'die Lösung zieht mit');
update public.documents set module_id = 'ETG1' where id = test.id('d01');
select test.fails($$update public.documents set sha256 = repeat('0', 64) where id = test.id('d01')$$, '42501',
                  'Prüfsumme bleibt');


-- -----------------------------------------------------------------------------
-- 10. Einschätzung von Probeprüfungen
-- -----------------------------------------------------------------------------
select test.section('10. Einschätzung von Probeprüfungen');

:als_eva
select test.new_doc('d03', 'probepruefung', 'ETG1', '3', '{"title": "Probeprüfung FS25", "term": "FS", "year": 2025}');

:als_simon
select test.upload('freigegeben', test.pub('d03'));
select public.approve_document(test.id('d03'));

:als_anna
select test.fails($$select public.rate_document(test.id('d01'), 1::smallint)$$, 'P0002', 'nur Probeprüfungen');
select public.rate_document(test.id('d03'), -2::smallint);
select public.rate_document(test.id('d03'), -1::smallint);
:als_eva
select public.rate_document(test.id('d03'), -1::smallint);
:als_ben
select public.rate_document(test.id('d03'), 2::smallint);
select test.fails($$select public.rate_document(test.id('d03'), 3::smallint)$$, '23514', 'Werte von -2 bis +2');

:als_anna
select test.eq((select s -> 'counts' from public.rating_summary('ETG1') s), '[0, 2, 0, 0, 1]'::jsonb,
               'Verteilung: eine Stimme pro Person, die letzte gilt');
select test.eq((select (s ->> 'mine')::int from public.rating_summary('ETG1') s), -1, 'eigene Einschätzung');
select public.rate_document(test.id('d03'), null);
select test.eq((select s -> 'counts' from public.rating_summary('ETG1') s), '[0, 1, 0, 0, 1]'::jsonb, 'zurückgenommen');

:als_carla
select test.eq((select count(*)::int from public.rating_summary('ETG1')), 0, 'ohne Mitgliedschaft keine Verteilung');
select test.fails($$select public.rate_document(test.id('d03'), 1::smallint)$$, '42501', 'und keine Einschätzung');


-- -----------------------------------------------------------------------------
-- 11. Melden
-- -----------------------------------------------------------------------------
select test.section('11. Melden');

:als_eva
select public.report_document(test.id('d01'), 'urheberrecht', 'Bitte entfernen');
select public.report_document(test.id('d01'), 'falsche-angaben', 'Doch nur falsches Semester');
select test.fails($$select public.report_document(test.id('d01'), 'langweilig')$$, '23514', 'nur bekannte Gründe');
select test.eq((select count(*)::int from public.moderation_reports()), 0, 'Studierende sehen keine Meldungen');

:als_ben
select test.eq((select count(*)::int from public.moderation_reports()), 0, 'Moderation ME sieht Meldungen in ETG1 nicht');

:als_simon
select test.eq((select count(*)::int from public.moderation_reports()), 1, 'eine offene Meldung pro Person und Dokument');
select test.eq((select r ->> 'reason' from public.moderation_reports() r), 'falsche-angaben', 'die neuere ersetzt die ältere');
select public.resolve_report((select (r ->> 'id')::uuid from public.moderation_reports() r), 'Semester korrigiert');
select test.eq((select count(*)::int from public.moderation_reports()), 0, 'erledigt');

:als_carla
select test.fails($$select public.report_document(test.id('d01'), 'anderes')$$, '42501', 'nur Mitglieder melden');


-- -----------------------------------------------------------------------------
-- 12. Ablehnen
-- -----------------------------------------------------------------------------
select test.section('12. Ablehnen');

:als_anna
select test.new_doc('d05', 'pruefung', 'TD', '5', '{"title": "Skript Thermodynamik"}');

:als_ben
select test.eq((select count(*)::int from public.moderation_queue()), 1, 'Ben sieht den offenen Upload in TD');
select test.eq((select q ->> 'uploader_email' from public.moderation_queue() q), 'anna@students.example.ch',
               'die Moderation sieht den Absender');
select test.fails($$select public.reject_document(test.id('d05'), '  ')$$, '22023', 'Ablehnen nur mit Begründung');
select test.eq(public.reject_document(test.id('d05'), 'Unterrichtsunterlage, gehört nicht in die Ablage'),
               test.orig('a1', 'd05'), 'liefert das Original zum Löschen');
select test.fails($$select public.reject_document(test.id('d05'), 'nochmals')$$, '55000', 'nur offene Uploads');

:als_anna
select test.eq((select u ->> 'status' from public.my_uploads() u where u ->> 'id' = test.id('d05')::text), 'rejected',
               'Anna sieht die Ablehnung');
select test.eq((select u ->> 'review_note' from public.my_uploads() u where u ->> 'id' = test.id('d05')::text),
               'Unterrichtsunterlage, gehört nicht in die Ablage', 'mit Begründung');
select test.new_doc(null, 'pruefung', 'TD', '5', '{"title": "Prüfung HS23"}');
select test.ok(true, 'nach einer Ablehnung darf dieselbe Datei neu kommen');
select test.eq(test.affected($$delete from public.documents where id = test.id('d01')$$), 0::bigint,
               'Freigegebenes nicht selbst löschbar');


-- -----------------------------------------------------------------------------
-- 13. Entfernen auf Anfrage
-- -----------------------------------------------------------------------------
select test.section('13. Entfernen auf Anfrage');

:als_simon
select test.upload('freigegeben', test.pub('d04'));
select public.approve_document(test.id('d04'));

:als_eva
select public.report_document(test.id('d01'), 'urheberrecht', 'Der Dozent will das nicht');

:als_ben
select test.fails($$select * from public.remove_document(test.id('d01'), 'Wunsch des Dozenten')$$, '42501',
                  'nur die zuständige Moderation');

:als_simon
select test.fails($$select * from public.remove_document(test.id('d01'), '')$$, '22023', 'nur mit Begründung');
select test.eq((select count(*)::int from public.remove_document(test.id('d01'), 'Auf Wunsch des Dozenten entfernt')), 4,
               'Prüfung samt Lösung entfernt, je Original und Fassung zum Löschen');
select test.eq((select count(*)::int from public.moderation_reports()), 0, 'Meldungen dazu erledigt');
select test.eq(test.remove('freigegeben', test.pub('d01')) + test.remove('freigegeben', test.pub('d04'))
               + test.remove('eingang', test.orig('a1', 'd01')), 3::bigint, 'Moderation löscht die Dateien');

:als_eva
select test.eq((select count(*)::int from public.documents where status = 'approved' and id in (test.id('d01'), test.id('d04'))),
               0, 'Mitglieder sehen beide nicht mehr');
select test.fails($$select public.request_document(test.id('d01'), 'view')$$, 'P0002', 'kein Abruf mehr');

:als_anna
select test.fails($$select test.new_doc(null, 'pruefung', 'ETG1', '1')$$, '23505', 'die entfernte Datei kommt nicht wieder');


-- -----------------------------------------------------------------------------
-- 14. Moderation pro Studiengang
-- -----------------------------------------------------------------------------
select test.section('14. Moderation pro Studiengang');

:als_anna
select test.new_doc('d06', 'probepruefung', 'TD', '6', '{"title": "Probeprüfung HS25"}');
select test.upload('eingang', test.orig('a1', 'd06'));

:als_ben
select test.ok(test.can_read('eingang', test.orig('a1', 'd06')), 'Ben liest das Original in TD');
select test.upload('freigegeben', test.pub('d06'));
select public.approve_document(test.id('d06'));
select test.eq((select status from public.documents where id = test.id('d06')), 'approved', 'Ben gibt in seinem Studiengang frei');
select test.eq(test.affected($$update public.documents set title = 'Probeprüfung HS25 (korrigiert)' where id = test.id('d06')$$),
               1::bigint, 'und korrigiert Angaben');
select test.fails($$update public.documents set module_id = 'ETG1' where id = test.id('d06')$$, '42501',
                  'aber verschiebt nicht in fremde Module');

:als_admin
delete from public.program_moderators where user_id = test.id('b1');

:als_ben
select test.eq(test.affected($$update public.documents set title = 'X' where id = test.id('d06')$$), 0::bigint,
               'ohne Moderation keine Änderung mehr');


-- -----------------------------------------------------------------------------
-- 15. Sperren und zugelassene Adressen
-- -----------------------------------------------------------------------------
select test.section('15. Sperren und zugelassene Adressen');

:als_admin
update public.profiles set blocked = true where user_id = test.id('e1');

:als_eva
select test.eq(public.me() ->> 'member', 'false', 'gesperrt: kein Mitglied');
select test.eq((select count(*)::int from public.documents where id = test.id('d06')), 0, 'gesperrt: keine Dokumente');
select test.fails($$select public.request_document(test.id('d06'), 'view')$$, '42501', 'gesperrt: kein Abruf');

:als_admin
update public.profiles set blocked = false where user_id = test.id('e1');
delete from public.allowed_logins where entry = 'students.example.ch';

:als_anna
select test.eq(public.me() ->> 'member', 'false', 'Domain entfernt: kein Zugang mehr, auch mit Konto');

:als_simon
select test.eq(public.me() ->> 'member', 'true', 'der Admin bleibt drin');
insert into public.allowed_logins (entry) values ('students.example.ch');
select test.fails($$insert into public.allowed_logins (entry) values ('Students.Example.ch')$$, '23514',
                  'Einträge klein geschrieben');

:als_anna
select test.eq(public.me() ->> 'member', 'true', 'Domain wieder da');
select test.fails($$insert into public.allowed_logins (entry) values ('gmail.com')$$, '42501',
                  'nur der Admin lässt Adressen zu');


-- -----------------------------------------------------------------------------
-- 16. Fremdschlüssel
-- -----------------------------------------------------------------------------
select test.section('16. Module umbenennen und löschen');

:als_simon
select test.fails($$delete from public.modules where id = 'ETG1'$$, '23503', 'ein Modul mit Dokumenten bleibt');
select test.eq(test.affected($$update public.modules set id = 'ETG-1' where id = 'ETG1'$$), 1::bigint, 'Kürzel umbenennen');
select test.eq((select count(*)::int from public.documents where module_id = 'ETG1'), 0,
               'Dokumente und Lösungen ziehen mit');
select test.eq((select count(*)::int from public.program_modules where module_id = 'ETG-1'), 1, 'der Studienplan auch');
select test.eq(test.affected($$delete from public.modules where id = 'WUE'$$), 1::bigint, 'leeres Modul löschen');


-- -----------------------------------------------------------------------------
-- Zusammenfassung
-- -----------------------------------------------------------------------------
:als_admin
do $$
begin
  raise notice '══ Alle % Prüfungen bestanden.', current_setting('test.passed');
end
$$;
