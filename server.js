import { installSimulatorLogin } from "./simulator-auth.js";
import express from "express";
import path from "path";
import OpenAI from "openai";
import { fileURLToPath } from "url";

/* =========================================================
   BASIC SERVER SETUP
========================================================= */

const app = express();
const PORT = Number(process.env.PORT) || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!process.env.OPENAI_API_KEY) {
  console.warn(
    "WARNING: OPENAI_API_KEY is missing. AI responses will not work."
  );
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

installSimulatorLogin(app);

app.use(
  express.static(
    path.join(__dirname, "public")
  )
);

/* =========================================================
   SCENARIO INFORMATION
========================================================= */

const scenarios = {
  chestPain: {
    title: "Chest Pain",

    initialInfo:
      "You are dispatched to a home for a 65-year-old male experiencing chest pain.",

    patientPrompt: `
You are acting as a 58-year-old male patient experiencing chest pain.

IMPORTANT RULES:

- Answer only the specific question the EMT asks.
- Do not volunteer your complete history.
- Do not give assessment findings that require equipment.
- Keep answers short and realistic.
- Never act as the instructor.
- Never explain EMT treatment.
- Never tell the student what they should do.

PATIENT INFORMATION:

Chief complaint:
Heavy pressure in the center of the chest.

Onset:
Started approximately 20 minutes ago while carrying groceries.

Provocation and palliation:
Worse while walking or exerting yourself.
Slightly better while sitting still.

Quality:
Heavy pressure, like someone is sitting on your chest.

Radiation:
Travels down the left arm and into the jaw.

Severity:
8 out of 10.

Time:
Constant since it started.

Associated symptoms:
Shortness of breath, nausea, sweating and weakness.

Allergies:
Penicillin.

Medications:
Lisinopril and atorvastatin.

Past medical history:
Hypertension and high cholesterol.

Last oral intake:
Breakfast at approximately 7:00 AM.

Events:
You were carrying groceries into the house.

Additional information:
No previous heart attacks.
No cardiac surgery.
No aspirin taken today.
You do not have prescribed nitroglycerin.
`,

    instructorPrompt: `
You are an EMT instructor operating a chest-pain patient simulation.

IMPORTANT RULES:

- Give assessment findings only when the student appropriately asks.
- Answer briefly and directly.
- Do not coach unless the student specifically asks for instruction.
- Do not invent findings.
- If information is unavailable, say it is not available.
- Statements such as "I have my BSI on" are student actions.
  Briefly acknowledge them without providing unrelated findings.

ASSESSMENT FINDINGS:

General impression:
An anxious adult male sitting upright.
He appears pale and diaphoretic.

Mental status:
Alert and oriented to person, place, time and event.

Airway:
Patent.

Breathing:
Mildly labored.
He speaks in full sentences.

Respiratory rate:
22 breaths per minute.
Regular rhythm and adequate depth.

Lung sounds:
Clear and equal bilaterally.

Pulse:
104 beats per minute.
Regular and strong at the radial artery.

Skin:
Pale, cool and diaphoretic.

Blood pressure:
168/96 mmHg.

Oxygen saturation:
94 percent on room air.

Blood glucose:
118 mg/dL.

Pupils:
Equal and reactive.

Cardiac monitor:
Sinus tachycardia.

12-lead ECG:
Findings concerning for an inferior STEMI.

Trauma:
No signs of trauma.
`
  },

  diabetic: {
    title: "Diabetic Emergency",

    initialInfo:
      "You are dispatched to a residence for a 45-year-old male with altered mental status.",

    patientPrompt: `
You are acting as a 45-year-old male diabetic patient with altered mental status.

IMPORTANT RULES:

- Answer only the specific question asked.
- Do not volunteer the entire history.
- Keep answers short and realistic.
- You are confused and may be unsure of some answers.
- Never act as the instructor.
- Never explain EMT treatment.

PATIENT INFORMATION:

Chief complaint:
Weakness, shakiness and confusion.

Symptoms:
You feel sweaty, weak, shaky and confused.

Medical history:
Diabetes.

Medication:
Insulin.

Last oral intake:
You have not eaten today.

Events:
You took your normal insulin dose but skipped breakfast.

Allergies:
No known drug allergies.
`,

    instructorPrompt: `
You are an EMT instructor operating a diabetic-emergency simulation.

IMPORTANT RULES:

- Give assessment findings only when appropriately requested.
- Answer briefly and directly.
- Do not coach unless specifically asked.
- Do not invent findings.
- If information is unavailable, say it is not available.

ASSESSMENT FINDINGS:

General impression:
A confused, pale and diaphoretic 45-year-old male.

Mental status:
Responds to verbal stimuli.
Confused about time and events.

Airway:
Patent.

Breathing:
Adequate.

Respiratory rate:
18 breaths per minute.
Normal depth and regular rhythm.

Lung sounds:
Clear and equal bilaterally.

Pulse:
110 beats per minute.
Regular.

Skin:
Pale, cool and diaphoretic.

Blood pressure:
138/82 mmHg.

Oxygen saturation:
97 percent on room air.

Blood glucose:
42 mg/dL.

Pupils:
Equal and reactive.
`
  },

  sob: {
    title: "Shortness of Breath",

    initialInfo:
      "You are dispatched to a residence for difficulty breathing.",

    patientPrompt: `
You are acting as a 67-year-old female experiencing shortness of breath.

IMPORTANT RULES:

- Answer only the specific question asked.
- Speak in short phrases.
- Do not volunteer the full history.
- Never explain treatment.

PATIENT INFORMATION:

Medical history:
COPD.

Position:
Sitting upright and leaning forward.

Symptoms:
Severe shortness of breath.
Wheezing.
Productive cough.

Inhaler:
Used twice with little relief.

Chest pain:
Denied.

Allergies:
Sulfa.

Medications:
Albuterol and tiotropium.
`,

    instructorPrompt: `
You are an EMT instructor operating a shortness-of-breath simulation.

Give assessment findings only when requested.
Do not invent findings.

ASSESSMENT FINDINGS:

General impression:
Older female sitting upright and leaning forward.
Speaking in short phrases.

Mental status:
Alert and oriented.

Airway:
Patent.

Breathing:
Labored.

Respiratory rate:
28 breaths per minute.

Lung sounds:
Bilateral wheezing.

Pulse:
112 beats per minute.

Blood pressure:
150/88 mmHg.

Oxygen saturation:
88 percent on room air.
`
  },

  stroke: {
    title: "Stroke",

    initialInfo:
      "You are dispatched to a home for possible stroke symptoms.",

    patientPrompt: `
You are acting as a 72-year-old male experiencing a stroke.

IMPORTANT RULES:

- Answer only the specific question asked.
- Speak slowly with slurred speech.
- Do not volunteer the entire history.
- Never explain treatment.

PATIENT INFORMATION:

Symptoms:
Right-sided weakness.
Slurred speech.
Confusion.

Onset:
Approximately 20 minutes ago.

Pain:
No pain.
`,

    instructorPrompt: `
You are an EMT instructor operating a stroke simulation.

Give assessment findings only when requested.
Do not invent findings.

ASSESSMENT FINDINGS:

General impression:
Older male with facial droop and slurred speech.

Mental status:
Alert but confused.

Airway:
Patent.

Breathing:
Adequate.

Facial droop:
Present on the right.

Arm drift:
Present in the right arm.

Speech:
Slurred.

Pulse:
88 beats per minute.

Blood pressure:
190/104 mmHg.

Respiratory rate:
18 breaths per minute.

Oxygen saturation:
96 percent on room air.

Blood glucose:
132 mg/dL.
`
  }
};

/* =========================================================
   SCENARIO HELPERS
========================================================= */

function normalizeScenarioName(value = "") {
  const scenarioName = String(value).trim();

  const aliases = {
    chestpain: "chestPain",
    chestPain: "chestPain",
    "chest-pain": "chestPain",

    diabetic: "diabetic",
    diabetes: "diabetic",

    sob: "sob",
    shortnessofbreath: "sob",
    "shortness-of-breath": "sob",

    stroke: "stroke"
  };

  return (
    aliases[scenarioName] ||
    aliases[scenarioName.toLowerCase()] ||
    "chestPain"
  );
}

function getScenario(value) {
  const name = normalizeScenarioName(value);

  return scenarios[name];
}

function normalizeText(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function includesAny(text, phrases) {
  const normalizedText = normalizeText(text);

  return phrases.some(phrase => {
    const normalizedPhrase =
      normalizeText(phrase);

    return normalizedText.includes(
      normalizedPhrase
    );
  });
}

function combineStudentWork(body = {}) {
  const assessmentLog =
    Array.isArray(body.assessmentLog)
      ? body.assessmentLog.join("\n")
      : "";

  const completedSkills =
    Array.isArray(body.completedSkills)
      ? body.completedSkills.join("\n")
      : "";

  return [
    body.studentAnswer,
    body.patientHistory,
    body.instructorHistory,
    body.treatmentPlan,
    assessmentLog,
    completedSkills
  ]
    .filter(Boolean)
    .join("\n");
}

/* =========================================================
   OPENAI HELPER
========================================================= */

async function createChatReply(
  systemPrompt,
  userPrompt
) {
  const completion =
    await openai.chat.completions.create({
      model:
        process.env.CHAT_MODEL ||
        "gpt-4.1-mini",

      temperature: 0.2,

      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ]
    });

  return (
    completion.choices?.[0]?.message?.content?.trim() ||
    "No response was generated."
  );
}

/* =========================================================
   OPQRST SCORING
========================================================= */

function evaluateOpqrst(text = "") {
  const work = String(text)
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[-–—]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const has = (...patterns) =>
    patterns.some(pattern => pattern.test(work));

  // ONSET: When the symptom began.
  const onset = has(
    /\bopqrst onset assessed\b/,
    /\bonset assessed\b/,
    /\bwhen did (?:the |your )?(?:chest pain|pain|symptoms?|discomfort|this|it) (?:start|begin)\b/,
    /\bwhen (?:did|was) (?:this|it) first (?:noticed|noticeable|start|begin)\b/,
    /\bsudden or gradual\b/,
    /\bwhat were you doing when .{0,60}(?:started|began)\b/,
    /\bwhat were you doing at (?:the )?onset\b/
  );

  // PROVOCATION: What worsens the symptom.
  const worse = has(
    /\b(?:opqrst )?provocation assessed\b/,
    /\bwhat makes .{0,45}(?:worse|increase)\b/,
    /\b(?:anything|does anything) make .{0,45}worse\b/,
    /\bwhat (?:worsens|aggravates|triggers) .{0,45}(?:pain|symptom|discomfort)\b/,
    /\bdoes .{0,45}(?:make|makes) .{0,35}worse\b/
  );

  // PALLIATION: What improves the symptom.
  const better = has(
    /\b(?:opqrst )?palliation assessed\b/,
    /\bwhat makes .{0,45}better\b/,
    /\b(?:anything|does anything) make .{0,45}better\b/,
    /\bwhat (?:relieves|helps|eases) .{0,45}(?:pain|symptom|discomfort)\b/,
    /\bdoes .{0,45}(?:help|relieve|ease) .{0,35}(?:pain|symptom|discomfort)\b/
  );

  const bothProvocationAndPalliation = has(
    /\b(?:opqrst )?provocation and palliation assessed\b/,
    /\bwhat makes .{0,45}(?:better or worse|worse or better|better and worse|worse and better)\b/
  );

  // QUALITY: What the symptom feels like.
  const quality = has(
    /\b(?:opqrst )?quality assessed\b/,
    /\bdescribe (?:the |your )?(?:chest pain|pain|discomfort|symptoms?)\b/,
    /\bwhat does .{0,35}(?:pain|discomfort) feel like\b/,
    /\bhow would you describe .{0,35}(?:pain|discomfort)\b/,
    /\bis .{0,30}(?:sharp|dull|burning|pressure|aching|crushing)\b/
  );

  // REGION: Where the symptom is located.
  const region = has(
    /\b(?:opqrst )?(?:region|location) assessed\b/,
    /\bwhere (?:is|does) .{0,35}(?:pain|hurt|discomfort)\b/,
    /\bwhere are you (?:having|feeling) .{0,35}(?:pain|discomfort)\b/,
    /\b(?:show|point to|tell me) where .{0,35}(?:hurts|pain|discomfort)\b/
  );

  // RADIATION: Whether the symptom spreads elsewhere.
  const spreads = has(
    /\b(?:opqrst )?radiation assessed\b/,
    /\bdoes .{0,35}(?:pain|discomfort) (?:radiate|travel|spread|move)\b/,
    /\bwhere does .{0,35}(?:pain|discomfort) go\b/,
    /\b(?:pain|discomfort) anywhere else\b/
  );

  const regionAndRadiation = has(
    /\b(?:opqrst )?region and radiation assessed\b/,
    /\b(?:opqrst )?location and radiation assessed\b/
  );

  // SEVERITY: A rating or assessment of intensity.
  const severity = has(
    /\b(?:opqrst )?severity assessed\b/,
    /\brate (?:the |your )?(?:chest pain|pain|discomfort|symptoms?)\b/,
    /\bhow (?:bad|severe|intense) is .{0,35}(?:pain|discomfort)\b/,
    /\b(?:pain|severity) (?:scale|rating)\b/,
    /\b(?:scale of |from |between )?(?:0|zero) to (?:10|ten)\b/,
    /\b(?:scale of |from |between )(?:1|one) to (?:10|ten)\b/
  );

  // TIME: Duration and symptom pattern.
  const duration = has(
    /\b(?:opqrst )?duration assessed\b/,
    /\bhow long (?:has|have) .{0,45}(?:lasted|been going on|been present|had|having)\b/,
    /\bhow long (?:does|did) .{0,35}(?:last|episode)\b/,
    /\bhow long have you had .{0,35}(?:pain|symptoms?|discomfort)\b/
  );

  const pattern = has(
    /\b(?:opqrst )?(?:time pattern|timing|symptom pattern) assessed\b/,
    /\b(?:has|is) .{0,35}(?:pain|discomfort|symptom).{0,25}(?:constant|continuous|intermittent)\b/,
    /\bdoes .{0,35}(?:pain|discomfort|it) come and go\b/,
    /\b(?:pain|symptom|discomfort).{0,35}(?:getting better|getting worse|changed over time)\b/,
    /\b(?:constant or intermittent|constant or comes and goes)\b/
  );

  const durationAndPattern = has(
    /\b(?:opqrst )?duration and (?:pattern|timing) assessed\b/,
    /\b(?:opqrst )?time assessed\b/
  );

  // Preserve the component names used by the existing server.
  const components = {
    onset,
    provocation: bothProvocationAndPalliation || (worse && better),
    quality,
    radiation: regionAndRadiation || (region && spreads),
    severity,
    time: durationAndPattern || (duration && pattern)
  };

  const labels = {
    onset: "Onset",
    provocation: "Provocation / Palliation",
    quality: "Quality",
    radiation: "Region / Radiation",
    severity: "Severity",
    time: "Duration / Pattern"
  };

  const completedCount =
    Object.values(components).filter(Boolean).length;

  return {
    complete: completedCount === 6,
    completedCount,
    components,
    missingComponents: Object.keys(components)
      .filter(key => !components[key])
      .map(key => labels[key])
  };
}
/* =========================================================
   SAMPLE SCORING
========================================================= */

function evaluateSample(text) {
  const completeRequest = includesAny(
    text,
    [
      "complete sample history",
      "sample history obtained",
      "perform sample history",
      "obtain a sample history"
    ]
  );

  const components = {
    signsSymptoms: includesAny(text, [
      "signs and symptoms assessed",
      "chief complaint identified",
      "what symptoms",
      "what is bothering you"
    ]),

    allergies: includesAny(text, [
      "allergies assessed",
      "any allergies",
      "allergic to anything"
    ]),

    medications: includesAny(text, [
      "medications assessed",
      "what medications",
      "what medicines"
    ]),

    pastHistory: includesAny(text, [
      "pertinent medical history assessed",
      "medical history",
      "past medical history"
    ]),

    lastOralIntake: includesAny(text, [
      "last oral intake assessed",
      "last oral intake",
      "when did you last eat",
      "last meal"
    ]),

    events: includesAny(text, [
      "events leading to illness assessed",
      "events leading",
      "what happened before",
      "what were you doing"
    ])
  };

  const completedCount =
    Object.values(components)
      .filter(Boolean)
      .length;

  return {
    complete:
      completeRequest ||
      completedCount === 6,

    completedCount,
    components
  };
}

/* =========================================================
   CTOEMS-STYLE CHECKLIST
========================================================= */

function buildChecklist(body = {}) {
  const text = combineStudentWork(body);
  const opqrst = evaluateOpqrst(text);
  const sample = evaluateSample(text);

  return [
    {
      id: "bsi",
      name: "BSI precautions",
      points: 1,
      pass: includesAny(text, [
        "bsi precautions",
        "bsi",
        "body substance isolation",
        "put on gloves",
        "wear gloves",
        "use ppe"
      ])
    },

    {
      id: "sceneSafety",
      name: "Scene safety",
      points: 1,
      pass: includesAny(text, [
        "scene safety assessed",
        "scene safety",
        "scene is safe",
        "is the scene safe"
      ])
    },

    {
      id: "natureOfIllness",
      name: "Determines mechanism of injury / nature of illness",
      points: 1,
      pass: includesAny(text, [
        "mechanism of injury assessed",
        "mechanism of injury determined",
        "determine the mechanism of injury",
        "assess the mechanism of injury",
        "what happened",
        "how did the injury happen",
        "how were you injured",
        "nature of illness assessed",
        "nature of illness determined",
        "determine the nature of illness",
        "assess the nature of illness",
        "reason for the call",
        "why were we called"
      ])
    },

    {
      id: "generalImpression",
      name: "General impression",
      points: 1,
      pass: includesAny(text, [
        "general impression formed",
        "general impression",
        "initial impression"
      ])
    },

    {
      id: "mentalStatus",
      name: "Mental status",
      points: 2,
      pass: includesAny(text, [
        "mental status assessed",
        "mental status",
        "level of consciousness",
        "avpu",
        "gcs",
        "alert and oriented"
      ])
    },

    {
      id: "airway",
      name: "Airway assessment",
      points: 2,
      pass: includesAny(text, [
        "airway assessed",
        "assess the airway",
        "check the airway",
        "airway is patent",
        "airway patent"
      ])
    },

    {
      id: "breathing",
      name: "Breathing assessment",
      points: 2,
      pass: includesAny(text, [
        "breathing assessed",
        "assess breathing",
        "respiratory effort",
        "work of breathing",
        "rate depth and quality"
      ])
    },

    {
      id: "lungSounds",
      name: "Lung sounds",
      points: 1,
      pass: includesAny(text, [
        "lung sounds assessed",
        "lung sounds",
        "breath sounds",
        "auscultate the lungs"
      ])
    },

    {
      id: "circulation",
      name: "Circulation assessment",
      points: 2,
      pass: includesAny(text, [
        "circulation assessed",
        "assess circulation",
        "perfusion status",
        "pulse assessed",
        "skin signs assessed"
      ])
    },

    {
      id: "bleeding",
      name: "Major bleeding assessment",
      points: 1,
      pass: includesAny(text, [
        "major bleeding assessed",
        "check for major bleeding",
        "check for severe bleeding",
        "assess for hemorrhage"
      ])
    },

    {
      id: "priority",
      name: "Patient priority identified",
      points: 2,
      pass: includesAny(text, [
        "patient priority",
        "high priority patient",
        "immediate transport",
        "rapid transport",
        "load and go"
      ])
    },

    {
      id: "chiefComplaint",
      name: "Determines chief complaint / apparent life threats",
      points: 1,

      // Both chief complaint and life-threat assessment are required.
      pass:
        includesAny(text, [
          "chief complaint identified",
          "chief complaint determined",
          "identify the chief complaint",
          "determine the chief complaint",
          "what is bothering you",
          "what is wrong today",
          "what is your main problem",
          "why did you call 911"
        ]) &&
        includesAny(text, [
          "apparent life threats assessed",
          "apparent life threats identified",
          "life threats assessed",
          "life threats identified",
          "assess for life threats",
          "check for life threats",
          "assess for apparent life threats",
          "check for apparent life threats",
          "no apparent life threats",
          "no immediate life threats",
          "no life threats found",
          "life threatening conditions assessed",
          "check for life threatening conditions"
        ])
    },

    {
      id: "fieldImpression",
      name: "States field impression",
      points: 1,

      // Requires text after the introductory phrase.
      // This checks documentation, not diagnostic accuracy.
      pass: /\b(?:my field impression is|field impression is|field impression:|my clinical impression is|clinical impression is|clinical impression:|my working diagnosis is|working diagnosis is|working diagnosis:|i suspect|suspected condition is)\s+[a-z0-9]/i.test(text)
    },

    {
  id: "opqrstOnset",
  name: "OPQRST — Onset",
  points: 1,
  pass: opqrst.components.onset
},
{
  id: "opqrstProvocation",
  name: "OPQRST — Provocation / Palliation",
  points: 1,
  pass: opqrst.components.provocation
},
{
  id: "opqrstQuality",
  name: "OPQRST — Quality",
  points: 1,
  pass: opqrst.components.quality
},
{
  id: "opqrstRadiation",
  name: "OPQRST — Region / Radiation",
  points: 1,
  pass: opqrst.components.radiation
},
{
  id: "opqrstSeverity",
  name: "OPQRST — Severity",
  points: 1,
  pass: opqrst.components.severity
},
{
  id: "opqrstTime",
  name: "OPQRST — Duration / Pattern",
  points: 1,
  pass: opqrst.components.time
},

    {
      id: "sample",
      name: "Complete SAMPLE history",
      points: 6,
      pass: sample.complete
    },

    {
      id: "bloodPressure",
      name: "Blood pressure",
      points: 1,
      pass: includesAny(text, [
        "blood pressure obtained",
        "check blood pressure",
        "obtain blood pressure",
        "what is the blood pressure",
        "what is the bp"
      ])
    },

    {
      id: "pulse",
      name: "Pulse",
      points: 1,
      pass: includesAny(text, [
        "pulse assessed",
        "check the pulse",
        "heart rate",
        "radial pulse"
      ])
    },

    {
      id: "respiratoryRate",
      name: "Respiratory rate",
      points: 1,
      pass: includesAny(text, [
        "respiratory rate obtained",
        "respiratory rate",
        "respiration rate",
        "rate depth and quality"
      ])
    },

    {
      id: "spo2",
      name: "Oxygen saturation",
      points: 1,
      pass: includesAny(text, [
        "oxygen saturation obtained",
        "oxygen saturation",
        "spo2",
        "pulse oximetry",
        "pulse ox"
      ])
    },

    {
      id: "secondaryAssessment",
      name: "Secondary assessment",
      points: 3,
      pass: includesAny(text, [
        "secondary assessment performed",
        "secondary assessment",
        "focused physical exam",
        "head to toe assessment"
      ])
    },

    {
      id: "treatment",
      name: "Appropriate treatment",
      points: 3,
      pass: includesAny(text, [
        "aspirin administered or considered",
        "administer aspirin",
        "give aspirin",
        "nitroglycerin assisted or considered",
        "assist with nitroglycerin",
        "oral glucose",
        "administer glucose",
        "oxygen administered when indicated",
        "cardiac rhythm assessed",
        "obtain a 12 lead"
      ])
    },

    {
      id: "transport",
      name: "Transport decision",
      points: 2,
      pass: includesAny(text, [
        "patient priority and transport decision made",
        "rapid transport initiated",
        "immediate transport",
        "rapid transport",
        "begin transport",
        "transport to the hospital",
        "transport to a cardiac center"
      ])
    },

    {
      id: "reassessment",
      name: "Reassessment",
      points: 2,
      pass: includesAny(text, [
        "reassessment performed",
        "reassess the patient",
        "repeat all vital signs",
        "repeat blood pressure",
        "recheck the patient"
      ])
    },

    {
      id: "report",
      name: "Verbal handoff report",
      points: 1,
      pass: includesAny(text, [
        "accurate verbal report provided",
        "verbal report",
        "radio report",
        "handoff report",
        "report to medical control",
        "report to the emergency department"
      ])
    }
  ];
}
/* =========================================================
   CRITICAL-FAIL REVIEW
========================================================= */

function evaluateCriticalCriteria(
  body,
  checklist
) {
  const text = combineStudentWork(body);
  const elapsedSeconds =
    Number(body.elapsedSeconds) || 0;

  const passed = id =>
    checklist.find(item => item.id === id)
      ?.pass === true;

  const dangerousAction =
    includesAny(text, [
      "give nitroglycerin despite hypotension",
      "give nitroglycerin with low blood pressure",
      "force the patient to walk",
      "delay transport until pain stops",
      "give oral medication to an unresponsive patient",
      "give medication the patient is allergic to",
      "withhold ventilation from an apneic patient"
    ]);

  return [
    {
      id: "F1",
      description:
        "Failure to initiate or call for transport within 15 minutes.",

      status:
        elapsedSeconds >= 900 &&
        !passed("transport")
          ? "FAIL"
          : "PASS",

      reason:
        elapsedSeconds >= 900 &&
        !passed("transport")
          ? "Fifteen minutes elapsed without a documented transport decision."
          : "No transport-time failure detected."
    },

    {
      id: "F2",
      description:
        "Failure to take or verbalize appropriate PPE precautions.",

      status:
        passed("bsi")
          ? "PASS"
          : "FAIL",

      reason:
        passed("bsi")
          ? "PPE/BSI was documented."
          : "PPE/BSI was not documented."
    },

    {
      id: "F3",
      description:
        "Failure to determine scene safety.",

      status:
        passed("sceneSafety")
          ? "PASS"
          : "FAIL",

      reason:
        passed("sceneSafety")
          ? "Scene safety was documented."
          : "Scene safety was not documented."
    },

    {
      id: "F4",
      description:
        "Failure to provide oxygen therapy according to patient condition and current guidance.",

      status: "REVIEW",

      reason:
        "Oxygen use requires clinical review based on oxygenation and respiratory status."
    },

    {
      id: "F5",
      description:
        "Failure to identify or manage airway, breathing, hemorrhage or shock problems.",

      status:
        passed("airway") &&
        passed("breathing") &&
        passed("circulation")
          ? "REVIEW"
          : "FAIL",

      reason:
        passed("airway") &&
        passed("breathing") &&
        passed("circulation")
          ? "Primary assessment was documented. Management of abnormal findings requires review."
          : "One or more primary assessment areas were not documented."
    },

    {
      id: "F6",
      description:
        "Failure to determine immediate transport versus continued scene assessment.",

      status:
        passed("priority") ||
        passed("transport")
          ? "PASS"
          : "FAIL",

      reason:
        passed("priority") ||
        passed("transport")
          ? "A priority or transport decision was documented."
          : "No patient-priority or transport decision was documented."
    },

    {
      id: "F7",
      description:
        "Failure to manage life threats before secondary care.",

      status: "REVIEW",

      reason:
        "Treatment sequence requires instructor review."
    },

    {
      id: "F8",
      description:
        "Orders a dangerous or inappropriate intervention.",

      status:
        dangerousAction
          ? "FAIL"
          : "REVIEW",

      reason:
        dangerousAction
          ? "A predefined dangerous action was detected."
          : "No predefined dangerous action was detected. Final instructor review is required."
    },

    {
      id: "F9",
      description:
        "Failure to provide an accurate report to EMS, medical direction or receiving staff.",

      status:
        passed("report")
          ? "PASS"
          : "FAIL",

      reason:
        passed("report")
          ? "A report was documented."
          : "No verbal or handoff report was documented."
    },

    {
      id: "F10",
      description:
        "Failure to manage the patient as a competent EMT.",

      status: "REVIEW",

      reason:
        "Overall competence requires instructor judgment."
    },

    {
      id: "F11",
      description:
        "Exhibits unacceptable affect or unprofessional behavior.",

      status: "REVIEW",

      reason:
        "Professional behavior requires instructor judgment."
    },

    {
      id: "F12",
      description:
        "Failure to obtain the minimum passing score.",

      status: "REVIEW",

      reason:
        "The score is calculated below."
    }
  ];
}

/* =========================================================
   BASIC ROUTES
========================================================= */

app.get("/health", (req, res) => {
  return res.json({
    status: "ok",

    openaiKeyPresent:
      Boolean(
        process.env.OPENAI_API_KEY
      ),

    model:
      process.env.CHAT_MODEL ||
      "gpt-4.1-mini",

    time:
      new Date().toISOString()
  });
});

app.get("/", (req, res) => {
  return res.redirect(
    "/index.html"
  );
});

app.get(
  "/scenario-data/:scenario",
  (req, res) => {
    const selectedScenario =
      getScenario(
        req.params.scenario
      );

    return res.json({
      title:
        selectedScenario.title,

      initialInfo:
        selectedScenario.initialInfo
    });
  }
);

/* =========================================================
   ASK PATIENT
========================================================= */

app.post("/ask", async (req, res) => {
  try {
    const {
      studentQuestion = "",
      history = "",
      scenario = "chestPain"
    } = req.body || {};

    if (!studentQuestion.trim()) {
      return res.status(400).json({
        reply:
          "No patient question was provided."
      });
    }

    const selectedScenario =
      getScenario(scenario);

    const reply =
      await createChatReply(
        selectedScenario.patientPrompt,

        `
Conversation so far:

${history}

The EMT asks the patient:

${studentQuestion}

Answer only the current question as the patient.
        `
      );

    return res.json({
      reply
    });
  } catch (error) {
    console.error(
      "ASK PATIENT ERROR:",
      error
    );

    return res.status(500).json({
      reply:
        "Server error contacting the AI patient. Check the Render logs and OPENAI_API_KEY."
    });
  }
});

/* =========================================================
   ASK INSTRUCTOR
========================================================= */

app.post(
  "/instructor",
  async (req, res) => {
    try {
      const {
        studentQuestion = "",
        history = "",
        scenario = "chestPain"
      } = req.body || {};

      if (!studentQuestion.trim()) {
        return res.status(400).json({
          reply:
            "No instructor question was provided."
        });
      }

      const selectedScenario =
        getScenario(scenario);

      const reply =
        await createChatReply(
          selectedScenario.instructorPrompt,

          `
Scenario:

${selectedScenario.title}

Patient conversation:

${history}

Student question or action:

${studentQuestion}

Respond as the EMT instructor.

If the student requested an assessment finding, provide only that finding.

If the student stated an action such as BSI, scene safety, assessment or treatment, briefly acknowledge the action.

Do not provide unrelated findings.
          `
        );

      return res.json({
        reply
      });
    } catch (error) {
      console.error(
        "INSTRUCTOR ERROR:",
        error
      );

      return res.status(500).json({
        reply:
          "Instructor server error. Check the Render logs and OPENAI_API_KEY."
      });
    }
  }
);

/* =========================================================
   GRADING
========================================================= */

app.post("/grade", async (req, res) => {
  try {
    const body = req.body || {};

    const selectedScenario =
      getScenario(
        body.scenario
      );

    const checklist =
      buildChecklist(body);

    const earnedPoints =
      checklist.reduce(
        (total, item) =>
          total +
          (
            item.pass
              ? item.points
              : 0
          ),
        0
      );

    const possiblePoints =
      checklist.reduce(
        (total, item) =>
          total + item.points,
        0
      );

    const criticalCriteria =
      evaluateCriticalCriteria(
        body,
        checklist
      );

    const scoreCriterion =
      criticalCriteria.find(
        item => item.id === "F12"
      );

    if (scoreCriterion) {
      scoreCriterion.status =
        earnedPoints >= 33
          ? "PASS"
          : "FAIL";

      scoreCriterion.reason =
        `Score: ${earnedPoints}/${possiblePoints}. Minimum passing score: 33.`;
    }

    const automaticFails =
      criticalCriteria.filter(
        item => item.status === "FAIL"
      );

    const checklistText =
      checklist
        .map(item => {
          const symbol =
            item.pass
              ? "[✓]"
              : "[ ]";

          return (
            `${symbol} ${item.name} ` +
            `(${item.pass ? item.points : 0}/${item.points})`
          );
        })
        .join("\n");

    const criticalText =
      criticalCriteria
        .map(item => {
          return (
            `${item.id} — ${item.status}\n` +
            `${item.description}\n` +
            `${item.reason}`
          );
        })
        .join("\n\n");

   const gradingPrompt = `
You are grading a Connecticut EMT medical-assessment practice simulation.

GRADING RULES:

- This is a practice simulation, not an official state examination.
- The deterministic checklist is authoritative for item credit and points.
- Do not change checklist results, add deductions, or invent points.
- Evaluate the student's entire submitted session.
- Credit recognized assessments whether documented early or later.
- OPQRST and SAMPLE questions may be asked separately throughout the session.
- Do not require OPQRST or SAMPLE to be completed in one uninterrupted exchange.
- Do not require their questions to follow acronym order.

ASSESSMENT ORDER AND TIMING:

- Do not criticize an assessment merely because another assessment came first.
- Do not describe a completed assessment as "initially missed,"
  "delayed," "late," or "eventually obtained" without evidence of
  a specific applicable sequence requirement being violated.
- A later entry in the log does not by itself prove a harmful delay.
- Do not infer elapsed time or clinical delay from the order of text alone.
- Do not claim a skill-sheet sequence violation unless the applicable
  requirement is explicitly supplied in this grading context.
- If a sequence violation is supported, identify the exact requirement
  and the student actions that violated it.
- Evaluate clearly dangerous treatment actions using the documented
  evidence and existing critical-criteria results.
- Do not convert a REVIEW criterion into a confirmed failure without
  sufficient evidence. Explain when instructor review is required.

OPQRST AND SAMPLE:

- Do not award complete OPQRST unless the checklist marks every required
  OPQRST component complete.
- Do not award complete SAMPLE unless the checklist marks every required
  SAMPLE component complete.
- Distinguish region (symptom location) from radiation (symptom spread).
- If radiation was assessed, do not say radiation was missed merely
  because region was not assessed.
- Identify specific missing components only when the supplied evidence
  supports that conclusion.
- When the checklist contains separate component items, report those
  individual results.
- When an all-or-nothing checklist item receives no credit, explain that
  the complete-history requirement was not met. Do not imply every
  component was omitted.
- Do not say allergies, medications, past history, or oral intake were
  omitted when the submitted work documents those assessments.

EVIDENCE AND COMMENTS:

- Student questions and statements are evidence of student work.
- Patient or instructor answers alone do not prove the student performed
  an assessment or treatment.
- Do not invent student actions, findings, delays, or consequences.
- Every negative instructor comment must identify a documented omission,
  a supported unsafe action, or a supplied critical criterion.
- Comments must agree with the deterministic checklist.
- If checklist results conflict with documented student work, identify
  the discrepancy for instructor review without changing the score.
- Avoid unsupported statements such as:
  "The initial failure to assess radiation delayed understanding."
- Instead state the specific supported finding, such as:
  "Radiation was assessed; symptom location was not documented."

SCENARIO:

${selectedScenario.title}

DETERMINISTIC CHECKLIST:

${checklistText}

POINT SCORE:

${earnedPoints}/${possiblePoints}

CRITICAL-CRITERIA REVIEW:

${criticalText}

PATIENT INTERVIEW:

${body.patientHistory || body.studentAnswer || ""}

INSTRUCTOR INTERACTION:

${body.instructorHistory || ""}

ASSESSMENT AND TREATMENT LOG:

${body.treatmentPlan || ""}

Provide these exact sections:

CHECKLIST RESULT

CRITICAL CRITERIA

ITEMS MISSED

INSTRUCTOR COMMENTS

OVERALL RESULT

SECTION REQUIREMENTS:

CHECKLIST RESULT:
- Report the supplied point score accurately.
- Summarize completed and incomplete checklist items.

CRITICAL CRITERIA:
- Preserve the supplied PASS, FAIL, and REVIEW statuses.
- Clearly separate confirmed failures from items needing review.

ITEMS MISSED:
- List checklist items marked no credit.
- Explain partial completion when supported by the submitted work.
- Do not list credited items as missed.
- Flag any scoring discrepancy for instructor review.

INSTRUCTOR COMMENTS:
- Explain documented strengths and specific areas for improvement.
- Do not criticize assessment order without a supported requirement.
- Do not introduce additional scoring deductions.

OVERALL RESULT:
- FAIL when one or more valid critical failures are present.
- FAIL for a clearly dangerous intervention supported by evidence.
- FAIL when the score is below 33 points.
- Criteria marked REVIEW require instructor judgment.
- Otherwise determine PASS or FAIL based on the total performance.
`;

const feedback = await createChatReply(
  `
You are a strict but helpful EMT instructor grading a
patient-assessment practice simulation.

Follow the supplied evidence and deterministic checklist.
Do not alter scores or invent student actions.
Do not invent assessment-order requirements or clinical delays.
Treat completed assessments as completed regardless of where
they appear in the session, unless an explicitly supplied
sequence requirement establishes a violation.
Use clear, specific checklist-style feedback.
  `,
  gradingPrompt
);
    return res.json({
      feedback,
      checklist,
      earnedPoints,
      possiblePoints,

      completed:
        checklist.filter(
          item => item.pass
        ).length,

      checklistTotal:
        checklist.length,

      criticalCriteria,

      criticalFails:
        automaticFails,

      triggeredCriticalFails:
        automaticFails
    });
  } catch (error) {
    console.error(
      "GRADING ERROR:",
      error
    );

    return res.status(500).json({
      feedback:
        "Grading server error. Check the Render logs and OPENAI_API_KEY."
    });
  }
});

/* =========================================================
   AI-ASSISTED DISPUTE REVIEW
========================================================= */

app.post("/review-dispute", async (req, res) => {
  try {
    const body = req.body || {};
    const dispute = body.dispute || {};

    const checklist =
      Array.isArray(body.checklist)
        ? body.checklist
        : [];

    const studentInputLog =
      Array.isArray(body.studentInputLog)
        ? body.studentInputLog
        : [];

    if (
      !String(dispute.item || "").trim() ||
      !String(dispute.reason || "").trim()
    ) {
      return res.status(400).json({
        error:
          "A scoring item and dispute reason are required."
      });
    }

    const inputText =
      studentInputLog
        .map((entry, index) => {
          return (
            `${index + 1}. ` +
            `${entry.type || "Student Input"}: ` +
            `${entry.text || ""}`
          );
        })
        .join("\n");

    const checklistText =
      checklist
        .map(item => {
          return (
            `${item.id || ""} | ` +
            `${item.name || "Unnamed item"} | ` +
            `${item.pass ? "CREDIT AWARDED" : "NO CREDIT"} | ` +
            `${item.points || 0} point(s)`
          );
        })
        .join("\n");

    const completion =
      await openai.chat.completions.create({
        model:
          process.env.CHAT_MODEL ||
          "gpt-4.1-mini",

        temperature: 0,

        response_format: {
          type: "json_object"
        },

        messages: [
          {
            role: "system",

            content: `
You are reviewing a scoring dispute for a Connecticut EMT practice simulation.

IMPORTANT RULES:

- Use only the supplied student-input log.
- Do not infer or invent student actions.
- The dispute must match an exact checklist item.
- The checklist item must currently show NO CREDIT.
- Recommend AWARD only when clear supporting evidence appears in the student-input log.
- Recommend DENY when evidence is absent, vague, unrelated, or the item already received credit.
- Use NEEDS_INSTRUCTOR_REVIEW when the evidence cannot be judged reliably.
- Never award more than one point.
- Return valid JSON only.

Return these exact JSON fields:

{
  "recommendation": "AWARD, DENY, or NEEDS_INSTRUCTOR_REVIEW",
  "suggestedPoints": 0 or 1,
  "rationale": "Brief explanation",
  "relevantEvidence": ["Evidence from student input"],
  "matchedChecklistItemId": "Exact checklist ID",
  "matchedChecklistItemName": "Exact checklist item name"
}
            `
          },

          {
            role: "user",

            content: `
Scenario:
${body.scenario || "EMT Scenario"}

Original score:
${Number(body.earnedPoints) || 0}/${Number(body.possiblePoints) || 0}

Disputed item:
${dispute.item}

Student explanation:
${dispute.reason}

CHECKLIST:

${checklistText || "Checklist unavailable."}

COMPLETE STUDENT INPUT LOG:

${inputText ||
body.treatmentPlan ||
"No student inputs supplied."}
            `
          }
        ]
      });

    const raw =
      completion.choices?.[0]
        ?.message?.content ||
      "{}";

    const review =
      JSON.parse(raw);

    const allowed = [
      "AWARD",
      "DENY",
      "NEEDS_INSTRUCTOR_REVIEW"
    ];

    let recommendation =
      allowed.includes(
        review.recommendation
      )
        ? review.recommendation
        : "NEEDS_INSTRUCTOR_REVIEW";

    const matchedItem =
      checklist.find(item => {
        return (
          String(item.id || "") ===
            String(
              review.matchedChecklistItemId ||
              ""
            ) &&
          item.pass !== true
        );
      });

    /*
      The AI cannot award a point unless it returned the ID
      of a real checklist item that originally received no credit.
    */
    if (
      recommendation === "AWARD" &&
      !matchedItem
    ) {
      recommendation =
        "NEEDS_INSTRUCTOR_REVIEW";
    }

    return res.json({
      recommendation,

      suggestedPoints:
        recommendation === "AWARD" &&
        Number(
          review.suggestedPoints
        ) === 1
          ? 1
          : 0,

      matchedChecklistItemId:
        matchedItem
          ? String(
              matchedItem.id ||
              ""
            )
          : "",

      matchedChecklistItemName:
        matchedItem
          ? String(
              matchedItem.name ||
              ""
            )
          : "",

      rationale:
        String(
          review.rationale ||
          "The AI review did not provide a rationale."
        ),

      relevantEvidence:
        Array.isArray(
          review.relevantEvidence
        )
          ? review.relevantEvidence
              .map(value =>
                String(value)
              )
              .slice(0, 6)
          : [],

      advisoryOnly: false,

      reviewedAt:
        new Date().toISOString()
    });
  } catch (error) {
    console.error(
      "DISPUTE REVIEW ERROR:",
      error
    );

    return res.status(500).json({
      error:
        "The AI dispute review could not be completed."
    });
  }
});

/* =========================================================
   COMPATIBILITY ROUTES
========================================================= */

app.post(
  "/ask-patient",
  async (req, res) => {
    try {
      const {
        studentQuestion = "",
        history = "",
        scenario = "chestPain"
      } = req.body || {};

      if (!studentQuestion.trim()) {
        return res.status(400).json({
          reply:
            "No patient question was provided."
        });
      }

      const selectedScenario =
        getScenario(scenario);

      const reply =
        await createChatReply(
          selectedScenario.patientPrompt,

          `
Conversation so far:

${history}

The EMT asks:

${studentQuestion}

Answer only that question as the patient.
          `
        );

      return res.json({
        reply
      });
    } catch (error) {
      console.error(
        "ASK-PATIENT ERROR:",
        error
      );

      return res.status(500).json({
        reply:
          "Patient server error."
      });
    }
  }
);

app.post(
  "/ask-instructor",
  async (req, res) => {
    try {
      const {
        studentQuestion = "",
        history = "",
        scenario = "chestPain"
      } = req.body || {};

      if (!studentQuestion.trim()) {
        return res.status(400).json({
          reply:
            "No instructor question was provided."
        });
      }

      const selectedScenario =
        getScenario(scenario);

      const reply =
        await createChatReply(
          selectedScenario.instructorPrompt,

          `
Patient conversation:

${history}

Student asks:

${studentQuestion}

Respond briefly as the instructor.
          `
        );

      return res.json({
        reply
      });
    } catch (error) {
      console.error(
        "ASK-INSTRUCTOR ERROR:",
        error
      );

      return res.status(500).json({
        reply:
          "Instructor server error."
      });
    }
  }
);

/* =========================================================
   404 AND ERROR HANDLING
========================================================= */

app.use((req, res) => {
  return res.status(404).json({
    error:
      "Route not found.",

    method:
      req.method,

    path:
      req.originalUrl
  });
});

app.use(
  (
    error,
    req,
    res,
    next
  ) => {
    console.error(
      "UNHANDLED SERVER ERROR:",
      error
    );

    if (res.headersSent) {
      return next(error);
    }

    return res.status(500).json({
      error:
        "Unexpected server error."
    });
  }
);

/* =========================================================
   START SERVER
========================================================= */

app.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      `EMT simulator running on port ${PORT}`
    );
  }
);
