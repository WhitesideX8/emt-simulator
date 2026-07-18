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

/*
  Allows pages hosted on Hostinger or another website
  to communicate with this Render server.
*/
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

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

function evaluateOpqrst(text) {
  const completeRequest = includesAny(
    text,
    [
      "complete opqrst assessment performed",
      "perform a complete opqrst",
      "perform complete opqrst",
      "full opqrst assessment",
      "assess using opqrst",
      "go through opqrst"
    ]
  );

  const components = {
    onset: includesAny(text, [
      "opqrst onset assessed",
      "when did the pain start",
      "when did the chest pain start",
      "when did this begin",
      "sudden or gradual"
    ]),

    provocation: includesAny(text, [
      "opqrst provocation and palliation assessed",
      "what makes the pain better",
      "what makes the pain worse",
      "anything make it better",
      "anything make it worse"
    ]),

    quality: includesAny(text, [
      "opqrst quality assessed",
      "describe the pain",
      "what does the pain feel like",
      "quality of the pain",
      "sharp dull or pressure"
    ]),

    radiation: includesAny(text, [
      "opqrst radiation assessed",
      "does the pain radiate",
      "does the pain travel",
      "where does the pain go"
    ]),

    severity: includesAny(text, [
      "opqrst severity assessed",
      "rate your pain",
      "pain scale",
      "zero to ten",
      "0 to 10"
    ]),

    time: includesAny(text, [
      "opqrst time assessed",
      "how long has the pain lasted",
      "has the pain been constant",
      "does the pain come and go"
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
      name: "Nature of illness",
      points: 1,

      pass: includesAny(text, [
        "nature of illness assessed",
        "nature of illness",
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
      name: "Chief complaint",
      points: 1,

      pass: includesAny(text, [
        "chief complaint identified",
        "chief complaint",
        "what is bothering you",
        "what is wrong today"
      ])
    },

    {
      id: "opqrst",
      name: "Complete OPQRST",
      points: 6,
      pass: opqrst.complete
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

    /*
      Update the score-related critical criterion.
    */
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

IMPORTANT:

- This is a practice simulation, not an official state examination.
- Do not change the deterministic checklist results.
- Do not award a complete OPQRST unless the checklist marks it complete.
- Do not award a complete SAMPLE history unless the checklist marks it complete.
- Evaluate treatment appropriateness, treatment order, transport priority, oxygen use and professionalism.
- Be strict but educational.

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

Overall-result rules:

- FAIL when one or more valid critical failures are present.
- FAIL for a clearly dangerous intervention.
- FAIL when the score is below 33 points.
- Criteria marked REVIEW require instructor judgment.
- Otherwise determine PASS or FAIL based on the total performance.
    `;

    const feedback =
      await createChatReply(
        `
You are a strict but helpful EMT instructor grading a patient-assessment simulation.

Use clear checklist-style feedback.
Do not invent student actions.
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
