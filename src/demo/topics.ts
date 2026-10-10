import type { Topic } from "@/lib/types";

export const topics: Topic[] = [
  { slug: "cardiology", nameEn: "Cardiology", nameRu: "Кардиология" },
  { slug: "pulmonology", nameEn: "Pulmonology", nameRu: "Пульмонология" },
  { slug: "gastroenterology", nameEn: "Gastroenterology", nameRu: "Гастроэнтерология" },
  { slug: "endocrinology", nameEn: "Endocrinology", nameRu: "Эндокринология" },
  { slug: "infectious-diseases", nameEn: "Infectious diseases", nameRu: "Инфекционные болезни" },
  { slug: "neurology", nameEn: "Neurology", nameRu: "Неврология" },
  { slug: "obstetrics", nameEn: "Obstetrics & gynaecology", nameRu: "Акушерство и гинекология" },
  { slug: "pediatrics", nameEn: "Pediatrics", nameRu: "Педиатрия" },
  { slug: "surgery", nameEn: "Surgery", nameRu: "Хирургия" },
];

export const topicBySlug = Object.fromEntries(topics.map((t) => [t.slug, t])) as Record<
  string,
  Topic
>;
