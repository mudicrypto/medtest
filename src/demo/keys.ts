// DEMO ANSWER KEYS — prototype only.
// In the real app these live in the server-only `question_keys` table and are
// returned by the grading function *after* a student submits an answer.
// See docs/PROPOSAL.md §4.
import type { QuestionKey } from "@/lib/types";

export const keys: QuestionKey[] = [
  {
    questionId: "q-card-01",
    correct: "B",
    explanationEn:
      "Leads II, III and aVF look at the inferior wall of the left ventricle. In most people (right-dominant circulation) the inferior wall is supplied by the right coronary artery, so inferior STEMI usually reflects RCA occlusion. The left circumflex is responsible in a minority of left-dominant patients. LAD occlusion causes anterior changes (V1–V4).",
    tutorHint:
      "Think of the leads as cameras: II, III and aVF all view the inferior wall. Ask which artery usually feeds that wall — in a right-dominant heart, that's the RCA. Also check V4R for right-ventricular involvement before giving nitrates.",
  },
  {
    questionId: "q-card-02",
    correct: "A",
    explanationEn:
      "Regular narrow-complex tachycardia in a stable patient is most often an AV-nodal re-entrant tachycardia. After vagal manoeuvres fail, a rapid IV bolus of adenosine transiently blocks the AV node and usually terminates it. Synchronised cardioversion is reserved for unstable patients; atropine would accelerate the rate.",
    tutorHint:
      "Key words: 'stable', 'regular', 'narrow'. That combination points to a re-entry circuit through the AV node, so the drug that briefly blocks the AV node is the logical next step. Instability would change the answer to electricity.",
  },
  {
    questionId: "q-pulm-01",
    correct: "B",
    explanationEn:
      "Light's criteria classify an effusion as an exudate if ANY of the following is true: pleural/serum protein > 0.5, pleural/serum LDH > 0.6, or pleural LDH > two-thirds of the upper limit of normal for serum LDH. Options A, C and D all fall on the transudate side.",
    tutorHint:
      "Remember the three numbers: 0.5 (protein ratio), 0.6 (LDH ratio), 2/3 (LDH vs upper limit). Only one option crosses a threshold.",
  },
  {
    questionId: "q-pulm-02",
    correct: "C",
    explanationEn:
      "Primary spontaneous pneumothorax typically affects tall, thin young men without lung disease. Air in the pleural space gives absent breath sounds with a hyperresonant percussion note. Effusion and consolidation are dull to percussion.",
    tutorHint:
      "Percussion is the discriminator: dull = fluid or consolidation; hyperresonant = air. Combine that with the classic patient profile.",
  },
  {
    questionId: "q-gi-01",
    correct: "B",
    explanationEn:
      "Courvoisier's law: a palpable, non-tender gallbladder with painless jaundice is unlikely to be due to gallstones and suggests malignant obstruction of the distal common bile duct, classically carcinoma of the pancreatic head. Gallstone disease tends to cause a fibrosed, non-distensible gallbladder and painful episodes.",
    tutorHint:
      "Painless + palpable gallbladder + weight loss is a red-flag triad. Ask yourself why stones rarely produce a distended gallbladder.",
  },
  {
    questionId: "q-gi-02",
    correct: "C",
    explanationEn:
      "Where clarithromycin resistance is low, standard triple therapy (PPI + clarithromycin + amoxicillin) for 14 days is an accepted first-line regimen; bismuth quadruple therapy is the usual alternative. Monotherapy does not eradicate H. pylori. Always follow current national guidelines.",
    tutorHint:
      "Eradication needs acid suppression plus two antibiotics. Single agents fail because of resistance and low gastric drug activity.",
  },
  {
    questionId: "q-endo-01",
    correct: "A",
    explanationEn:
      "Patients in DKA are severely volume-depleted. The first priority is IV isotonic fluid (0.9% NaCl), followed by a fixed-rate IV insulin infusion and careful potassium replacement. Bicarbonate is not routinely recommended; subcutaneous long-acting insulin alone is inadequate in the acute phase.",
    tutorHint:
      "Fluids first, then insulin, and watch potassium closely. Insulin drives potassium into cells, so check K⁺ before and during insulin therapy.",
  },
  {
    questionId: "q-endo-02",
    correct: "B",
    explanationEn:
      "In primary hypothyroidism the thyroid itself fails, so free T4 falls and the pituitary responds by increasing TSH. Low TSH with low T4 suggests secondary (central) hypothyroidism.",
    tutorHint:
      "Follow the feedback loop: if the gland fails, the pituitary 'shouts louder' — TSH rises.",
  },
  {
    questionId: "q-inf-01",
    correct: "A",
    explanationEn:
      "An expanding annular rash with central clearing after a tick bite is erythema migrans, the hallmark of early Lyme borreliosis. Doxycycline is first-line for adults; amoxicillin is an alternative (e.g. in pregnancy). Antivirals, antifungals and metronidazole have no role.",
    tutorHint:
      "Erythema migrans is a clinical diagnosis — serology is often negative this early. Treat the spirochaete.",
  },
  {
    questionId: "q-inf-02",
    correct: "D",
    explanationEn:
      "Plasmodium falciparum causes severe malaria, including cerebral malaria (confusion, coma). It produces high parasitaemia with multiple ring forms per red cell and is the dominant species in sub-Saharan Africa. It is a medical emergency.",
    tutorHint:
      "Confusion + travel to sub-Saharan Africa + many rings = treat as severe falciparum malaria until proven otherwise.",
  },
  {
    questionId: "q-neuro-01",
    correct: "A",
    explanationEn:
      "A sudden 'thunderclap' headache suggests subarachnoid haemorrhage. Non-contrast CT is the first investigation and is most sensitive in the first hours. If CT is negative but suspicion remains, lumbar puncture is performed later (looking for xanthochromia).",
    tutorHint:
      "Imaging comes before LP: CT first, and LP only if CT is negative and the story is convincing.",
  },
  {
    questionId: "q-neuro-02",
    correct: "B",
    explanationEn:
      "Face and arm weakness greater than leg weakness indicates the middle cerebral artery territory. Expressive (Broca's) aphasia means the dominant hemisphere is involved — the left in nearly all right-handed people. Contralateral signs place the lesion in the left MCA.",
    tutorHint:
      "Two steps: (1) which side? opposite to the weakness; (2) which artery? face + arm > leg is MCA, leg > arm is ACA.",
  },
  {
    questionId: "q-obs-01",
    correct: "C",
    explanationEn:
      "Magnesium sulfate is the drug of choice for preventing and treating eclamptic seizures. Monitor reflexes, respiratory rate and urine output for toxicity; calcium gluconate is the antidote.",
    tutorHint:
      "Know the toxicity checks for magnesium: loss of deep tendon reflexes comes before respiratory depression.",
  },
  {
    questionId: "q-obs-02",
    correct: "A",
    explanationEn:
      "Uterine atony accounts for the large majority of primary postpartum haemorrhage. The 'four Ts' — Tone, Trauma, Tissue, Thrombin — structure the differential, with Tone the most common.",
    tutorHint: "Use the four Ts: Tone, Trauma, Tissue, Thrombin — in that order of frequency.",
  },
  {
    questionId: "q-ped-01",
    correct: "B",
    explanationEn:
      "Croup (acute laryngotracheitis), usually caused by parainfluenza virus, presents in children aged roughly 6 months to 3 years with a barking cough, hoarseness and inspiratory stridor, often worse at night. Epiglottitis presents with high fever, drooling and a toxic appearance, usually without a barking cough.",
    tutorHint: "The 'bark' is the clue. A drooling, toxic child sitting forward should make you think epiglottitis instead.",
  },
  {
    questionId: "q-ped-02",
    correct: "A",
    explanationEn:
      "Respiratory syncytial virus is the most common cause of bronchiolitis in infants, with seasonal epidemics. Management is mainly supportive (oxygen, feeding support).",
    tutorHint: "Bronchiolitis in an infant during winter epidemics: think RSV first.",
  },
  {
    questionId: "q-surg-01",
    correct: "C",
    explanationEn:
      "Rovsing's sign is pain in the right iliac fossa when the left iliac fossa is pressed, and is associated with appendicitis. Murphy's sign relates to cholecystitis, Courvoisier's sign to a distended gallbladder in malignant obstruction, and Kehr's sign is referred left shoulder pain (e.g. splenic rupture).",
    tutorHint:
      "Eponymous signs are high-yield for terminology: learn each one with its Russian name and the organ it points to.",
  },
  {
    questionId: "q-surg-02",
    correct: "A",
    explanationEn:
      "Murphy's sign — inspiratory arrest during palpation under the right costal margin — suggests acute cholecystitis. Fever and RUQ pain support the diagnosis; ultrasound is the first-line imaging.",
    tutorHint: "Inspiratory arrest = the inflamed gallbladder moves down onto the examining hand.",
  },
];

export const keyByQuestionId = Object.fromEntries(keys.map((k) => [k.questionId, k])) as Record<
  string,
  QuestionKey
>;
