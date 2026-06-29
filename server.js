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
const TRANSCRIBE_MODEL = process.env.TRANSCRIBE_MODEL || "whisper-1";
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

  check("sceneSizeUp", "BSI / PPE", ["bsi", "ppe", "gloves", "body substance"]);
  check("sceneSizeUp", "Scene safety", ["scene safe", "scene is safe", "safe scene"]);
  check("sceneSizeUp", "Nature of illness", ["noi", "nature of illness", "medical"]);
  check("sceneSizeUp", "Number of patients", ["number of patients", "one patient", "single patient"]);
  check("sceneSizeUp", "Additional resources", ["als", "paramedic", "additional resources", "backup"]);
  check("sceneSizeUp", "Spinal precautions considered", ["spinal", "c-spine", "trauma ruled out", "no trauma"]);

  check("primaryAssessment", "General impression", ["general impression", "appears", "sick", "not sick"]);
  check("primaryAssessment", "LOC / AVPU", ["avpu", "alert", "verbal", "painful", "unresponsive", "loc"]);
  check("primaryAssessment", "Chief complaint", ["chief complaint", "complaint", "chest pain", "shortness of breath", "weakness"]);
  check("primaryAssessment", "Airway", ["airway"]);
  check("primaryAssessment", "Breathing", ["breathing", "respirations", "respiratory"]);
  check("primaryAssessment", "Circulation", ["pulse", "circulation"]);
  check("primaryAssessment", "Skin", ["skin", "pale", "cool", "diaphoretic", "sweating"]);
  check("primaryAssessment", "Oxygen considered/provided", ["oxygen", "o2", "nasal cannula", "nonrebreather"]);
  check("primaryAssessment", "Patient priority", ["priority", "unstable", "stable", "high priority"]);
  check("primaryAssessment", "Transport decision", ["transport", "hospital", "load and go", "emergency department"]);

  check("historyTaking", "OPQRST", ["opqrst", "onset", "provocation", "quality", "radiation", "severity", "time"]);
  check("historyTaking", "SAMPLE", ["sample", "signs", "symptoms", "allergies", "medications", "past medical"]);
  check("historyTaking", "Allergies", ["allergies", "allergic"]);
  check("historyTaking", "Medications", ["medications", "meds"]);
  check("historyTaking", "Past medical history", ["past medical", "history", "hypertension", "copd", "diabetes"]);
  check("historyTaking", "Last oral intake", ["last oral", "last ate", "last meal"]);
  check("historyTaking", "Events leading up", ["events", "what happened", "leading up"]);
  check("historyTaking", "Pain onset", ["onset", "started", "began"]);
  check("historyTaking", "Pain radiation", ["radiates", "radiating", "left arm", "jaw", "back"]);
  check("historyTaking", "Pain severity", ["severity", "scale", "0-10", "1-10", "pain level"]);

  check("secondaryAssessment", "Focused exam", ["focused exam", "secondary assessment"]);
  check("secondaryAssessment", "Lung sounds", ["lung sounds", "breath sounds", "clear", "wheezes", "crackles"]);
  check("secondaryAssessment", "Cardiac / chest assessment", ["cardiac", "heart", "chest"]);
  check("secondaryAssessment", "Associated symptoms", ["nausea", "sob", "shortness of breath", "sweating", "diaphoretic"]);
  check("secondaryAssessment", "Pertinent negatives", ["denies", "no trauma", "no allergies"]);

  check("vitals", "Blood pressure", ["blood pressure", "bp"]);
  check("vitals", "Pulse", ["pulse", "heart rate"]);
  check("vitals", "Respirations", ["respirations", "respiratory rate"]);
  check("vitals", "SpO2", ["spo2", "pulse ox", "oxygen saturation"]);
  check("vitals", "Repeat vitals", ["repeat vitals", "reassess vitals", "ongoing vitals"]);

  check("treatment", "Oxygen therapy", ["oxygen", "o2", "nasal cannula", "nonrebreather"]);
  check("treatment", "Aspirin", ["aspirin", "asa"]);
  check("treatment", "Nitroglycerin considered", ["nitro", "nitroglycerin"]);
  check("treatment", "Rapid transport", ["transport", "hospital", "emergency department"]);
  check("treatment", "ALS requested", ["als", "paramedic", "intercept"]);
  check("treatment", "Position of comfort", ["position of comfort", "semi-fowler", "sitting"]);
  check("treatment", "Continued monitoring", ["monitor", "reassess", "cardiac monitor"]);

  check("reassessment", "Reassess airway", ["reassess airway", "airway reassessment"]);
  check("reassessment", "Reassess breathing", ["reassess breathing", "breathing reassessment"]);
  check("reassessment", "Reassess circulation", ["reassess circulation", "pulse reassessment"]);
  check("reassessment", "Verbal report", ["verbal report", "handoff", "report to hospital"]);

  if (!includesAny(text, ["bsi", "ppe", "gloves"])) {
    criticalFailures.push("Failure to verbalize BSI/PPE precautions.");
  }

  if (!includesAny(text, ["scene safe", "scene is safe", "safe scene"])) {
    criticalFailures.push("Failure to determine scene safety.");
  }

  if (!includesAny(text, ["airway"])) {
    criticalFailures.push("Failure to assess/manage airway.");
  }

  if (!includesAny(text, ["breathing", "respirations", "respiratory"])) {
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
    !includesAny(text, ["transport", "hospital", "load and go", "emergency department"])
  ) {
    criticalFailures.push("Failure to make appropriate transport decision.");
  }

  if (includesAny(text, ["refuse transport", "leave patient", "no transport needed"])) {
    criticalFailures.push("Dangerous decision: no transport for a potentially unstable patient.");
  }

  let totalEarned = 0;
  let totalPossible = 0;

  for (const section of Object.values(sections)) {
    totalEarned += section.earned;
    totalPossible += section.possible;
  }

  const percent = Math.round((totalEarned / totalPossible) * 100);
  const minimumPassingPercent = 78;

  const result =
    criticalFailures.length === 0 && percent >= minimumPassingPercent
      ? "PASS"
      : "FAIL";

  return {
    scenario: scenario.name,
    sections,
    criticalFailures,
    totalEarned,
    totalPossible,
    percent,
    minimumPassingPercent,
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

app.post("/ask", async (req, res) => {
  try {
    const { studentQuestion, history, scenario } = req.body;
    const scenarioData = getScenario(scenario);

    const reply = await chatResponse(
      `
You are the patient in an EMT training simulation.

Rules:
- Answer only as the patient.
- Do not act as the instructor.
- Do not explain EMT treatment.
- Do not give information unless asked.
- Keep responses realistic and brief.

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
    const { studentQuestion, scenario } = req.body;
    const scenarioData = getScenario(scenario);

    const reply = await chatResponse(
      `
You are an EMT instructor.

Rules:
- Give short, direct coaching.
- Do not complete the whole scenario for the student.
- Do not give a grade unless asked.
- Keep advice appropriate for EMT level.

Scenario:
${scenarioData.name}
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

Rules:
- Do NOT change the score.
- Do NOT decide pass or fail.
- Do NOT invent points.
- Do NOT say this is the official CT OEMS exam.
- Give clear practical feedback.
- Mention what was done well.
- Mention what was missed.
- Keep it concise.
`,
      `
Student conversation history:
${studentAnswer || ""}

Student treatment plan:
${treatmentPlan || ""}

Objective grade:
${JSON.stringify(objectiveGrade, null, 2)}

Write instructor feedback only.
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

Rules:
- Answer only as the patient.
- Do not teach.
- Do not explain treatment.
- Do not give information unless asked.
- Keep the answer brief and realistic.

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
    const scenarioData = getScenario(scenarioName);

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: TRANSCRIBE_MODEL
    });

    const transcript = await cleanTranscript(transcription.text || "");

    const reply = await chatResponse(
      `
You are an EMT instructor.

Rules:
- Answer directly.
- Keep answers short.
- Do not give away the entire scenario.
- Use EMT-level explanations.

Scenario:
${scenarioData.name}
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
