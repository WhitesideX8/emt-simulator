import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import OpenAI from "openai";
import { fileURLToPath } from "url";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const upload = multer({ dest: uploadsDir });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

const CHAT_MODEL = process.env.CHAT_MODEL || "gpt-4o-mini";
const TRANSCRIBE_MODEL =
  process.env.TRANSCRIBE_MODEL || "gpt-4o-mini-transcribe";
const TTS_MODEL = process.env.TTS_MODEL || "tts-1";

const scenarios = {
  chestPain: {
    name: "Chest Pain",
    dispatch: "You are dispatched to a home for chest pain.",
    patient: `
You are a 58-year-old male.
Chief complaint: chest pressure.
Pain: substernal pressure, radiates to left arm.
Onset: started about 30 minutes ago while sitting.
Severity: 8/10.
Associated symptoms: shortness of breath, nausea, sweating.
History: hypertension and high cholesterol.
Medications: lisinopril and atorvastatin.
Allergies: no known drug allergies.
Last oral intake: lunch about 3 hours ago.
Events: watching TV when pain started.
You are anxious but alert.
Only answer what the EMT asks.
Do not volunteer everything at once.
`,
    patientNeedsOxygen: true,
    patientCritical: true
  },

  sob: {
    name: "Shortness of Breath",
    dispatch: "You are dispatched for difficulty breathing.",
    patient: `
You are a 67-year-old female.
Chief complaint: shortness of breath.
History: COPD.
Medications: rescue inhaler and home oxygen at night.
Allergies: no known drug allergies.
You have a cough and wheezing.
You deny chest pain unless asked.
You are alert but speaking in short sentences.
Only answer what the EMT asks.
`,
    patientNeedsOxygen: true,
    patientCritical: true
  },

  stroke: {
    name: "Stroke",
    dispatch: "You are dispatched for possible stroke.",
    patient: `
You are a 72-year-old male.
Chief complaint: right-sided weakness and slurred speech.
Onset: about 20 minutes ago.
History: hypertension and atrial fibrillation.
Medications: blood thinner.
Allergies: none known.
You are awake but speech is slurred.
Only answer what the EMT asks.
`,
    patientNeedsOxygen: false,
    patientCritical: true
  },

  diabetic: {
    name: "Diabetic Emergency",
    dispatch: "You are dispatched for altered mental status.",
    patient: `
You are a 45-year-old diabetic patient.
Chief complaint: weakness, sweating, confusion.
History: diabetes.
Medications: insulin.
You have not eaten today.
You are confused but able to answer simple questions.
Only answer what the EMT asks.
`,
    patientNeedsOxygen: false,
    patientCritical: false
  }
};

function getScenario(name) {
  return scenarios[name] || scenarios.chestPain;
}

function normalize(text) {
  return String(text || "").toLowerCase();
}

function includesAny(text, terms) {
  return terms.some(term => text.includes(term));
}

async function chatResponse(systemPrompt, userPrompt) {
  const completion = await openai.chat.completions.create({
    model: CHAT_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ]
  });

  return completion.choices[0].message.content;
}

async function cleanTranscript(rawText) {
  if (!rawText) return "";

  const completion = await openai.chat.completions.create({
    model: CHAT_MODEL,
    messages: [
      {
        role: "system",
        content: `
You are an EMT terminology corrector.

Correct obvious speech-to-text mistakes involving EMS terminology.

Examples:
sample -> SAMPLE
op qrst -> OPQRST
nitro -> nitroglycerin
spo2 -> SpO2
bag valve mask -> bag-valve mask
non rebreather -> nonrebreather
o two -> O2
BP -> blood pressure

DO NOT add information.
DO NOT change the meaning.
Return only the corrected transcript.
`
      },
      { role: "user", content: rawText }
    ]
  });

  return completion.choices[0].message.content.trim();
}

function ctPsychomotorGrade(history, treatmentPlan, scenarioName) {
  const scenario = getScenario(scenarioName);
  const text = normalize(`${history}\n${treatmentPlan}`);

  const sections = {
    sceneSizeUp: { earned: 0, possible: 6, items: [] },
    primaryAssessment: { earned: 0, possible: 10, items: [] },
    historyTaking: { earned: 0, possible: 10, items: [] },
    secondaryAssessment: { earned: 0, possible: 5, items: [] },
    vitals: { earned: 0, possible: 5, items: [] },
    treatment: { earned: 0, possible: 7, items: [] },
    reassessment: { earned: 0, possible: 4, items: [] }
  };

  const criticalFailures = [];

  function check(section, label, terms) {
    const passed = includesAny(text, terms);
    sections[section].items.push({ label, passed });
    if (passed) sections[section].earned += 1;
  }

  check("sceneSizeUp", "BSI / PPE", ["bsi", "ppe", "gloves"]);
  check("sceneSizeUp", "Scene safety", ["scene safe", "safe scene"]);
  check("sceneSizeUp", "Nature of illness", ["noi", "nature of illness"]);
  check("sceneSizeUp", "Number of patients", ["number of patients", "one patient"]);
  check("sceneSizeUp", "Additional resources", ["als", "paramedic", "backup"]);
  check("sceneSizeUp", "Spinal precautions considered", ["spinal", "c-spine", "no trauma"]);

  check("primaryAssessment", "General impression", ["general impression", "appears"]);
  check("primaryAssessment", "LOC / AVPU", ["avpu", "alert", "loc"]);
  check("primaryAssessment", "Chief complaint", ["chief complaint", "chest pain", "shortness of breath"]);
  check("primaryAssessment", "Airway", ["airway"]);
  check("primaryAssessment", "Breathing", ["breathing", "respirations"]);
  check("primaryAssessment", "Circulation", ["pulse", "circulation"]);
  check("primaryAssessment", "Skin", ["skin", "pale", "cool", "diaphoretic"]);
  check("primaryAssessment", "Oxygen", ["oxygen", "o2", "nonrebreather", "nasal cannula"]);
  check("primaryAssessment", "Priority", ["priority", "unstable", "stable"]);
  check("primaryAssessment", "Transport", ["transport", "hospital"]);

  check("historyTaking", "OPQRST", ["opqrst", "onset", "provocation", "quality", "radiation", "severity"]);
  check("historyTaking", "SAMPLE", ["sample", "signs", "symptoms", "allergies", "medications"]);
  check("historyTaking", "Allergies", ["allergies"]);
  check("historyTaking", "Medications", ["medications", "meds"]);
  check("historyTaking", "Past history", ["past medical", "history"]);
  check("historyTaking", "Last oral intake", ["last oral", "last ate", "last meal"]);
  check("historyTaking", "Events", ["events", "what happened"]);
  check("historyTaking", "Onset", ["onset", "started"]);
  check("historyTaking", "Radiation", ["radiates", "left arm", "jaw"]);
  check("historyTaking", "Severity", ["severity", "scale", "pain level"]);

  check("secondaryAssessment", "Focused exam", ["focused exam", "secondary assessment"]);
  check("secondaryAssessment", "Lung sounds", ["lung sounds", "breath sounds"]);
  check("secondaryAssessment", "Chest/cardiac", ["cardiac", "heart", "chest"]);
  check("secondaryAssessment", "Associated symptoms", ["nausea", "sweating", "shortness of breath"]);
  check("secondaryAssessment", "Pertinent negatives", ["denies", "no allergies"]);

  check("vitals", "Blood pressure", ["blood pressure", "bp"]);
  check("vitals", "Pulse", ["pulse", "heart rate"]);
  check("vitals", "Respirations", ["respirations", "respiratory rate"]);
  check("vitals", "SpO2", ["spo2", "pulse ox"]);
  check("vitals", "Repeat vitals", ["repeat vitals", "reassess vitals"]);

  check("treatment", "Oxygen therapy", ["oxygen", "o2"]);
  check("treatment", "Aspirin", ["aspirin", "asa"]);
  check("treatment", "Nitroglycerin considered", ["nitro", "nitroglycerin"]);
  check("treatment", "Rapid transport", ["transport", "hospital"]);
  check("treatment", "ALS requested", ["als", "paramedic"]);
  check("treatment", "Position of comfort", ["position of comfort", "semi-fowler"]);
  check("treatment", "Monitoring", ["monitor", "reassess"]);

  check("reassessment", "Reassess airway", ["reassess airway"]);
  check("reassessment", "Reassess breathing", ["reassess breathing"]);
  check("reassessment", "Reassess circulation", ["reassess circulation"]);
  check("reassessment", "Verbal report", ["verbal report", "handoff"]);

  if (!includesAny(text, ["bsi", "ppe", "gloves"])) {
    criticalFailures.push("Failure to verbalize BSI/PPE precautions.");
  }

  if (!includesAny(text, ["scene safe", "safe scene"])) {
    criticalFailures.push("Failure to determine scene safety.");
  }

  if (!includesAny(text, ["airway"])) {
    criticalFailures.push("Failure to assess/manage airway.");
  }

  if (!includesAny(text, ["breathing", "respirations"])) {
    criticalFailures.push("Failure to assess/manage breathing.");
  }

  if (!includesAny(text, ["pulse", "circulation"])) {
    criticalFailures.push("Failure to assess circulation.");
  }

  if (
    scenario.patientNeedsOxygen &&
    !includesAny(text, ["oxygen", "o2", "nasal cannula", "nonrebreather"])
  ) {
    criticalFailures.push("Failure to provide or consider oxygen when indicated.");
  }

  if (
    scenario.patientCritical &&
    !includesAny(text, ["transport", "hospital", "emergency department"])
  ) {
    criticalFailures.push("Failure to make appropriate transport decision.");
  }

  let totalEarned = 0;
  let totalPossible = 0;

  for (const section of Object.values(sections)) {
    totalEarned += section.earned;
    totalPossible += section.possible;
  }

  const percent = Math.round((totalEarned / totalPossible) * 100);
  const result =
    criticalFailures.length === 0 && percent >= 78 ? "PASS" : "FAIL";

  return {
    scenario: scenario.name,
    sections,
    criticalFailures,
    totalEarned,
    totalPossible,
    percent,
    minimumPassingPercent: 78,
    result
  };
}

function formatScoreReport(grade, aiFeedback) {
  const s = grade.sections;

  const criticalText =
    grade.criticalFailures.length === 0
      ? "✔ No Critical Criteria failures."
      : grade.criticalFailures.map(f => `✘ ${f}`).join("\n");

  return `
CTOEMS-STYLE EMT PSYCHOMOTOR PRACTICE EVALUATION

Scenario: ${grade.scenario}

RESULT: ${grade.result}

Critical Criteria:
${criticalText}

Skill Sheet Score:
Scene Size-Up: ${s.sceneSizeUp.earned}/${s.sceneSizeUp.possible}
Primary Assessment: ${s.primaryAssessment.earned}/${s.primaryAssessment.possible}
History Taking: ${s.historyTaking.earned}/${s.historyTaking.possible}
Secondary Assessment: ${s.secondaryAssessment.earned}/${s.secondaryAssessment.possible}
Vital Signs: ${s.vitals.earned}/${s.vitals.possible}
Treatment: ${s.treatment.earned}/${s.treatment.possible}
Reassessment: ${s.reassessment.earned}/${s.reassessment.possible}

TOTAL SCORE: ${grade.totalEarned}/${grade.totalPossible}
PERCENT: ${grade.percent}%
MINIMUM PASSING: ${grade.minimumPassingPercent}%

Instructor Feedback:
${aiFeedback}
`.trim();
}

app.post("/ask", async (req, res) => {
  try {
    const { studentQuestion, history, scenario } = req.body;
    const scenarioData = getScenario(scenario);

    const reply = await chatResponse(
      `
You are the patient in an EMT training simulation.
Answer only as the patient.
Do not act as the instructor.
Do not explain EMT treatment.
Only answer what the EMT asks.

Patient information:
${scenarioData.patient}
`,
      `
Conversation so far:
${history || ""}

Student asks:
${studentQuestion || ""}
`
    );

    res.json({ reply });
  } catch (error) {
    console.error("ASK ERROR:", error);
    res.status(500).json({ reply: "Patient server error." });
  }
});

app.post("/instructor", async (req, res) => {
  try {
    const { studentQuestion, scenario, history } = req.body;
    const scenarioData = getScenario(scenario);

    const reply = await chatResponse(
      `
You are an experienced EMT instructor helping a student through this patient simulation.

Rules:
- Answer the student's question.
- Use BOTH the patient information and conversation history.
- Answer questions about the patient's symptoms, history, medications, allergies, assessment findings, and EMT treatment.
- Do NOT act as the patient.
- Do NOT invent information.
- Keep answers to 1-3 sentences.

Scenario:
${scenarioData.name}

Patient information:
${scenarioData.patient}

Conversation history:
${history || ""}
`,
      studentQuestion || ""
    );

    res.json({ reply });
  } catch (error) {
    console.error("INSTRUCTOR ERROR:", error);
    res.status(500).json({ reply: "Instructor server error." });
  }
});

app.post("/grade", async (req, res) => {
  try {
    const { studentAnswer, treatmentPlan, scenario } = req.body;

    const objectiveGrade = ctPsychomotorGrade(
      studentAnswer || "",
      treatmentPlan || "",
      scenario || "chestPain"
    );

    const aiFeedback = await chatResponse(
      `
You are an EMT instructor giving feedback after a Connecticut-style EMT psychomotor practice station.
Do not change the score.
Give clear, concise feedback.
`,
      `
Student conversation history:
${studentAnswer || ""}

Student treatment plan:
${treatmentPlan || ""}

Objective grade:
${JSON.stringify(objectiveGrade, null, 2)}
`
    );

    res.json({
      feedback: formatScoreReport(objectiveGrade, aiFeedback),
      grade: objectiveGrade
    });
  } catch (error) {
    console.error("GRADE ERROR:", error);
    res.status(500).json({ feedback: "Error grading student." });
  }
});

app.post("/voice-ask", upload.single("audio"), async (req, res) => {
  let audioPath = null;

  try {
    if (!req.file) {
      return res.status(400).json({
        transcript: "",
        reply: "No audio file received."
      });
    }

    audioPath = req.file.path;

    const fixedAudioPath = audioPath + ".webm";
    fs.renameSync(audioPath, fixedAudioPath);
    audioPath = fixedAudioPath;

    const scenarioName = req.body.scenario || "chestPain";
    const history = req.body.history || "";
    const scenarioData = getScenario(scenarioName);

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: TRANSCRIBE_MODEL
    });

    const transcript = await cleanTranscript(transcription.text || "");

    const reply = await chatResponse(
      `
You are the patient in an EMT training simulation.
Answer only as the patient.
Do not teach.
Do not explain treatment.
Only answer what the EMT asks.

Patient information:
${scenarioData.patient}
`,
      `
Conversation so far:
${history}

Student asks:
${transcript}
`
    );

    res.json({ transcript, reply });
  } catch (error) {
    console.error("VOICE ASK ERROR:", error);
    res.status(500).json({
      transcript: "",
      reply: "Voice patient server error."
    });
  } finally {
    if (audioPath && fs.existsSync(audioPath)) {
      fs.unlinkSync(audioPath);
    }
  }
});

app.post("/voice-instructor", upload.single("audio"), async (req, res) => {
  let audioPath = null;

  try {
    if (!req.file) {
      return res.status(400).json({
        transcript: "",
        reply: "No audio file received."
      });
    }

    audioPath = req.file.path;

    const fixedAudioPath = audioPath + ".webm";
    fs.renameSync(audioPath, fixedAudioPath);
    audioPath = fixedAudioPath;

    const scenarioName = req.body.scenario || "chestPain";
    const history = req.body.history || "";
    const scenarioData = getScenario(scenarioName);

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: TRANSCRIBE_MODEL
    });

    const transcript = await cleanTranscript(transcription.text || "");

    const reply = await chatResponse(
      `
You are an experienced EMT instructor helping a student through this patient simulation.

Rules:
- Answer the student's spoken question.
- Use BOTH the patient information and conversation history.
- Explain your reasoning briefly.
- Answer questions about symptoms, history, medications, allergies, assessment findings, and appropriate EMT treatment.
- If the student asks if they missed something, tell them.
- If information is not available, say so.
- Do NOT act as the patient.
- Do NOT invent information.
- Keep answers to 1-3 concise sentences.

Scenario:
${scenarioData.name}

Patient information:
${scenarioData.patient}

Conversation history:
${history}
`,
      transcript
    );

    res.json({ transcript, reply });
  } catch (error) {
    console.error("VOICE INSTRUCTOR ERROR:", error);
    res.status(500).json({
      transcript: "",
      reply: "Voice instructor server error."
    });
  } finally {
    if (audioPath && fs.existsSync(audioPath)) {
      fs.unlinkSync(audioPath);
    }
  }
});

async function generateVoice(text, res, voiceName) {
  try {
    const speech = await openai.audio.speech.create({
      model: TTS_MODEL,
      voice: voiceName,
      input: text || "Please continue."
    });

    const buffer = Buffer.from(await speech.arrayBuffer());

    res.setHeader("Content-Type", "audio/mpeg");
    res.send(buffer);
  } catch (error) {
    console.error("VOICE GENERATION ERROR:", error);
    res.status(500).send("Voice generation failed.");
  }
}

app.post("/patient-voice", async (req, res) => {
  await generateVoice(req.body.text, res, "alloy");
});

app.post("/instructor-voice", async (req, res) => {
  await generateVoice(req.body.text, res, "echo");
});

app.get("/health", (req, res) => {
  res.send("Server is running.");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`EMT simulator running on port ${PORT}`);
});
