import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import OpenAI from "openai";
import { gradeCtMedical } from "./ctMedicalGrader.js";

const app = express();
const PORT = process.env.PORT || 3000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const upload = multer({ dest: "uploads/" });

app.use(express.json({ limit: "10mb" }));
app.use(express.static("public"));

const scenarios = {
  chestPain: {
    title: "Chest Pain",
    initialInfo: "You are dispatched to a home for chest pain.",
    patientPrompt: `
You are a 58-year-old male patient with chest pain.

VERY IMPORTANT:
Only answer the specific question the EMT asks.
Do NOT volunteer additional information unless the EMT asks.
Do NOT give your entire history at once.
Keep answers short, like a real patient.

Patient information:
Chief complaint: Pressure in the center of the chest.
Onset: Started about 20 minutes ago while carrying groceries.
Provocation: Worse when walking, a little better sitting still.
Quality: Heavy pressure, like someone sitting on the chest.
Radiation: Down the left arm and into the jaw.
Severity: 8 out of 10.
Time: Constant since it began.
Signs/symptoms: Chest pressure, shortness of breath, nausea, sweating, pale skin.
Allergies: Penicillin.
Medications: Lisinopril and atorvastatin.
Past history: Hypertension and high cholesterol.
Last oral intake: Breakfast around 7 AM.
Events: Carrying groceries into the house.
Additional: No previous heart attacks, no cardiac surgeries, no aspirin today, no nitroglycerin.

Rules:
Only answer what was asked.
Never act like the instructor.
Never explain EMT treatment.
Always respond like an actual patient would.
`,
    instructorPrompt: `
You are an EMT instructor running a chest pain psychomotor simulation.
Answer briefly and directly.
Give assessment findings only when the student asks appropriate questions.
Do not coach unless the student specifically asks for help.

Instructor findings:
General impression: anxious 58-year-old male sitting upright, pale and diaphoretic.
Airway: patent.
Breathing: mildly labored, speaks in full sentences.
Circulation: radial pulse present, skin pale/cool/diaphoretic.
Lung sounds: clear bilaterally.
Vital signs: BP 168/96, HR 104, RR 22, SpO2 94% on room air.
ECG/monitor if asked: sinus tachycardia.
12-lead if requested: concern for possible inferior STEMI.
Blood glucose if asked: 118 mg/dL.
Pupils: equal and reactive.
No trauma noted.
`,
    patientVoice: "onyx",
    patientVoiceInstructions:
      "Use a deep adult male voice. Speak slowly, anxiously, and slightly short of breath like a 58-year-old man having chest pain.",
    instructorVoice: "sage",
    instructorVoiceInstructions:
      "Use a calm professional EMT instructor voice. Speak clearly and briefly."
  },

  sob: {
    title: "Shortness of Breath",
    initialInfo: "You are dispatched to a residence for difficulty breathing.",
    patientPrompt: `
You are a 67-year-old female patient with shortness of breath.
Only answer the specific question asked.
Do not volunteer a full history unless asked.

Facts:
COPD history.
Sitting forward and speaking in short sentences.
Wheezing.
Very short of breath.
Used inhaler twice with little relief.
Denies chest pain.
Productive cough.
Allergic to sulfa.
Takes albuterol and tiotropium.
`,
    instructorPrompt: `
You are an EMT instructor running a shortness of breath scenario.
Give findings only when asked.
Vitals if asked: BP 150/88, HR 112, RR 28, SpO2 88% room air.
Lung sounds if asked: wheezing bilaterally.
`,
    patientVoice: "coral",
    patientVoiceInstructions: "Use an older female voice. Speak with mild respiratory distress and short phrases.",
    instructorVoice: "sage",
    instructorVoiceInstructions: "Use a calm professional EMT instructor voice. Speak clearly and briefly."
  },

  stroke: {
    title: "Stroke",
    initialInfo: "You are dispatched to a home for possible stroke symptoms.",
    patientPrompt: `
You are a 72-year-old male patient with possible stroke symptoms.
Only answer the specific question asked.
You have right-sided weakness and slurred speech.
Symptoms started about 20 minutes ago.
You are confused and frustrated.
You have no pain.
`,
    instructorPrompt: `
You are an EMT instructor running a stroke scenario.
Give findings only when asked.
Findings: right arm drift, facial droop, slurred speech.
Vitals if asked: BP 190/104, HR 88, RR 18, SpO2 96%.
Blood glucose if asked: 132 mg/dL.
`,
    patientVoice: "echo",
    patientVoiceInstructions: "Use an older male voice. Speak slowly with slight difficulty forming words.",
    instructorVoice: "sage",
    instructorVoiceInstructions: "Use a calm professional EMT instructor voice. Speak clearly and briefly."
  },

  diabetic: {
    title: "Diabetic Emergency",
    initialInfo: "You are dispatched for a confused diabetic patient.",
    patientPrompt: `
You are a diabetic patient with altered mental status.
Only answer the specific question asked.
You are confused, sweaty, and weak.
You have not eaten today.
You take insulin.
You feel shaky.
`,
    instructorPrompt: `
You are an EMT instructor running a diabetic emergency scenario.
Give findings only when asked.
Vitals if asked: BP 138/82, HR 110, RR 18, SpO2 97%.
Blood glucose if asked: 42 mg/dL.
`,
    patientVoice: "ash",
    patientVoiceInstructions: "Use a weak, confused adult voice. Speak slowly and softly.",
    instructorVoice: "sage",
    instructorVoiceInstructions: "Use a calm professional EMT instructor voice. Speak clearly and briefly."
  }
};

function getScenario(scenarioName) {
  return scenarios[scenarioName] || scenarios.chestPain;
}

function deterministicChecklist(history = "", treatmentPlan = "") {
  const text = `${history}\n${treatmentPlan}`.toLowerCase();

  const checks = [
    { name: "BSI Precautions", pass: text.includes("bsi") || text.includes("gloves") || text.includes("ppe") },
    { name: "Scene Safety", pass: text.includes("scene safe") || text.includes("scene safety") },
    { name: "Chief Complaint", pass: text.includes("chief complaint") || text.includes("what's wrong") || text.includes("what is wrong") || text.includes("why did you call") || text.includes("chest pain") || text.includes("shortness of breath") || text.includes("weakness") || text.includes("confused") },
    { name: "General Impression", pass: text.includes("general impression") || text.includes("appearance") || text.includes("how does") || text.includes("pale") || text.includes("diaphoretic") },
    { name: "Mental Status", pass: text.includes("mental status") || text.includes("avpu") || text.includes("alert") || text.includes("oriented") || text.includes("level of consciousness") },
    { name: "Airway", pass: text.includes("airway") },
    { name: "Breathing", pass: text.includes("breathing") || text.includes("respirations") || text.includes("lung sounds") || text.includes("short of breath") || text.includes("spo2") || text.includes("oxygen saturation") },
    { name: "Circulation", pass: text.includes("circulation") || text.includes("pulse") || text.includes("skin") || text.includes("cap refill") || text.includes("radial") },
    { name: "OPQRST", pass: text.includes("opqrst") || text.includes("onset") || text.includes("provocation") || text.includes("quality") || text.includes("radiation") || text.includes("severity") || text.includes("time") || text.includes("when did it start") || text.includes("does it go anywhere") || text.includes("how bad") },
    { name: "SAMPLE", pass: text.includes("sample") || text.includes("allergies") || text.includes("medications") || text.includes("medical history") || text.includes("last oral") || text.includes("last ate") || text.includes("events") },
    { name: "Vital Signs", pass: text.includes("vital") || text.includes("blood pressure") || text.includes("bp") || text.includes("heart rate") || text.includes("respiratory rate") || text.includes("spo2") || text.includes("oxygen saturation") },
    { name: "Appropriate Treatment / Transport", pass: text.includes("transport") || text.includes("als") || text.includes("oxygen") || text.includes("aspirin") || text.includes("cardiac monitor") || text.includes("12 lead") || text.includes("oral glucose") },
    { name: "Reassessment", pass: text.includes("reassess") || text.includes("repeat vital") || text.includes("recheck") || text.includes("continue to monitor") }
  ];

  return checks;
}

function getAudioExtension(file) {
  let extension = ".webm";

  if (file.originalname) {
    const originalExtension = path.extname(file.originalname).toLowerCase();
    if ([".mp3", ".mp4", ".mpeg", ".mpga", ".m4a", ".wav", ".webm"].includes(originalExtension)) {
      extension = originalExtension;
    }
  }

  if (file.mimetype) {
    if (file.mimetype.includes("mp4")) extension = ".mp4";
    if (file.mimetype.includes("mpeg")) extension = ".mp3";
    if (file.mimetype.includes("wav")) extension = ".wav";
    if (file.mimetype.includes("webm")) extension = ".webm";
    if (file.mimetype.includes("m4a")) extension = ".m4a";
  }

  return extension;
}

async function transcribeUploadedAudio(file) {
  const originalPath = file.path;
  const extension = getAudioExtension(file);
  const audioPathWithExtension = `${originalPath}${extension}`;

  fs.renameSync(originalPath, audioPathWithExtension);

  try {
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioPathWithExtension),
      model: "whisper-1"
    });

    return transcription.text || "";
  } finally {
    if (fs.existsSync(audioPathWithExtension)) {
      fs.unlink(audioPathWithExtension, () => {});
    }
  }
}

async function createChatReply(systemPrompt, userPrompt) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    temperature: 0.2,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ]
  });

  return completion.choices[0].message.content;
}

async function createSpeechAudio(text, voice, instructions) {
  const audio = await openai.audio.speech.create({
    model: "gpt-4o-mini-tts",
    voice,
    input: text,
    instructions
  });

  return Buffer.from(await audio.arrayBuffer());
}

app.get("/", (req, res) => {
  res.redirect("/index.html");
});

app.get("/scenario-data/:scenario", (req, res) => {
  const selectedScenario = getScenario(req.params.scenario);
  res.json({
    title: selectedScenario.title,
    initialInfo: selectedScenario.initialInfo
  });
});

app.post("/ask", async (req, res) => {
  try {
    const { studentQuestion, history, scenario } = req.body;
    const selectedScenario = getScenario(scenario);

    if (!studentQuestion) return res.status(400).json({ reply: "No question was provided." });

    const reply = await createChatReply(
      selectedScenario.patientPrompt,
      `Conversation so far:\n${history || ""}\n\nStudent asks patient:\n${studentQuestion}\n\nAnswer only this question as the patient.`
    );

    res.json({ reply });
  } catch (error) {
    console.error("ASK ERROR:", error);
    res.status(500).json({ reply: "Server error contacting AI patient." });
  }
});

app.post("/instructor", async (req, res) => {
  try {
    const { studentQuestion, scenario } = req.body;
    const selectedScenario = getScenario(scenario);

    if (!studentQuestion) return res.status(400).json({ reply: "No instructor question was provided." });

    const reply = await createChatReply(
      selectedScenario.instructorPrompt,
      `Scenario: ${scenario}\nStudent asks instructor: ${studentQuestion}`
    );

    res.json({ reply });
  } catch (error) {
    console.error("INSTRUCTOR ERROR:", error);
    res.status(500).json({ reply: "Instructor server error." });
  }
});

app.post("/voice-ask", upload.single("audio"), async (req, res) => {
  try {
    const scenario = req.body.scenario || "chestPain";
    const history = req.body.history || "";
    const selectedScenario = getScenario(scenario);

    if (!req.file) {
      return res.status(400).json({ transcript: "", reply: "No audio file was received." });
    }

    const studentQuestion = await transcribeUploadedAudio(req.file);

    if (!studentQuestion.trim()) {
      return res.json({ transcript: "", reply: "I could not hear the question clearly." });
    }

    const reply = await createChatReply(
      selectedScenario.patientPrompt,
      `Conversation so far:\n${history}\n\nStudent asks patient:\n${studentQuestion}\n\nAnswer only this question as the patient.`
    );

    res.json({ transcript: studentQuestion, reply });
  } catch (error) {
    console.error("VOICE ASK ERROR:", error);
    if (req.file && req.file.path && fs.existsSync(req.file.path)) fs.unlink(req.file.path, () => {});
    res.status(500).json({ transcript: "", reply: "Voice patient server error. Check Render logs and OPENAI_API_KEY." });
  }
});

app.post("/voice-instructor", upload.single("audio"), async (req, res) => {
  try {
    const scenario = req.body.scenario || "chestPain";
    const selectedScenario = getScenario(scenario);

    if (!req.file) {
      return res.status(400).json({ transcript: "", reply: "No audio file was received." });
    }

    const instructorQuestion = await transcribeUploadedAudio(req.file);

    if (!instructorQuestion.trim()) {
      return res.json({ transcript: "", reply: "I could not hear the instructor question clearly." });
    }

    const reply = await createChatReply(
      selectedScenario.instructorPrompt,
      `Scenario: ${scenario}\nStudent asks instructor: ${instructorQuestion}`
    );

    res.json({ transcript: instructorQuestion, reply });
  } catch (error) {
    console.error("VOICE INSTRUCTOR ERROR:", error);
    if (req.file && req.file.path && fs.existsSync(req.file.path)) fs.unlink(req.file.path, () => {});
    res.status(500).json({ transcript: "", reply: "Voice instructor server error. Check Render logs and OPENAI_API_KEY." });
  }
});

app.post("/transcribe-only", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ transcript: "" });
    const transcript = await transcribeUploadedAudio(req.file);
    res.json({ transcript });
  } catch (error) {
    console.error("TRANSCRIBE ONLY ERROR:", error);
    if (req.file && req.file.path && fs.existsSync(req.file.path)) fs.unlink(req.file.path, () => {});
    res.status(500).json({ transcript: "" });
  }
});

app.post("/patient-voice", async (req, res) => {
  try {
    const { text, scenario } = req.body;
    const selectedScenario = getScenario(scenario);

    if (!text) return res.status(400).json({ error: "No text provided." });

    const buffer = await createSpeechAudio(
      text,
      selectedScenario.patientVoice,
      selectedScenario.patientVoiceInstructions
    );

    res.set({ "Content-Type": "audio/mpeg", "Content-Length": buffer.length });
    res.send(buffer);
  } catch (error) {
    console.error("PATIENT VOICE ERROR:", error);
    res.status(500).json({ error: "Patient voice generation failed." });
  }
});

app.post("/instructor-voice", async (req, res) => {
  try {
    const { text, scenario } = req.body;
    const selectedScenario = getScenario(scenario);

    if (!text) return res.status(400).json({ error: "No text provided." });

    const buffer = await createSpeechAudio(
      text,
      selectedScenario.instructorVoice,
      selectedScenario.instructorVoiceInstructions
    );

    res.set({ "Content-Type": "audio/mpeg", "Content-Length": buffer.length });
    res.send(buffer);
  } catch (error) {
    console.error("INSTRUCTOR VOICE ERROR:", error);
    res.status(500).json({ error: "Instructor voice generation failed." });
  }
});

app.post("/grade", async (req, res) => {
  try {
    const { studentAnswer, treatmentPlan, scenario } = req.body;
    const selectedScenario = getScenario(scenario);

    const checklist = deterministicChecklist(studentAnswer, treatmentPlan);
    const completed = checklist.filter(c => c.pass).length;
    const score = `${completed}/${checklist.length}`;
    const checklistText = checklist.map(item => `${item.pass ? "[✓]" : "[ ]"} ${item.name}`).join("\n");

    const gradingPrompt = `
You are grading a Connecticut EMT Medical Assessment psychomotor examination.

Use this checklist exactly. Do not change the check marks.

CTOEMS / CT DPH-Style EMT Medical Assessment Checklist

${checklistText}

Score:
${score}

Scenario:
${selectedScenario.title}

Patient/instructor conversation:
${studentAnswer || ""}

Treatment plan:
${treatmentPlan || ""}

Below the checklist include:

Critical Criteria
Items Missed
Instructor Comments
Overall Result (PASS or FAIL)

Use this rule:
- PASS only if at least 10 of ${checklist.length} checklist items are completed and there are no major critical criteria.
- FAIL if airway, breathing, circulation, vital signs, or reassessment are missed.
`;

    const feedback = await createChatReply(
      "You are a strict but helpful EMT instructor. Give clear, practical checklist-style feedback.",
      gradingPrompt
    );

    res.json({ feedback });
  } catch (error) {
    console.error("GRADE ERROR:", error);
    res.status(500).json({ feedback: "Grading server error." });
  }
});

app.listen(PORT, () => {
  console.log(`EMT simulator running on port ${PORT}`);
});
