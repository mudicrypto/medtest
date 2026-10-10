// ILLUSTRATIVE DEMO QUESTION BANK
//
// 20 original practice questions written to demonstrate the app. They are
// ILLUSTRATIVE and UNREVIEWED: not validated by a qualified medical reviewer,
// not official exam content, and not for study. Each carries origin "demo"
// and review status "draft", so the app labels it accordingly.
//
// This file is the editable source. `pnpm content:build` turns it into
// content/demo-questions.csv (the import format) and supabase/seed.sql.

import type { QuestionRecord } from "../src/lib/content/model";

const DEMO = {
  origin: "demo",
  sourceRef: "MedPrep illustrative demo set (original)",
  rightsStatus: "owned",
  reviewStatus: "draft",
  reviewNote: "Illustrative only. Not yet validated by a qualified medical reviewer.",
} as const;

type Draft = Omit<QuestionRecord, keyof typeof DEMO | "options"> & {
  options: [string, string | null][];
};

const q = (d: Draft): QuestionRecord => ({
  ...d,
  ...DEMO,
  options: d.options.map(([textEn, textRu], i) => ({ id: "ABCD"[i] as "A" | "B" | "C" | "D", textEn, textRu })),
});

export const demoBank: QuestionRecord[] = [
  // ─── Cardiology ────────────────────────────────────────────────────────
  q({
    id: "q-card-01",
    specialty: "cardiology",
    subject: "Ischaemic heart disease",
    topic: "Acute coronary syndrome",
    subtopic: "ECG localisation",
    difficulty: 2,
    stemEn:
      "A 58-year-old man presents with 40 minutes of crushing retrosternal chest pain. The ECG shows ST-segment elevation in leads II, III and aVF. Occlusion of which artery is most likely?",
    stemRu:
      "Мужчина 58 лет поступил с давящей загрудинной болью, продолжающейся 40 минут. На ЭКГ — подъём сегмента ST в отведениях II, III, aVF. Окклюзия какой артерии наиболее вероятна?",
    options: [
      ["Left anterior descending artery", "Передняя межжелудочковая ветвь левой коронарной артерии"],
      ["Right coronary artery", "Правая коронарная артерия"],
      ["Left circumflex artery", "Огибающая ветвь левой коронарной артерии"],
      ["Left main coronary artery", "Ствол левой коронарной артерии"],
    ],
    correct: "B",
    explanationEn:
      "Leads II, III and aVF look at the inferior wall of the left ventricle. In most people (right-dominant circulation) the inferior wall is supplied by the right coronary artery, so inferior STEMI usually reflects RCA occlusion.",
    explanationRu:
      "Отведения II, III и aVF отражают нижнюю стенку левого желудочка. У большинства людей (правый тип кровоснабжения) её кровоснабжает правая коронарная артерия, поэтому нижний инфаркт с подъёмом ST обычно связан с окклюзией ПКА.",
    optionExplanations: {
      A: "LAD occlusion causes anterior ST elevation (V1–V4), not inferior.",
      C: "The circumflex causes lateral changes (I, aVL, V5–V6); it supplies the inferior wall only in the minority with left-dominant circulation.",
      D: "Left main occlusion typically causes widespread ST depression with ST elevation in aVR and rapid haemodynamic collapse.",
    },
    examPearl:
      "In inferior STEMI, record right-sided leads (V4R): right-ventricular infarction makes the patient preload-dependent, so avoid nitrates.",
    tutorHint:
      "Think of the leads as cameras: II, III and aVF all view the inferior wall. Which artery usually feeds that wall in a right-dominant heart?",
    keyTerms: [
      { ru: "подъём сегмента ST", en: "ST-segment elevation" },
      { ru: "загрудинная боль", en: "retrosternal chest pain" },
      { ru: "нижняя стенка", en: "inferior wall" },
    ],
  }),
  q({
    id: "q-card-02",
    specialty: "cardiology",
    subject: "Arrhythmias",
    topic: "Supraventricular tachycardia",
    subtopic: "Acute management",
    difficulty: 2,
    stemEn:
      "A haemodynamically stable 30-year-old woman has a regular narrow-complex tachycardia at 190/min. Vagal manoeuvres have failed. What is the most appropriate next drug?",
    stemRu:
      "У гемодинамически стабильной женщины 30 лет регулярная тахикардия с узкими комплексами QRS, ЧСС 190 в минуту. Вагусные пробы неэффективны. Какой препарат наиболее целесообразен?",
    options: [
      ["Adenosine IV bolus", "Аденозин внутривенно болюсно"],
      ["Atropine IV", "Атропин внутривенно"],
      ["Oral digoxin", "Дигоксин внутрь"],
      ["Synchronised cardioversion", "Синхронизированная кардиоверсия"],
    ],
    correct: "A",
    explanationEn:
      "A regular narrow-complex tachycardia in a stable patient is most often AV-nodal re-entry. After vagal manoeuvres fail, a rapid IV bolus of adenosine transiently blocks the AV node and usually terminates it.",
    explanationRu: null,
    optionExplanations: {
      B: "Atropine speeds AV conduction and heart rate; it is used for symptomatic bradycardia.",
      C: "Oral digoxin acts far too slowly to terminate an acute tachycardia.",
      D: "Synchronised cardioversion is for unstable patients (shock, syncope, ischaemia, heart failure). This patient is stable.",
    },
    examPearl:
      "Give adenosine as a rapid bolus followed immediately by a saline flush through a large proximal vein, and warn the patient about brief chest discomfort.",
    tutorHint: "Stable + regular + narrow = re-entry through the AV node. Which drug briefly blocks the AV node?",
    keyTerms: [
      { ru: "вагусные пробы", en: "vagal manoeuvres" },
      { ru: "тахикардия с узкими комплексами", en: "narrow-complex tachycardia" },
    ],
  }),
  q({
    id: "q-card-03",
    specialty: "cardiology",
    subject: "Heart failure",
    topic: "Chronic heart failure",
    subtopic: "Prognostic therapy",
    difficulty: 2,
    stemEn:
      "A 66-year-old man has chronic heart failure with a left-ventricular ejection fraction of 30%. He is on furosemide and ramipril. Which additional drug has been shown to improve survival?",
    stemRu:
      "У мужчины 66 лет хроническая сердечная недостаточность с фракцией выброса левого желудочка 30%. Он принимает фуросемид и рамиприл. Какой дополнительный препарат доказанно улучшает выживаемость?",
    options: [
      ["Digoxin", "Дигоксин"],
      ["Amlodipine", "Амлодипин"],
      ["Bisoprolol", "Бисопролол"],
      ["Increasing the furosemide dose", "Увеличение дозы фуросемида"],
    ],
    correct: "C",
    explanationEn:
      "Evidence-based beta-blockers (bisoprolol, carvedilol, metoprolol succinate) reduce mortality in heart failure with reduced ejection fraction. Start low and titrate slowly once the patient is euvolaemic.",
    explanationRu: null,
    optionExplanations: {
      A: "Digoxin reduces hospital admissions but does not improve survival.",
      B: "Amlodipine is neutral for mortality in heart failure; it may be used for hypertension or angina but is not prognostic.",
      D: "Loop diuretics relieve congestion and symptoms but do not improve survival.",
    },
    examPearl:
      "The four pillars of HFrEF therapy: ACE inhibitor/ARB/ARNI, an evidence-based beta-blocker, a mineralocorticoid receptor antagonist and an SGLT2 inhibitor.",
    tutorHint: "Separate drugs that make patients feel better from drugs that make them live longer.",
    keyTerms: [
      { ru: "фракция выброса", en: "ejection fraction" },
      { ru: "хроническая сердечная недостаточность", en: "chronic heart failure" },
    ],
  }),
  q({
    id: "q-card-04",
    specialty: "cardiology",
    subject: "Valvular and infective heart disease",
    topic: "Infective endocarditis",
    subtopic: "Microbiology",
    difficulty: 1,
    stemEn:
      "A 29-year-old man who injects drugs has fever for 5 days, a new pansystolic murmur at the left lower sternal edge and multiple lung nodules on chest X-ray. Which organism is most likely?",
    stemRu:
      "У мужчины 29 лет, употребляющего внутривенные наркотики, 5 дней лихорадка, новый пансистолический шум у левого края грудины внизу и множественные очаги в лёгких на рентгенограмме. Какой возбудитель наиболее вероятен?",
    options: [
      ["Viridans group streptococci", "Зеленящие стрептококки"],
      ["Enterococcus faecalis", "Enterococcus faecalis"],
      ["Staphylococcus epidermidis", "Staphylococcus epidermidis"],
      ["Staphylococcus aureus", "Staphylococcus aureus"],
    ],
    correct: "D",
    explanationEn:
      "Right-sided (tricuspid) endocarditis in people who inject drugs is most often caused by Staphylococcus aureus. Septic emboli to the lungs explain the nodules.",
    explanationRu: null,
    optionExplanations: {
      A: "Viridans streptococci typically cause subacute endocarditis on abnormal native left-sided valves, often after dental procedures.",
      B: "Enterococci are associated with older patients and gastrointestinal or urinary tract procedures.",
      C: "Coagulase-negative staphylococci mainly infect prosthetic valves and devices, especially early after surgery.",
    },
    examPearl: "Take at least three sets of blood cultures from separate venepunctures before starting antibiotics.",
    tutorHint: "Injecting drugs + tricuspid murmur + lung emboli: think of the skin organism that is most virulent.",
    keyTerms: [
      { ru: "инфекционный эндокардит", en: "infective endocarditis" },
      { ru: "трикуспидальный клапан", en: "tricuspid valve" },
      { ru: "септические эмболы", en: "septic emboli" },
    ],
  }),

  // ─── Pulmonology ───────────────────────────────────────────────────────
  q({
    id: "q-pulm-01",
    specialty: "pulmonology",
    subject: "Pleural disease",
    topic: "Pleural effusion",
    subtopic: "Light's criteria",
    difficulty: 2,
    stemEn:
      "A pleural fluid sample is analysed. Which finding indicates that the effusion is an exudate according to Light's criteria?",
    stemRu: "Проведён анализ плевральной жидкости. Какой показатель свидетельствует об экссудате согласно критериям Лайта?",
    options: [
      ["Pleural fluid / serum protein ratio of 0.3", "Отношение белка плевральной жидкости к белку сыворотки 0,3"],
      ["Pleural fluid / serum protein ratio greater than 0.5", "Отношение белка плевральной жидкости к белку сыворотки более 0,5"],
      ["Pleural fluid / serum LDH ratio of 0.4", "Отношение ЛДГ плевральной жидкости к ЛДГ сыворотки 0,4"],
      ["Pleural LDH below two-thirds of the serum upper limit of normal", "ЛДГ плевральной жидкости менее 2/3 верхней границы нормы сыворотки"],
    ],
    correct: "B",
    explanationEn:
      "An effusion is an exudate if ANY of these is true: pleural/serum protein > 0.5, pleural/serum LDH > 0.6, or pleural LDH > two-thirds of the upper limit of normal for serum LDH.",
    explanationRu:
      "Выпот считается экссудатом, если выполняется ЛЮБОЙ критерий: отношение белка плевральной жидкости к сывороточному > 0,5; отношение ЛДГ > 0,6; ЛДГ плевральной жидкости > 2/3 верхней границы нормы сывороточной ЛДГ.",
    optionExplanations: {
      A: "A protein ratio of 0.3 is below the 0.5 threshold, which fits a transudate.",
      C: "An LDH ratio of 0.4 is below the 0.6 threshold.",
      D: "Pleural LDH below two-thirds of the upper limit is on the transudate side.",
    },
    examPearl:
      "Light's criteria are very sensitive for exudates and can misclassify heart-failure effusions after diuretics; a serum–pleural albumin gradient > 12 g/L then supports a transudate.",
    tutorHint: "Remember the three numbers: 0.5, 0.6 and two-thirds.",
    keyTerms: [
      { ru: "плевральный выпот", en: "pleural effusion" },
      { ru: "экссудат", en: "exudate" },
      { ru: "транссудат", en: "transudate" },
    ],
  }),
  q({
    id: "q-pulm-02",
    specialty: "pulmonology",
    subject: "Pleural disease",
    topic: "Pneumothorax",
    subtopic: "Clinical diagnosis",
    difficulty: 1,
    stemEn:
      "A tall, thin 22-year-old man develops sudden right-sided pleuritic chest pain and breathlessness. On the right, breath sounds are absent and percussion is hyperresonant. What is the most likely diagnosis?",
    stemRu:
      "У высокого худощавого мужчины 22 лет внезапно возникли боль в правой половине грудной клетки, усиливающаяся при дыхании, и одышка. Справа дыхание не проводится, перкуторно — коробочный звук. Наиболее вероятный диагноз?",
    options: [
      ["Lobar pneumonia", "Долевая пневмония"],
      ["Pleural effusion", "Плевральный выпот"],
      ["Primary spontaneous pneumothorax", "Первичный спонтанный пневмоторакс"],
      ["Pulmonary embolism", "Тромбоэмболия лёгочной артерии"],
    ],
    correct: "C",
    explanationEn:
      "Primary spontaneous pneumothorax typically affects tall, thin young men without lung disease. Air in the pleural space gives absent breath sounds with a hyperresonant percussion note.",
    explanationRu: null,
    optionExplanations: {
      A: "Consolidation is dull to percussion, with bronchial breathing and usually fever.",
      B: "Fluid gives a stony-dull percussion note, not hyperresonance.",
      D: "Pulmonary embolism causes pleuritic pain and breathlessness, but the chest examination is usually normal.",
    },
    examPearl: "Tension pneumothorax is a clinical diagnosis: decompress immediately, without waiting for an X-ray.",
    tutorHint: "Percussion decides it: dull means fluid or consolidation; hyperresonant means air.",
    keyTerms: [
      { ru: "пневмоторакс", en: "pneumothorax" },
      { ru: "коробочный звук", en: "hyperresonant percussion note" },
    ],
  }),
  q({
    id: "q-pulm-03",
    specialty: "pulmonology",
    subject: "Obstructive airway disease",
    topic: "Asthma",
    subtopic: "Acute exacerbation",
    difficulty: 1,
    stemEn:
      "A 24-year-old woman with asthma has a severe attack: she cannot complete sentences, respiratory rate is 30/min and peak flow is 40% of her best. After oxygen, what is the first-line treatment?",
    stemRu:
      "У женщины 24 лет с бронхиальной астмой тяжёлое обострение: не может закончить фразу, ЧДД 30 в минуту, пиковая скорость выдоха 40% от лучшего значения. Что назначают в первую очередь после кислорода?",
    options: [
      ["IV magnesium sulfate", "Магния сульфат внутривенно"],
      ["High-dose nebulised salbutamol", "Сальбутамол через небулайзер в высокой дозе"],
      ["Oral montelukast", "Монтелукаст внутрь"],
      ["IV aminophylline", "Аминофиллин внутривенно"],
    ],
    correct: "B",
    explanationEn:
      "High-dose inhaled short-acting β2-agonist (salbutamol by nebuliser, driven by oxygen) is first-line, together with systemic corticosteroids. Ipratropium is added in severe attacks.",
    explanationRu: null,
    optionExplanations: {
      A: "IV magnesium is an add-on for severe attacks that do not respond to initial bronchodilator therapy.",
      C: "Leukotriene antagonists are maintenance drugs with no role in treating an acute attack.",
      D: "Aminophylline is not first-line: it adds little benefit and has a narrow therapeutic window. Senior advice is needed.",
    },
    examPearl:
      "In acute asthma, a normal or rising PaCO₂ means the patient is tiring. It is a life-threatening sign, so involve intensive care early.",
    tutorHint: "Open the airways fast, with the drug that works in minutes.",
    keyTerms: [
      { ru: "бронхиальная астма", en: "bronchial asthma" },
      { ru: "пиковая скорость выдоха", en: "peak expiratory flow" },
      { ru: "обострение", en: "exacerbation" },
    ],
  }),
  q({
    id: "q-pulm-04",
    specialty: "pulmonology",
    subject: "Obstructive airway disease",
    topic: "COPD",
    subtopic: "Long-term management",
    difficulty: 2,
    stemEn:
      "A 70-year-old ex-smoker with COPD has a resting PaO₂ of 6.9 kPa (52 mmHg) on two measurements 3 weeks apart while clinically stable. Which intervention improves his survival?",
    stemRu:
      "У мужчины 70 лет, бывшего курильщика с ХОБЛ, в стабильном состоянии дважды с интервалом 3 недели PaO₂ в покое 6,9 кПа (52 мм рт. ст.). Какое вмешательство улучшает выживаемость?",
    options: [
      ["Inhaled corticosteroid monotherapy", "Монотерапия ингаляционным глюкокортикостероидом"],
      ["Long-term oral prednisolone", "Длительный приём преднизолона внутрь"],
      ["Long-term oxygen therapy for at least 15 hours a day", "Длительная кислородотерапия не менее 15 часов в сутки"],
      ["Regular carbocisteine", "Регулярный приём карбоцистеина"],
    ],
    correct: "C",
    explanationEn:
      "In COPD with chronic hypoxaemia (PaO₂ ≤ 7.3 kPa / 55 mmHg when stable), long-term oxygen therapy for at least 15 hours a day prolongs survival.",
    explanationRu: null,
    optionExplanations: {
      A: "Inhaled corticosteroids alone do not improve survival and increase pneumonia risk; they are combined with long-acting bronchodilators in selected patients.",
      B: "Long-term oral steroids cause significant harm (myopathy, osteoporosis, diabetes) without survival benefit.",
      D: "Mucolytics may reduce exacerbations in some patients but do not improve survival.",
    },
    examPearl:
      "Two interventions are shown to prolong life in COPD: stopping smoking and long-term oxygen therapy for chronic hypoxaemia.",
    tutorHint: "Which treatment corrects the chronic problem in his blood gas?",
    keyTerms: [
      { ru: "ХОБЛ", en: "COPD" },
      { ru: "длительная кислородотерапия", en: "long-term oxygen therapy" },
      { ru: "гипоксемия", en: "hypoxaemia" },
    ],
  }),

  // ─── Neurology ─────────────────────────────────────────────────────────
  q({
    id: "q-neuro-01",
    specialty: "neurology",
    subject: "Cerebrovascular disease",
    topic: "Subarachnoid haemorrhage",
    subtopic: "Investigation",
    difficulty: 1,
    stemEn:
      "A 45-year-old woman reports a sudden, severe 'worst-ever' headache followed by vomiting and neck stiffness. What is the first investigation?",
    stemRu:
      "Женщина 45 лет жалуется на внезапную интенсивную головную боль («самую сильную в жизни»), рвоту и ригидность затылочных мышц. Какое исследование проводится в первую очередь?",
    options: [
      ["Non-contrast CT of the head", "КТ головного мозга без контрастирования"],
      ["Electroencephalography", "Электроэнцефалография"],
      ["Skull X-ray", "Рентгенография черепа"],
      ["Lumbar puncture before any imaging", "Люмбальная пункция до нейровизуализации"],
    ],
    correct: "A",
    explanationEn:
      "A sudden 'thunderclap' headache suggests subarachnoid haemorrhage. Non-contrast CT is the first investigation. If it is negative but suspicion remains, lumbar puncture is done later, looking for xanthochromia.",
    explanationRu: null,
    optionExplanations: {
      B: "EEG assesses seizure activity and does not detect haemorrhage.",
      C: "A skull X-ray cannot show intracranial blood.",
      D: "Imaging comes first: LP before CT risks herniation if there is a mass lesion, and xanthochromia needs time (about 12 hours) to develop.",
    },
    examPearl: "CT is most sensitive for subarachnoid blood within the first 6 hours of headache onset; sensitivity falls over the following days.",
    tutorHint: "Imaging before needles.",
    keyTerms: [
      { ru: "субарахноидальное кровоизлияние", en: "subarachnoid haemorrhage" },
      { ru: "ригидность затылочных мышц", en: "neck stiffness" },
      { ru: "ксантохромия", en: "xanthochromia" },
    ],
  }),
  q({
    id: "q-neuro-02",
    specialty: "neurology",
    subject: "Cerebrovascular disease",
    topic: "Ischaemic stroke",
    subtopic: "Vascular localisation",
    difficulty: 2,
    stemEn:
      "A right-handed man suddenly develops right-sided weakness affecting the face and arm more than the leg, with non-fluent speech but preserved comprehension. Which vascular territory is affected?",
    stemRu:
      "У мужчины-правши внезапно развилась слабость в правых конечностях (рука и лицо больше, чем нога), речь прерывистая, с трудом подбирает слова, понимание обращённой речи сохранено. Какой сосудистый бассейн поражён?",
    options: [
      ["Right middle cerebral artery", "Правая средняя мозговая артерия"],
      ["Left middle cerebral artery", "Левая средняя мозговая артерия"],
      ["Left anterior cerebral artery", "Левая передняя мозговая артерия"],
      ["Basilar artery", "Основная артерия"],
    ],
    correct: "B",
    explanationEn:
      "Face and arm weakness greater than leg weakness indicates the middle cerebral artery territory. Expressive (Broca's) aphasia means the dominant hemisphere, which is the left in nearly all right-handed people.",
    explanationRu: null,
    optionExplanations: {
      A: "A right MCA stroke causes LEFT-sided weakness, often with neglect rather than aphasia.",
      C: "ACA strokes affect the leg more than the arm and face, often with behavioural change.",
      D: "Basilar occlusion causes bilateral signs, cranial nerve palsies and reduced consciousness.",
    },
    examPearl: "Establish when the patient was last seen well: it decides eligibility for thrombolysis and thrombectomy.",
    tutorHint: "Two steps: which side (opposite the weakness), then which artery (face + arm > leg is MCA).",
    keyTerms: [
      { ru: "моторная афазия", en: "expressive (Broca's) aphasia" },
      { ru: "гемипарез", en: "hemiparesis" },
      { ru: "ишемический инсульт", en: "ischaemic stroke" },
    ],
  }),
  q({
    id: "q-neuro-03",
    specialty: "neurology",
    subject: "Neuromuscular disease",
    topic: "Myasthenia gravis",
    subtopic: "Diagnosis",
    difficulty: 2,
    stemEn:
      "A 34-year-old woman has drooping eyelids and double vision that are worse in the evening and improve after rest. Strength in the arms decreases with repeated effort. Which antibody test best supports the likely diagnosis?",
    stemRu:
      "У женщины 34 лет опущение век и двоение в глазах, усиливающиеся к вечеру и уменьшающиеся после отдыха. Сила в руках снижается при повторных усилиях. Определение каких антител лучше всего подтвердит вероятный диагноз?",
    options: [
      ["Anti-acetylcholine receptor antibodies", "Антитела к ацетилхолиновым рецепторам"],
      ["Anti-voltage-gated calcium channel antibodies", "Антитела к потенциалзависимым кальциевым каналам"],
      ["Anti-GQ1b antibodies", "Антитела к ганглиозиду GQ1b"],
      ["Anti-aquaporin-4 antibodies", "Антитела к аквапорину-4"],
    ],
    correct: "A",
    explanationEn:
      "Fatigable weakness affecting the eyes first, worse later in the day, is typical of myasthenia gravis. Acetylcholine receptor antibodies are found in most patients with generalised disease.",
    explanationRu: null,
    optionExplanations: {
      B: "VGCC antibodies indicate Lambert–Eaton syndrome: proximal weakness that improves with repeated effort, often with autonomic features and small-cell lung cancer.",
      C: "Anti-GQ1b antibodies are associated with Miller Fisher syndrome (ophthalmoplegia, ataxia, areflexia).",
      D: "Aquaporin-4 antibodies indicate neuromyelitis optica spectrum disorder (optic neuritis and myelitis).",
    },
    examPearl: "Every patient newly diagnosed with myasthenia gravis needs CT of the chest to look for a thymoma.",
    tutorHint: "Weakness that worsens with use points to the neuromuscular junction, on the postsynaptic side.",
    keyTerms: [
      { ru: "миастения", en: "myasthenia gravis" },
      { ru: "птоз", en: "ptosis" },
      { ru: "диплопия", en: "diplopia" },
    ],
  }),
  q({
    id: "q-neuro-04",
    specialty: "neurology",
    subject: "Epilepsy",
    topic: "Status epilepticus",
    subtopic: "Emergency treatment",
    difficulty: 2,
    stemEn:
      "A 40-year-old man in the emergency department has had a generalised tonic-clonic seizure lasting 6 minutes. IV access is established and glucose is normal. What is the first-line drug?",
    stemRu:
      "У мужчины 40 лет в приёмном отделении генерализованный тонико-клонический приступ длится 6 минут. Внутривенный доступ установлен, глюкоза в норме. Какой препарат первой линии?",
    options: [
      ["IV levetiracetam", "Леветирацетам внутривенно"],
      ["IV benzodiazepine (lorazepam or diazepam)", "Бензодиазепин внутривенно (лоразепам или диазепам)"],
      ["IV phenytoin", "Фенитоин внутривенно"],
      ["General anaesthesia with thiopental", "Общая анестезия тиопенталом"],
    ],
    correct: "B",
    explanationEn:
      "A seizure lasting 5 minutes or more is treated as status epilepticus. An IV benzodiazepine is first-line; a second-line anticonvulsant follows if seizures continue.",
    explanationRu: null,
    optionExplanations: {
      A: "Levetiracetam is a second-line agent, given if seizures continue after benzodiazepines.",
      C: "Phenytoin is also second-line and needs cardiac monitoring during infusion.",
      D: "General anaesthesia is reserved for refractory status epilepticus that persists after second-line drugs.",
    },
    examPearl:
      "If seizures continue after two doses of benzodiazepine, move to a second-line drug; don't keep repeating benzodiazepines.",
    tutorHint: "Stop the seizure fast first; loading a longer-acting drug comes second.",
    keyTerms: [
      { ru: "эпилептический статус", en: "status epilepticus" },
      { ru: "судороги", en: "seizures" },
    ],
  }),

  // ─── Endocrinology ─────────────────────────────────────────────────────
  q({
    id: "q-endo-01",
    specialty: "endocrinology",
    subject: "Diabetes mellitus",
    topic: "Diabetic ketoacidosis",
    subtopic: "Initial management",
    difficulty: 2,
    stemEn:
      "A 19-year-old with type 1 diabetes presents with vomiting, Kussmaul breathing, glucose 28 mmol/L and pH 7.1. What is the most important first step in management?",
    stemRu:
      "Пациент 19 лет с сахарным диабетом 1 типа поступил с рвотой, дыханием Куссмауля, глюкозой 28 ммоль/л и pH 7,1. Какое первоочередное мероприятие наиболее важно?",
    options: [
      ["IV 0.9% sodium chloride", "Внутривенное введение 0,9% раствора натрия хлорида"],
      ["Routine IV sodium bicarbonate", "Рутинное внутривенное введение натрия гидрокарбоната"],
      ["Subcutaneous insulin glargine alone", "Только подкожное введение инсулина гларгин"],
      ["Oral rehydration solution", "Пероральная регидратация"],
    ],
    correct: "A",
    explanationEn:
      "Patients in DKA are severely volume-depleted. The first priority is IV isotonic fluid, followed by a fixed-rate IV insulin infusion and careful potassium replacement.",
    explanationRu:
      "При диабетическом кетоацидозе выражена дегидратация. Первоочередная задача — внутривенная инфузия изотонического раствора, затем внутривенная инфузия инсулина с фиксированной скоростью и тщательное восполнение калия.",
    optionExplanations: {
      B: "Bicarbonate is not routinely recommended: it can worsen hypokalaemia and, in children, is linked to cerebral oedema.",
      C: "Subcutaneous long-acting insulin alone is inadequate acutely; IV insulin is needed (basal insulin may be continued alongside).",
      D: "A vomiting, severely dehydrated patient cannot be rehydrated by mouth.",
    },
    examPearl: "Check potassium before starting insulin: if K⁺ is below 3.5 mmol/L, replace it first, because insulin drives potassium into cells.",
    tutorHint: "Fluids first, then insulin, and watch potassium throughout.",
    keyTerms: [
      { ru: "диабетический кетоацидоз", en: "diabetic ketoacidosis" },
      { ru: "дыхание Куссмауля", en: "Kussmaul breathing" },
    ],
  }),
  q({
    id: "q-endo-02",
    specialty: "endocrinology",
    subject: "Thyroid disease",
    topic: "Hypothyroidism",
    subtopic: "Laboratory diagnosis",
    difficulty: 1,
    stemEn: "Which laboratory pattern is typical of primary hypothyroidism?",
    stemRu: "Какие лабораторные показатели характерны для первичного гипотиреоза?",
    options: [
      ["Low TSH, high free T4", "ТТГ снижен, свободный T4 повышен"],
      ["High TSH, low free T4", "ТТГ повышен, свободный T4 снижен"],
      ["Low TSH, low free T4", "ТТГ снижен, свободный T4 снижен"],
      ["Normal TSH, high free T4", "ТТГ в норме, свободный T4 повышен"],
    ],
    correct: "B",
    explanationEn:
      "In primary hypothyroidism the thyroid itself fails, so free T4 falls and the pituitary responds by increasing TSH.",
    explanationRu: null,
    optionExplanations: {
      A: "Low TSH with high free T4 is the pattern of primary hyperthyroidism.",
      C: "Low TSH with low free T4 suggests secondary (central) hypothyroidism or non-thyroidal illness.",
      D: "Normal TSH with high free T4 suggests assay interference or rare causes such as a TSH-secreting adenoma.",
    },
    examPearl: "In central hypothyroidism, TSH can't be used to monitor treatment; titrate levothyroxine to free T4 instead.",
    tutorHint: "Follow the feedback loop: when the gland fails, the pituitary 'shouts louder'.",
    keyTerms: [
      { ru: "гипотиреоз", en: "hypothyroidism" },
      { ru: "тиреотропный гормон (ТТГ)", en: "thyroid-stimulating hormone (TSH)" },
    ],
  }),
  q({
    id: "q-endo-03",
    specialty: "endocrinology",
    subject: "Adrenal disease",
    topic: "Adrenal insufficiency",
    subtopic: "Adrenal crisis",
    difficulty: 2,
    stemEn:
      "A 38-year-old woman with weeks of fatigue, weight loss and darkening skin presents with vomiting and BP 75/40 mmHg. Sodium is 124 mmol/L and potassium 6.1 mmol/L. After taking blood for cortisol, what is the most urgent treatment?",
    stemRu:
      "Женщина 38 лет с многонедельной слабостью, похуданием и потемнением кожи поступила с рвотой, АД 75/40 мм рт. ст. Натрий 124 ммоль/л, калий 6,1 ммоль/л. Какое лечение наиболее срочно после забора крови на кортизол?",
    options: [
      ["IV hydrocortisone 100 mg with IV saline", "Гидрокортизон 100 мг внутривенно и инфузия физиологического раствора"],
      ["Oral fludrocortisone", "Флудрокортизон внутрь"],
      ["IV levothyroxine", "Левотироксин внутривенно"],
      ["Wait for a synacthen test result before treating", "Дождаться результата пробы с синактеном перед лечением"],
    ],
    correct: "A",
    explanationEn:
      "Hypotension, hyponatraemia, hyperkalaemia and hyperpigmentation suggest adrenal crisis from primary adrenal insufficiency. Give IV hydrocortisone immediately, with fluid resuscitation.",
    explanationRu: null,
    optionExplanations: {
      B: "Fludrocortisone replaces mineralocorticoid long term; it is too slow and does not replace cortisol in a crisis.",
      C: "Thyroid hormone is not indicated, and giving it before steroids in combined deficiency can precipitate crisis.",
      D: "Testing must never delay treatment in suspected adrenal crisis; it can be done after stabilisation.",
    },
    examPearl: "Never delay steroids in suspected adrenal crisis: take a cortisol (± ACTH) sample, then give hydrocortisone straight away.",
    tutorHint: "Low sodium + high potassium + shock + pigmentation: which hormone is missing?",
    keyTerms: [
      { ru: "надпочечниковая недостаточность", en: "adrenal insufficiency" },
      { ru: "гиперпигментация", en: "hyperpigmentation" },
      { ru: "гиперкалиемия", en: "hyperkalaemia" },
    ],
  }),
  q({
    id: "q-endo-04",
    specialty: "endocrinology",
    subject: "Diabetes mellitus",
    topic: "Type 2 diabetes",
    subtopic: "Pharmacotherapy",
    difficulty: 1,
    stemEn:
      "A 52-year-old with newly diagnosed type 2 diabetes has HbA1c 7.8% (62 mmol/mol) despite lifestyle changes. Kidney function is normal and there is no cardiovascular or kidney disease. Which drug is usually started first?",
    stemRu:
      "У пациента 52 лет с впервые выявленным сахарным диабетом 2 типа HbA1c 7,8% (62 ммоль/моль), несмотря на изменение образа жизни. Функция почек в норме, сердечно-сосудистых заболеваний и болезней почек нет. Какой препарат обычно назначают первым?",
    options: [
      ["Insulin glargine", "Инсулин гларгин"],
      ["Gliclazide", "Гликлазид"],
      ["Metformin", "Метформин"],
      ["Pioglitazone", "Пиоглитазон"],
    ],
    correct: "C",
    explanationEn:
      "Metformin is the usual first-line drug: effective, weight-neutral, low risk of hypoglycaemia and inexpensive. Check kidney function first.",
    explanationRu: null,
    optionExplanations: {
      A: "Insulin is reserved for marked hyperglycaemia, catabolic symptoms or failure of other therapy.",
      B: "Sulfonylureas cause hypoglycaemia and weight gain; they are usually second-line.",
      D: "Pioglitazone causes weight gain and fluid retention, and is avoided in heart failure.",
    },
    examPearl:
      "In patients with established cardiovascular disease, heart failure or chronic kidney disease, add an SGLT2 inhibitor or GLP-1 receptor agonist with proven benefit, whatever the HbA1c.",
    tutorHint: "Pick the drug with the best balance of effectiveness, safety and cost for an uncomplicated patient.",
    keyTerms: [
      { ru: "сахарный диабет 2 типа", en: "type 2 diabetes mellitus" },
      { ru: "гликированный гемоглобин", en: "glycated haemoglobin (HbA1c)" },
    ],
  }),

  // ─── Emergency medicine ────────────────────────────────────────────────
  q({
    id: "q-em-01",
    specialty: "emergency-medicine",
    subject: "Shock",
    topic: "Anaphylaxis",
    subtopic: "Immediate treatment",
    difficulty: 1,
    stemEn:
      "Ten minutes after a wasp sting, a 30-year-old man has widespread urticaria, lip swelling, wheeze and BP 80/50 mmHg. What is the first drug to give?",
    stemRu:
      "Через 10 минут после ужаления осой у мужчины 30 лет генерализованная крапивница, отёк губ, свистящее дыхание, АД 80/50 мм рт. ст. Какой препарат вводят первым?",
    options: [
      ["Adrenaline 0.5 mg intramuscularly", "Адреналин (эпинефрин) 0,5 мг внутримышечно"],
      ["Chlorphenamine IV", "Хлорфенамин внутривенно"],
      ["Hydrocortisone IV", "Гидрокортизон внутривенно"],
      ["Nebulised salbutamol", "Сальбутамол через небулайзер"],
    ],
    correct: "A",
    explanationEn:
      "Anaphylaxis is treated first with intramuscular adrenaline (0.5 mg of 1 mg/mL for adults, into the anterolateral thigh), plus airway support, oxygen and IV fluids for hypotension.",
    explanationRu:
      "При анафилаксии первым вводят адреналин внутримышечно (взрослым 0,5 мг раствора 1 мг/мл в переднебоковую поверхность бедра), одновременно обеспечивают проходимость дыхательных путей, кислород и инфузию при гипотензии.",
    optionExplanations: {
      B: "Antihistamines only treat skin symptoms; they do not reverse airway swelling or shock.",
      C: "Corticosteroids act too slowly for the emergency and are not first-line.",
      D: "Salbutamol can help residual wheeze, but only after adrenaline.",
    },
    examPearl: "If there is no improvement, repeat IM adrenaline after 5 minutes; don't wait for IV access to give the first dose.",
    tutorHint: "Only one drug treats airway swelling, bronchospasm and shock at the same time.",
    keyTerms: [
      { ru: "анафилаксия", en: "anaphylaxis" },
      { ru: "крапивница", en: "urticaria" },
      { ru: "отёк Квинке", en: "angioedema" },
    ],
  }),
  q({
    id: "q-em-02",
    specialty: "emergency-medicine",
    subject: "Resuscitation",
    topic: "Cardiac arrest",
    subtopic: "Shockable rhythms",
    difficulty: 1,
    stemEn:
      "During CPR for an unresponsive patient, the defibrillator shows ventricular fibrillation. What is the immediate next step?",
    stemRu:
      "Во время сердечно-лёгочной реанимации у пациента без сознания на мониторе дефибриллятора — фибрилляция желудочков. Какое следующее действие?",
    options: [
      ["Give IV adrenaline 1 mg", "Ввести адреналин 1 мг внутривенно"],
      ["Deliver a defibrillator shock", "Нанести разряд дефибриллятора"],
      ["Give IV amiodarone 300 mg", "Ввести амиодарон 300 мг внутривенно"],
      ["Check the carotid pulse for 30 seconds", "Проверить пульс на сонной артерии в течение 30 секунд"],
    ],
    correct: "B",
    explanationEn:
      "VF is a shockable rhythm: deliver a shock as soon as possible, then immediately resume chest compressions for 2 minutes before reassessing the rhythm.",
    explanationRu: null,
    optionExplanations: {
      A: "In shockable rhythms, adrenaline is given after the third shock, not before the first.",
      C: "Amiodarone is given after the third shock for persistent VF or pulseless VT.",
      D: "Pulse checks must be brief (under 10 seconds) and never delay defibrillation.",
    },
    examPearl: "Minimise pauses in chest compressions: restart CPR straight after each shock, without checking for a pulse.",
    tutorHint: "Shockable rhythm: what single action changes the outcome most?",
    keyTerms: [
      { ru: "фибрилляция желудочков", en: "ventricular fibrillation" },
      { ru: "сердечно-лёгочная реанимация", en: "cardiopulmonary resuscitation" },
      { ru: "дефибрилляция", en: "defibrillation" },
    ],
  }),
  q({
    id: "q-em-03",
    specialty: "emergency-medicine",
    subject: "Toxicology",
    topic: "Paracetamol poisoning",
    subtopic: "Antidotes",
    difficulty: 1,
    stemEn:
      "A 19-year-old took 40 tablets of paracetamol 500 mg six hours ago. Her paracetamol level is above the treatment line. Which treatment is indicated?",
    stemRu:
      "Девушка 19 лет 6 часов назад приняла 40 таблеток парацетамола по 500 мг. Концентрация парацетамола выше линии лечения. Какое лечение показано?",
    options: [
      ["Naloxone", "Налоксон"],
      ["Flumazenil", "Флумазенил"],
      ["Activated charcoal alone", "Только активированный уголь"],
      ["Acetylcysteine", "Ацетилцистеин"],
    ],
    correct: "D",
    explanationEn:
      "Acetylcysteine replenishes glutathione and prevents liver injury from the toxic paracetamol metabolite (NAPQI). It is most effective within 8 hours but is still given later.",
    explanationRu: null,
    optionExplanations: {
      A: "Naloxone reverses opioids, not paracetamol.",
      B: "Flumazenil reverses benzodiazepines and is rarely used because it can trigger seizures.",
      C: "Activated charcoal helps only within about 1 hour of ingestion and is not an antidote.",
    },
    examPearl:
      "Use a paracetamol level taken at least 4 hours after ingestion; for staggered or uncertain-time overdoses, treat without waiting for the nomogram.",
    tutorHint: "Which drug restores the liver's own detoxifying capacity?",
    keyTerms: [
      { ru: "отравление парацетамолом", en: "paracetamol poisoning" },
      { ru: "антидот", en: "antidote" },
      { ru: "печёночная недостаточность", en: "liver failure" },
    ],
  }),
  q({
    id: "q-em-04",
    specialty: "emergency-medicine",
    subject: "Toxicology",
    topic: "Opioid toxicity",
    subtopic: "Reversal",
    difficulty: 1,
    stemEn:
      "A man is found drowsy with pinpoint pupils and a respiratory rate of 6/min. A used syringe is nearby. After airway support and ventilation, which drug should be given?",
    stemRu:
      "Мужчина обнаружен в оглушении, зрачки точечные, ЧДД 6 в минуту, рядом использованный шприц. Какой препарат следует ввести после обеспечения проходимости дыхательных путей и вентиляции?",
    options: [
      ["Flumazenil", "Флумазенил"],
      ["Atropine", "Атропин"],
      ["Naloxone", "Налоксон"],
      ["Physostigmine", "Физостигмин"],
    ],
    correct: "C",
    explanationEn:
      "Reduced consciousness, pinpoint pupils and respiratory depression are the opioid toxidrome. Naloxone, a competitive opioid antagonist, reverses it, titrated to adequate breathing.",
    explanationRu: null,
    optionExplanations: {
      A: "Flumazenil reverses benzodiazepines, which do not usually cause pinpoint pupils.",
      B: "Atropine treats organophosphate poisoning (small pupils with excessive secretions, sweating and bradycardia), not opioid toxicity.",
      D: "Physostigmine is used for anticholinergic toxicity, which causes dilated pupils.",
    },
    examPearl:
      "Naloxone's effect wears off sooner than many opioids: observe for recurrent sedation and repeat doses or start an infusion if needed.",
    tutorHint: "Name the toxidrome from the pupils and the breathing, then pick its antagonist.",
    keyTerms: [
      { ru: "передозировка опиоидов", en: "opioid overdose" },
      { ru: "миоз", en: "miosis" },
      { ru: "угнетение дыхания", en: "respiratory depression" },
    ],
  }),
];
