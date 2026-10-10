// DEMO CONTENT — written for the clickable prototype only.
// Not reviewed, not official, not for study. Every item has origin "demo".
import type { Question } from "@/lib/types";

const demo = {
  origin: "demo",
  rightsStatus: "owned",
  reviewStatus: "draft",
  sourceRef: "MedPrep prototype demo set",
} as const;

export const questions: Question[] = [
  {
    id: "q-card-01",
    topic: "cardiology",
    difficulty: 2,
    stemEn:
      "A 58-year-old man presents with 40 minutes of crushing retrosternal chest pain. The ECG shows ST-segment elevation in leads II, III and aVF. Occlusion of which artery is most likely?",
    stemRu:
      "Мужчина 58 лет поступил с давящей загрудинной болью, продолжающейся 40 минут. На ЭКГ — подъём сегмента ST в отведениях II, III, aVF. Окклюзия какой артерии наиболее вероятна?",
    options: [
      { id: "A", textEn: "Left anterior descending artery", textRu: "Передняя межжелудочковая ветвь левой коронарной артерии" },
      { id: "B", textEn: "Right coronary artery", textRu: "Правая коронарная артерия" },
      { id: "C", textEn: "Left circumflex artery", textRu: "Огибающая ветвь левой коронарной артерии" },
      { id: "D", textEn: "Left main coronary artery", textRu: "Ствол левой коронарной артерии" },
    ],
    keyTerms: [
      { ru: "подъём сегмента ST", en: "ST-segment elevation" },
      { ru: "загрудинная боль", en: "retrosternal chest pain" },
    ],
    ...demo,
  },
  {
    id: "q-card-02",
    topic: "cardiology",
    difficulty: 2,
    stemEn:
      "A haemodynamically stable 30-year-old woman has a regular narrow-complex tachycardia at 190/min. Vagal manoeuvres have failed. What is the most appropriate next drug?",
    stemRu:
      "У гемодинамически стабильной женщины 30 лет регулярная тахикардия с узкими комплексами QRS, ЧСС 190 в минуту. Вагусные пробы неэффективны. Какой препарат наиболее целесообразен?",
    options: [
      { id: "A", textEn: "Adenosine IV bolus", textRu: "Аденозин внутривенно болюсно" },
      { id: "B", textEn: "Atropine IV", textRu: "Атропин внутривенно" },
      { id: "C", textEn: "Oral digoxin", textRu: "Дигоксин внутрь" },
      { id: "D", textEn: "Synchronised cardioversion", textRu: "Синхронизированная кардиоверсия" },
    ],
    keyTerms: [
      { ru: "вагусные пробы", en: "vagal manoeuvres" },
      { ru: "тахикардия с узкими комплексами", en: "narrow-complex tachycardia" },
    ],
    ...demo,
  },
  {
    id: "q-pulm-01",
    topic: "pulmonology",
    difficulty: 2,
    stemEn:
      "A pleural fluid sample is analysed. Which finding indicates that the effusion is an exudate according to Light's criteria?",
    stemRu:
      "Проведён анализ плевральной жидкости. Какой показатель свидетельствует об экссудате согласно критериям Лайта?",
    options: [
      { id: "A", textEn: "Pleural fluid / serum protein ratio of 0.3", textRu: "Отношение белка плевральной жидкости к белку сыворотки 0,3" },
      { id: "B", textEn: "Pleural fluid / serum protein ratio greater than 0.5", textRu: "Отношение белка плевральной жидкости к белку сыворотки более 0,5" },
      { id: "C", textEn: "Pleural fluid / serum LDH ratio of 0.4", textRu: "Отношение ЛДГ плевральной жидкости к ЛДГ сыворотки 0,4" },
      { id: "D", textEn: "Pleural LDH below two-thirds of the serum upper limit of normal", textRu: "ЛДГ плевральной жидкости менее 2/3 верхней границы нормы сыворотки" },
    ],
    keyTerms: [
      { ru: "плевральный выпот", en: "pleural effusion" },
      { ru: "экссудат", en: "exudate" },
      { ru: "транссудат", en: "transudate" },
    ],
    ...demo,
  },
  {
    id: "q-pulm-02",
    topic: "pulmonology",
    difficulty: 1,
    stemEn:
      "A tall, thin 22-year-old man develops sudden right-sided pleuritic chest pain and breathlessness. On the right, breath sounds are absent and percussion is hyperresonant. What is the most likely diagnosis?",
    stemRu:
      "У высокого худощавого мужчины 22 лет внезапно возникли боль в правой половине грудной клетки, усиливающаяся при дыхании, и одышка. Справа дыхание не проводится, перкуторно — коробочный звук. Наиболее вероятный диагноз?",
    options: [
      { id: "A", textEn: "Lobar pneumonia", textRu: "Долевая пневмония" },
      { id: "B", textEn: "Pleural effusion", textRu: "Плевральный выпот" },
      { id: "C", textEn: "Primary spontaneous pneumothorax", textRu: "Первичный спонтанный пневмоторакс" },
      { id: "D", textEn: "Pulmonary embolism", textRu: "Тромбоэмболия лёгочной артерии" },
    ],
    keyTerms: [
      { ru: "пневмоторакс", en: "pneumothorax" },
      { ru: "коробочный звук", en: "hyperresonant percussion note" },
    ],
    ...demo,
  },
  {
    id: "q-gi-01",
    topic: "gastroenterology",
    difficulty: 2,
    stemEn:
      "A 64-year-old man has painless progressive jaundice, weight loss and a palpable, non-tender gallbladder. Which diagnosis is most likely?",
    stemRu:
      "У мужчины 64 лет безболевая нарастающая желтуха, снижение массы тела, пальпируется увеличенный безболезненный желчный пузырь. Наиболее вероятный диагноз?",
    options: [
      { id: "A", textEn: "Choledocholithiasis", textRu: "Холедохолитиаз" },
      { id: "B", textEn: "Carcinoma of the head of the pancreas", textRu: "Рак головки поджелудочной железы" },
      { id: "C", textEn: "Acute calculous cholecystitis", textRu: "Острый калькулёзный холецистит" },
      { id: "D", textEn: "Acute viral hepatitis A", textRu: "Острый вирусный гепатит A" },
    ],
    keyTerms: [
      { ru: "симптом Курвуазье", en: "Courvoisier's sign" },
      { ru: "механическая желтуха", en: "obstructive jaundice" },
    ],
    ...demo,
  },
  {
    id: "q-gi-02",
    topic: "gastroenterology",
    difficulty: 2,
    stemEn:
      "A patient with a duodenal ulcer tests positive for Helicobacter pylori. In a region with low clarithromycin resistance, which first-line regimen is appropriate?",
    stemRu:
      "У пациента с язвой двенадцатиперстной кишки выявлен Helicobacter pylori. В регионе с низкой резистентностью к кларитромицину какая схема первой линии целесообразна?",
    options: [
      { id: "A", textEn: "Proton pump inhibitor alone for 8 weeks", textRu: "Монотерапия ингибитором протонной помпы 8 недель" },
      { id: "B", textEn: "Amoxicillin alone for 7 days", textRu: "Монотерапия амоксициллином 7 дней" },
      { id: "C", textEn: "PPI + clarithromycin + amoxicillin for 14 days", textRu: "ИПП + кларитромицин + амоксициллин 14 дней" },
      { id: "D", textEn: "H2-receptor blocker + antacid", textRu: "Блокатор H2-рецепторов + антацид" },
    ],
    keyTerms: [
      { ru: "эрадикация", en: "eradication" },
      { ru: "ингибитор протонной помпы (ИПП)", en: "proton pump inhibitor (PPI)" },
    ],
    ...demo,
  },
  {
    id: "q-endo-01",
    topic: "endocrinology",
    difficulty: 2,
    stemEn:
      "A 19-year-old with type 1 diabetes presents with vomiting, Kussmaul breathing, glucose 28 mmol/L and pH 7.1. What is the most important first step in management?",
    stemRu:
      "Пациент 19 лет с сахарным диабетом 1 типа поступил с рвотой, дыханием Куссмауля, глюкозой 28 ммоль/л и pH 7,1. Какое первоочередное мероприятие наиболее важно?",
    options: [
      { id: "A", textEn: "IV 0.9% sodium chloride", textRu: "Внутривенное введение 0,9% раствора натрия хлорида" },
      { id: "B", textEn: "Routine IV sodium bicarbonate", textRu: "Рутинное внутривенное введение натрия гидрокарбоната" },
      { id: "C", textEn: "Subcutaneous insulin glargine", textRu: "Подкожное введение инсулина гларгин" },
      { id: "D", textEn: "Oral rehydration solution", textRu: "Пероральная регидратация" },
    ],
    keyTerms: [
      { ru: "диабетический кетоацидоз", en: "diabetic ketoacidosis" },
      { ru: "дыхание Куссмауля", en: "Kussmaul breathing" },
    ],
    ...demo,
  },
  {
    id: "q-endo-02",
    topic: "endocrinology",
    difficulty: 1,
    stemEn:
      "Which laboratory pattern is typical of primary hypothyroidism?",
    stemRu: "Какие лабораторные показатели характерны для первичного гипотиреоза?",
    options: [
      { id: "A", textEn: "Low TSH, high free T4", textRu: "ТТГ снижен, свободный T4 повышен" },
      { id: "B", textEn: "High TSH, low free T4", textRu: "ТТГ повышен, свободный T4 снижен" },
      { id: "C", textEn: "Low TSH, low free T4", textRu: "ТТГ снижен, свободный T4 снижен" },
      { id: "D", textEn: "Normal TSH, high free T4", textRu: "ТТГ в норме, свободный T4 повышен" },
    ],
    keyTerms: [
      { ru: "гипотиреоз", en: "hypothyroidism" },
      { ru: "тиреотропный гормон (ТТГ)", en: "thyroid-stimulating hormone (TSH)" },
    ],
    ...demo,
  },
  {
    id: "q-inf-01",
    topic: "infectious-diseases",
    difficulty: 1,
    stemEn:
      "Ten days after a tick bite in a forested region, a patient develops an expanding annular red rash with central clearing. Which treatment is most appropriate for an adult?",
    stemRu:
      "Через 10 дней после укуса клеща в лесной зоне у пациента появилась расширяющаяся кольцевидная эритема с просветлением в центре. Какое лечение наиболее целесообразно у взрослого?",
    options: [
      { id: "A", textEn: "Doxycycline", textRu: "Доксициклин" },
      { id: "B", textEn: "Acyclovir", textRu: "Ацикловир" },
      { id: "C", textEn: "Fluconazole", textRu: "Флуконазол" },
      { id: "D", textEn: "Metronidazole", textRu: "Метронидазол" },
    ],
    keyTerms: [
      { ru: "мигрирующая эритема", en: "erythema migrans" },
      { ru: "иксодовый клещевой боррелиоз", en: "Lyme borreliosis" },
    ],
    ...demo,
  },
  {
    id: "q-inf-02",
    topic: "infectious-diseases",
    difficulty: 2,
    stemEn:
      "A traveller returning from sub-Saharan Africa has high fever and confusion. A thin blood film shows numerous ring forms. Which species is most likely?",
    stemRu:
      "У путешественника, вернувшегося из Африки южнее Сахары, высокая лихорадка и спутанность сознания. В тонком мазке крови — многочисленные кольцевидные формы. Какой вид возбудителя наиболее вероятен?",
    options: [
      { id: "A", textEn: "Plasmodium vivax", textRu: "Plasmodium vivax" },
      { id: "B", textEn: "Plasmodium ovale", textRu: "Plasmodium ovale" },
      { id: "C", textEn: "Plasmodium malariae", textRu: "Plasmodium malariae" },
      { id: "D", textEn: "Plasmodium falciparum", textRu: "Plasmodium falciparum" },
    ],
    keyTerms: [
      { ru: "тропическая малярия", en: "falciparum malaria" },
      { ru: "тонкий мазок крови", en: "thin blood film" },
    ],
    ...demo,
  },
  {
    id: "q-neuro-01",
    topic: "neurology",
    difficulty: 1,
    stemEn:
      "A 45-year-old woman reports a sudden, severe 'worst-ever' headache followed by vomiting and neck stiffness. What is the first investigation?",
    stemRu:
      "Женщина 45 лет жалуется на внезапную интенсивную головную боль («самую сильную в жизни»), рвоту и ригидность затылочных мышц. Какое исследование проводится в первую очередь?",
    options: [
      { id: "A", textEn: "Non-contrast CT of the head", textRu: "КТ головного мозга без контрастирования" },
      { id: "B", textEn: "Electroencephalography", textRu: "Электроэнцефалография" },
      { id: "C", textEn: "Skull X-ray", textRu: "Рентгенография черепа" },
      { id: "D", textEn: "Lumbar puncture before any imaging", textRu: "Люмбальная пункция до нейровизуализации" },
    ],
    keyTerms: [
      { ru: "субарахноидальное кровоизлияние", en: "subarachnoid haemorrhage" },
      { ru: "ригидность затылочных мышц", en: "neck stiffness" },
    ],
    ...demo,
  },
  {
    id: "q-neuro-02",
    topic: "neurology",
    difficulty: 2,
    stemEn:
      "A right-handed man suddenly develops right-sided weakness affecting the face and arm more than the leg, with non-fluent speech but preserved comprehension. Which vascular territory is affected?",
    stemRu:
      "У мужчины-правши внезапно развилась слабость в правых конечностях (рука и лицо больше, чем нога), речь прерывистая, с трудом подбирает слова, понимание обращённой речи сохранено. Какой сосудистый бассейн поражён?",
    options: [
      { id: "A", textEn: "Right middle cerebral artery", textRu: "Правая средняя мозговая артерия" },
      { id: "B", textEn: "Left middle cerebral artery", textRu: "Левая средняя мозговая артерия" },
      { id: "C", textEn: "Left anterior cerebral artery", textRu: "Левая передняя мозговая артерия" },
      { id: "D", textEn: "Basilar artery", textRu: "Основная артерия" },
    ],
    keyTerms: [
      { ru: "моторная афазия", en: "expressive (Broca's) aphasia" },
      { ru: "гемипарез", en: "hemiparesis" },
    ],
    ...demo,
  },
  {
    id: "q-obs-01",
    topic: "obstetrics",
    difficulty: 1,
    stemEn:
      "A woman at 36 weeks' gestation has blood pressure 170/112 mmHg, proteinuria and a severe headache. Which drug is used to prevent eclamptic seizures?",
    stemRu:
      "У беременной на сроке 36 недель АД 170/112 мм рт. ст., протеинурия и сильная головная боль. Какой препарат применяется для профилактики судорог при эклампсии?",
    options: [
      { id: "A", textEn: "Diazepam", textRu: "Диазепам" },
      { id: "B", textEn: "Phenytoin", textRu: "Фенитоин" },
      { id: "C", textEn: "Magnesium sulfate", textRu: "Магния сульфат" },
      { id: "D", textEn: "Furosemide", textRu: "Фуросемид" },
    ],
    keyTerms: [
      { ru: "преэклампсия", en: "pre-eclampsia" },
      { ru: "протеинурия", en: "proteinuria" },
    ],
    ...demo,
  },
  {
    id: "q-obs-02",
    topic: "obstetrics",
    difficulty: 1,
    stemEn: "What is the most common cause of primary postpartum haemorrhage?",
    stemRu: "Какова наиболее частая причина раннего послеродового кровотечения?",
    options: [
      { id: "A", textEn: "Uterine atony", textRu: "Гипотония (атония) матки" },
      { id: "B", textEn: "Retained placental tissue", textRu: "Задержка частей плаценты" },
      { id: "C", textEn: "Genital tract trauma", textRu: "Травма родовых путей" },
      { id: "D", textEn: "Coagulopathy", textRu: "Коагулопатия" },
    ],
    keyTerms: [
      { ru: "послеродовое кровотечение", en: "postpartum haemorrhage" },
      { ru: "атония матки", en: "uterine atony" },
    ],
    ...demo,
  },
  {
    id: "q-ped-01",
    topic: "pediatrics",
    difficulty: 1,
    stemEn:
      "A 2-year-old has a low-grade fever, a barking cough and inspiratory stridor that is worse at night. What is the most likely diagnosis?",
    stemRu:
      "У ребёнка 2 лет субфебрильная температура, «лающий» кашель и инспираторный стридор, усиливающийся ночью. Наиболее вероятный диагноз?",
    options: [
      { id: "A", textEn: "Acute epiglottitis", textRu: "Острый эпиглоттит" },
      { id: "B", textEn: "Croup (acute laryngotracheitis)", textRu: "Острый стенозирующий ларинготрахеит (круп)" },
      { id: "C", textEn: "Foreign body aspiration", textRu: "Аспирация инородного тела" },
      { id: "D", textEn: "Bronchial asthma", textRu: "Бронхиальная астма" },
    ],
    keyTerms: [
      { ru: "инспираторный стридор", en: "inspiratory stridor" },
      { ru: "«лающий» кашель", en: "barking cough" },
    ],
    ...demo,
  },
  {
    id: "q-ped-02",
    topic: "pediatrics",
    difficulty: 1,
    stemEn: "What is the most common cause of acute bronchiolitis in infants?",
    stemRu: "Какой возбудитель является наиболее частой причиной острого бронхиолита у детей первого года жизни?",
    options: [
      { id: "A", textEn: "Respiratory syncytial virus", textRu: "Респираторно-синцитиальный вирус" },
      { id: "B", textEn: "Streptococcus pneumoniae", textRu: "Streptococcus pneumoniae" },
      { id: "C", textEn: "Influenza B virus", textRu: "Вирус гриппа B" },
      { id: "D", textEn: "Mycoplasma pneumoniae", textRu: "Mycoplasma pneumoniae" },
    ],
    keyTerms: [
      { ru: "бронхиолит", en: "bronchiolitis" },
      { ru: "РС-вирус", en: "RSV" },
    ],
    ...demo,
  },
  {
    id: "q-surg-01",
    topic: "surgery",
    difficulty: 1,
    stemEn:
      "In a patient with suspected appendicitis, pressure in the left iliac fossa causes pain in the right iliac fossa. What is this sign called?",
    stemRu:
      "У пациента с подозрением на аппендицит надавливание в левой подвздошной области вызывает боль в правой подвздошной области. Как называется этот симптом?",
    options: [
      { id: "A", textEn: "Murphy's sign", textRu: "Симптом Мерфи" },
      { id: "B", textEn: "Courvoisier's sign", textRu: "Симптом Курвуазье" },
      { id: "C", textEn: "Rovsing's sign", textRu: "Симптом Ровзинга" },
      { id: "D", textEn: "Kehr's sign", textRu: "Симптом Кера" },
    ],
    keyTerms: [
      { ru: "подвздошная область", en: "iliac fossa" },
      { ru: "симптом Ровзинга", en: "Rovsing's sign" },
    ],
    ...demo,
  },
  {
    id: "q-surg-02",
    topic: "surgery",
    difficulty: 2,
    stemEn:
      "A 40-year-old woman has right upper quadrant pain and fever. During deep palpation under the right costal margin she stops inspiring because of pain. Which diagnosis does this sign suggest?",
    stemRu:
      "У женщины 40 лет боль в правом подреберье и лихорадка. При глубокой пальпации под правой рёберной дугой она прерывает вдох из-за боли. На какой диагноз указывает этот симптом?",
    options: [
      { id: "A", textEn: "Acute cholecystitis", textRu: "Острый холецистит" },
      { id: "B", textEn: "Acute pancreatitis", textRu: "Острый панкреатит" },
      { id: "C", textEn: "Right renal colic", textRu: "Правосторонняя почечная колика" },
      { id: "D", textEn: "Perforated duodenal ulcer", textRu: "Перфоративная язва двенадцатиперстной кишки" },
    ],
    keyTerms: [
      { ru: "правое подреберье", en: "right upper quadrant" },
      { ru: "симптом Мерфи", en: "Murphy's sign" },
    ],
    ...demo,
  },
];

export const questionById = Object.fromEntries(questions.map((q) => [q.id, q])) as Record<
  string,
  Question
>;
