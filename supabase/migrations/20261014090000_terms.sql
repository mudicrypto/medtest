-- Milestone 5: terminology cards move from browser code into the database.
--
-- IDs are kept exactly as before (t-01 … t-20): students' saved review
-- progress for terms (srs_cards, item_type 'term') refers to these IDs.
-- Visibility follows the same rule as questions: students see only terms with
-- cleared rights that aren't retired and are approved (or labelled demo).

create table public.terms (
  id text primary key check (id ~ '^[a-z0-9][a-z0-9-]{0,79}$'),
  ru text not null check (char_length(ru) between 1 and 200),
  -- Latin-script pronunciation guide, stressed syllable in capitals.
  translit text not null default '' check (char_length(translit) <= 200),
  en text not null check (char_length(en) between 1 and 300),
  -- Specialty; null means general vocabulary.
  topic text references public.topics (slug),
  example_ru text check (char_length(example_ru) <= 1000),
  example_en text check (char_length(example_en) <= 1000),
  origin public.content_origin not null,
  rights_status public.rights_status not null,
  review_status public.review_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger terms_set_updated_at
  before update on public.terms
  for each row execute function public.set_updated_at();

alter table public.terms enable row level security;
revoke all on public.terms from anon, authenticated;
grant select, insert, update, delete on public.terms to authenticated;

create policy "Students read published terms; staff read all" on public.terms for select to authenticated
  using (
    (rights_status in ('owned', 'licensed', 'public_domain')
      and review_status <> 'retired'
      and (review_status = 'approved' or origin = 'demo'))
    or (select public.is_staff())
  );
create policy "Admins can add terms" on public.terms for insert to authenticated with check ((select public.is_admin()));
create policy "Admins can edit terms" on public.terms for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins can delete terms" on public.terms for delete to authenticated using ((select public.is_admin()));

-- The 20 existing demo cards, copied unchanged from src/demo/terms.ts.
-- Labelled demo and unreviewed (not yet medically or linguistically reviewed).
insert into public.terms (id, ru, translit, en, topic, example_ru, example_en, origin, rights_status, review_status)
select id, ru, translit, en, topic, example_ru, example_en, 'demo', 'owned', 'draft'
from (values
  ('t-01', 'одышка', 'a-DYSH-ka', 'shortness of breath (dyspnoea)', 'pulmonology', 'Пациент жалуется на одышку при ходьбе.', 'The patient complains of shortness of breath when walking.'),
  ('t-02', 'жалобы', 'ZHA-lo-by', 'complaints (presenting symptoms)', null, 'Какие у вас жалобы?', 'What are your complaints? / What brings you in?'),
  ('t-03', 'анамнез', 'a-NAM-nez', 'medical history', null, 'Анамнез заболевания собран со слов пациента.', 'The history of the illness was taken from the patient.'),
  ('t-04', 'головокружение', 'go-lo-vo-kru-ZHE-ni-ye', 'dizziness', 'neurology', 'Беспокоит головокружение по утрам.', 'Dizziness bothers them in the mornings.'),
  ('t-05', 'сердцебиение', 'serd-tse-bi-YE-ni-ye', 'palpitations', 'cardiology', 'Отмечает приступы сердцебиения.', 'Reports episodes of palpitations.'),
  ('t-06', 'давящая боль', 'DA-vya-shcha-ya bol''', 'pressing (crushing) pain', 'cardiology', 'Давящая боль за грудиной.', 'Crushing pain behind the sternum.'),
  ('t-07', 'отёк', 'a-TYOK', 'oedema (swelling)', 'cardiology', 'Отёки голеней к вечеру.', 'Swelling of the lower legs by evening.'),
  ('t-08', 'мокрота', 'mak-ra-TA', 'sputum', 'pulmonology', 'Кашель с гнойной мокротой.', 'Cough with purulent sputum.'),
  ('t-09', 'хрипы', 'KHRI-py', 'crackles / wheezes (adventitious sounds)', 'pulmonology', 'Влажные хрипы в нижних отделах.', 'Crackles in the lung bases.'),
  ('t-10', 'изжога', 'iz-ZHO-ga', 'heartburn', 'gastroenterology', 'Изжога после еды.', 'Heartburn after meals.'),
  ('t-11', 'тошнота', 'tash-na-TA', 'nausea', 'gastroenterology', 'Тошнота и рвота с утра.', 'Nausea and vomiting in the morning.'),
  ('t-12', 'желтуха', 'zhel-TU-kha', 'jaundice', 'gastroenterology', 'Кожные покровы с желтушным оттенком.', 'The skin has a jaundiced tinge.'),
  ('t-13', 'жажда', 'ZHAZH-da', 'thirst', 'endocrinology', 'Беспокоит сильная жажда.', 'Severe thirst is bothering them.'),
  ('t-14', 'лихорадка', 'li-kha-RAD-ka', 'fever', 'infectious-diseases', 'Лихорадка до 39 °C в течение трёх дней.', 'Fever up to 39 °C for three days.'),
  ('t-15', 'сыпь', 'syp''', 'rash', 'infectious-diseases', 'На коже туловища — пятнистая сыпь.', 'A macular rash on the trunk.'),
  ('t-16', 'судороги', 'SU-da-ra-gi', 'seizures / cramps', 'neurology', 'Генерализованные судороги.', 'Generalised seizures.'),
  ('t-17', 'беременность', 'BE-re-men-nost''', 'pregnancy', 'obstetrics', 'Беременность 36 недель.', 'Pregnancy at 36 weeks.'),
  ('t-18', 'схватки', 'SKHVAT-ki', 'contractions (labour)', 'obstetrics', 'Регулярные схватки каждые 5 минут.', 'Regular contractions every 5 minutes.'),
  ('t-19', 'острый живот', 'OST-ryy zhi-VOT', 'acute abdomen', 'surgery', 'Клиника острого живота.', 'Clinical picture of an acute abdomen.'),
  ('t-20', 'назначение', 'na-zna-CHE-ni-ye', 'prescription / medical order', null, 'Выполнить назначения врача.', 'Carry out the doctor''s orders.')
) as v (id, ru, translit, en, topic, example_ru, example_en)
on conflict (id) do nothing;
