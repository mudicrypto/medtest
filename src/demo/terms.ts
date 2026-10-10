// DEMO TERMINOLOGY — prototype only, not yet medically or linguistically reviewed.
import type { Term } from "@/lib/types";

export const terms: Term[] = [
  { id: "t-01", ru: "одышка", translit: "a-DYSH-ka", en: "shortness of breath (dyspnoea)", topic: "pulmonology", exampleRu: "Пациент жалуется на одышку при ходьбе.", exampleEn: "The patient complains of shortness of breath when walking." },
  { id: "t-02", ru: "жалобы", translit: "ZHA-lo-by", en: "complaints (presenting symptoms)", topic: "general", exampleRu: "Какие у вас жалобы?", exampleEn: "What are your complaints? / What brings you in?" },
  { id: "t-03", ru: "анамнез", translit: "a-NAM-nez", en: "medical history", topic: "general", exampleRu: "Анамнез заболевания собран со слов пациента.", exampleEn: "The history of the illness was taken from the patient." },
  { id: "t-04", ru: "головокружение", translit: "go-lo-vo-kru-ZHE-ni-ye", en: "dizziness", topic: "neurology", exampleRu: "Беспокоит головокружение по утрам.", exampleEn: "Dizziness bothers them in the mornings." },
  { id: "t-05", ru: "сердцебиение", translit: "serd-tse-bi-YE-ni-ye", en: "palpitations", topic: "cardiology", exampleRu: "Отмечает приступы сердцебиения.", exampleEn: "Reports episodes of palpitations." },
  { id: "t-06", ru: "давящая боль", translit: "DA-vya-shcha-ya bol'", en: "pressing (crushing) pain", topic: "cardiology", exampleRu: "Давящая боль за грудиной.", exampleEn: "Crushing pain behind the sternum." },
  { id: "t-07", ru: "отёк", translit: "a-TYOK", en: "oedema (swelling)", topic: "cardiology", exampleRu: "Отёки голеней к вечеру.", exampleEn: "Swelling of the lower legs by evening." },
  { id: "t-08", ru: "мокрота", translit: "mak-ra-TA", en: "sputum", topic: "pulmonology", exampleRu: "Кашель с гнойной мокротой.", exampleEn: "Cough with purulent sputum." },
  { id: "t-09", ru: "хрипы", translit: "KHRI-py", en: "crackles / wheezes (adventitious sounds)", topic: "pulmonology", exampleRu: "Влажные хрипы в нижних отделах.", exampleEn: "Crackles in the lung bases." },
  { id: "t-10", ru: "изжога", translit: "iz-ZHO-ga", en: "heartburn", topic: "gastroenterology", exampleRu: "Изжога после еды.", exampleEn: "Heartburn after meals." },
  { id: "t-11", ru: "тошнота", translit: "tash-na-TA", en: "nausea", topic: "gastroenterology", exampleRu: "Тошнота и рвота с утра.", exampleEn: "Nausea and vomiting in the morning." },
  { id: "t-12", ru: "желтуха", translit: "zhel-TU-kha", en: "jaundice", topic: "gastroenterology", exampleRu: "Кожные покровы с желтушным оттенком.", exampleEn: "The skin has a jaundiced tinge." },
  { id: "t-13", ru: "жажда", translit: "ZHAZH-da", en: "thirst", topic: "endocrinology", exampleRu: "Беспокоит сильная жажда.", exampleEn: "Severe thirst is bothering them." },
  { id: "t-14", ru: "лихорадка", translit: "li-kha-RAD-ka", en: "fever", topic: "infectious-diseases", exampleRu: "Лихорадка до 39 °C в течение трёх дней.", exampleEn: "Fever up to 39 °C for three days." },
  { id: "t-15", ru: "сыпь", translit: "syp'", en: "rash", topic: "infectious-diseases", exampleRu: "На коже туловища — пятнистая сыпь.", exampleEn: "A macular rash on the trunk." },
  { id: "t-16", ru: "судороги", translit: "SU-da-ra-gi", en: "seizures / cramps", topic: "neurology", exampleRu: "Генерализованные судороги.", exampleEn: "Generalised seizures." },
  { id: "t-17", ru: "беременность", translit: "BE-re-men-nost'", en: "pregnancy", topic: "obstetrics", exampleRu: "Беременность 36 недель.", exampleEn: "Pregnancy at 36 weeks." },
  { id: "t-18", ru: "схватки", translit: "SKHVAT-ki", en: "contractions (labour)", topic: "obstetrics", exampleRu: "Регулярные схватки каждые 5 минут.", exampleEn: "Regular contractions every 5 minutes." },
  { id: "t-19", ru: "острый живот", translit: "OST-ryy zhi-VOT", en: "acute abdomen", topic: "surgery", exampleRu: "Клиника острого живота.", exampleEn: "Clinical picture of an acute abdomen." },
  { id: "t-20", ru: "назначение", translit: "na-zna-CHE-ni-ye", en: "prescription / medical order", topic: "general", exampleRu: "Выполнить назначения врача.", exampleEn: "Carry out the doctor's orders." },
];
