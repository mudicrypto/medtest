import { requireStaff } from "@/lib/auth";
import { toCsv } from "@/lib/content/csv";

// Downloadable spreadsheet template with one example row.
export async function GET() {
  await requireStaff();
  const csv = toCsv([
    {
      slug: "card-0001",
      topic: "cardiology",
      difficulty: "2",
      stem_en: "A 58-year-old man has ST elevation in leads II, III and aVF. Occlusion of which artery is most likely?",
      stem_ru: "У мужчины 58 лет подъём сегмента ST в отведениях II, III, aVF. Окклюзия какой артерии наиболее вероятна?",
      option_a_en: "Left anterior descending artery",
      option_a_ru: "Передняя межжелудочковая ветвь",
      option_b_en: "Right coronary artery",
      option_b_ru: "Правая коронарная артерия",
      option_c_en: "Left circumflex artery",
      option_c_ru: "Огибающая ветвь",
      option_d_en: "Left main coronary artery",
      option_d_ru: "Ствол левой коронарной артерии",
      correct: "B",
      explanation_en: "Inferior leads reflect the inferior wall, usually supplied by the right coronary artery.",
      explanation_ru: "",
      tutor_hint: "Think of which wall each lead group looks at.",
      key_terms: "подъём сегмента ST = ST-segment elevation; нижняя стенка = inferior wall",
      origin: "original_practice",
      rights_status: "owned",
      review_status: "in_review",
      source_ref: "",
      review_note: "",
    },
  ]);
  // A byte-order mark makes Excel open the file as UTF-8 so Cyrillic displays correctly.
  return new Response("﻿" + csv + "\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="medprep-questions-template.csv"',
      "Cache-Control": "no-store",
    },
  });
}
