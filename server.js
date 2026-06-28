import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import OpenAI from "openai";
import { fileURLToPath } from "url";

const app = express();
const upload = multer({ dest: "uploads/" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const scenarios = {
  chestPain: {
    name: "Chest Pain",
    patient:
      "You are a 58-year-old male with chest pressure radiating to the left arm. You feel short of breath and nauseated. You have high blood pressure and high cholesterol.",
    patientNeedsOxygen: true,
    patientCritical: true,
    expectedTreatment: [
      "oxygen",
      "aspirin",
      "vitals",
      "transport",
      "als",
      "cardiac monitor",
      "nitro"
    ]
  }
};

function includesAny(text, words) {
  return words.some(word => text.includes(word));
}

function ctPsychomotorGrade(history, treatmentPlan, scenarioName) {
  const scenario = scenarios[scenarioName] || scenarios.chestPain;
  const text = `${history}\n${treatmentPlan}`.toLowerCase();

  const sections = {
    sceneSizeUp: { earned: 0, possible: 6, items: [] },
    primaryAssessment: { earned: 0, possible: 10, items: [] },
    history: { earned: 0, possible: 10, items: [] },
    secondaryAssessment: { earned: 0, possible: 5, items: [] },
    vitals: { earned: 0, possible: 5, items: [] },
    treatment: { earned: 0, possible: 7, items: [] },
    reassessment: { earned: 0, possible: 4, items: [] }
  };

  const criticalFailures = [];

  function check(section, label, words, points = 1) {
    const passed = includesAny(text, words);

    sections[section].items.push({
      label,
      passed,
      points
    });

    if (passed) {
      sections[section].earned += points;
    }
  }

  // Scene Size-Up
  check("sceneSizeUp", "BSI / PPE", ["bsi", "ppe", "gloves", "body substance"]);
  check("sceneSizeUp", "Scene safety", ["scene safe", "scene is safe", "safe scene"]);
  check("sceneSizeUp", "Nature of illness", ["noi", "nature of illness", "medical complaint"]);
  check("sceneSizeUp", "Number of patients", ["number of patients", "one patient", "only one patient"]);
  check("sceneSizeUp", "Additional resources", ["als", "paramedic", "additional resources", "backup"]);
  check("sceneSizeUp", "Considers spinal precautions", ["spinal", "c-spine", "neck pain", "trauma ruled out"]);

  // Primary Assessment
  check("primaryAssessment", "General impression", ["general impression", "sick", "not sick", "appears"]);
  check("primaryAssessment", "Level of consciousness / AVPU", ["avpu", "alert", "verbal", "painful", "unresponsive", "loc"]);
  check("primaryAssessment", "Chief complaint", ["chief complaint", "complaint", "chest pain", "pain"]);
  check("primaryAssessment", "Airway assessed", ["airway"]);
  check("primaryAssessment", "Breathing assessed", ["breathing", "respirations", "respiratory"]);
  check("primaryAssessment", "Circulation assessed", ["pulse", "circulation"]);
  check("primaryAssessment", "Skin assessed", ["skin", "pale", "cool", "diaphoretic"]);
  check("primaryAssessment", "Oxygen considered/provided", ["oxygen", "o2", "nasal cannula", "nonrebreather"]);
  check("primaryAssessment", "Patient priority", ["priority", "high priority", "unstable", "stable"]);
  check("primaryAssessment", "Transport decision", ["transport", "hospital", "load and go"]);

  // History
  check("history", "OPQRST", ["opqrst", "onset", "provocation", "quality", "radiation", "severity", "time"]);
  check("history", "SAMPLE", ["sample", "signs", "symptoms", "allergies", "medications", "past medical"]);
  check("history", "Allergies", ["allergies", "allergic"]);
  check("history", "Medications", ["medications", "meds", "prescriptions"]);
  check("history", "Past medical history", ["past medical", "history", "hypertension", "high blood pressure"]);
  check("history", "Last oral intake", ["last oral", "last ate", "last meal"]);
  check("history", "Events leading up", ["events", "what happened", "leading up"]);
  check("history", "Pain onset", ["onset", "started", "began"]);
  check("history", "Pain radiation", ["radiates", "radiating", "left arm", "jaw", "back"]);
  check("history", "Pain severity", ["severity", "scale", "0-10", "1-10", "pain level"]);

  // Secondary Assessment
  check("secondaryAssessment", "Focused exam", ["focused exam", "secondary assessment", "chest exam"]);
  check("secondaryAssessment", "Lung sounds", ["lung sounds", "breath sounds", "clear", "wheezes", "crackles"]);
  check("secondaryAssessment", "Cardiac-related assessment", ["cardiac", "heart", "chest"]);
  check("secondaryAssessment", "Checks for associated symptoms", ["nausea", "shortness of breath", "sob", "sweating", "diaphoretic"]);
  check("secondaryAssessment", "Pertinent negatives", ["denies", "no trauma", "no allergies", "no shortness"]);

  // Vitals
  check("vitals", "Blood pressure", ["blood pressure", "bp"]);
  check("vitals", "Pulse", ["pulse", "heart rate"]);
  check("vitals", "Respirations", ["respirations", "respiratory rate", "breathing rate"]);
  check("vitals", "SpO2", ["spo2", "pulse ox", "oxygen saturation"]);
  check("vitals", "Repeats vitals", ["repeat vitals", "reassess vitals", "ongoing vitals"]);

  // Treatment
  check("treatment", "Oxygen therapy", ["oxygen", "o2", "nasal cannula", "nonrebreather"]);
  check("treatment", "Aspirin considered/given", ["aspirin", "asa"]);
  check("treatment", "Nitroglycerin considered/assisted if prescribed", ["nitro", "nitroglycerin"]);
  check("treatment", "Rapid transport", ["transport", "hospital", "emergency department", "ed"]);
  check("treatment", "ALS intercept requested", ["als", "paramedic", "intercept"]);
  check("treatment", "Position of comfort", ["position of comfort", "semi-fowler", "sitting"]);
  check("treatment", "Continued monitoring", ["monitor", "reassess", "cardiac monitor"]);

  // Reassessment
  check("reassessment", "Reassesses airway", ["reassess airway", "airway reassessment"]);
  check("reassessment", "Reassesses breathing", ["reassess breathing", "breathing reassessment"]);
  check("reassessment", "Reassesses circulation", ["reassess circulation", "pulse reassessment"]);
  check("reassessment", "Gives verbal report", ["verbal report", "handoff", "report to hospital"]);

  // Critical Criteria
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
    criticalFailures.push("Failure to provide or consider oxygen for a patient with chest pain/SOB.");
  }

  if (
    scenario.patientCritical &&
    !includesAny(text, ["transport", "hospital", "load and go", "emergency department"])
  ) {
    criticalFailures.push("Failure to make an appropriate transport decision.");
  }

  if (includesAny(text, ["refuse transport", "leave patient", "no transport needed"])) {
    criticalFailures.push("Dangerous decision: student indicated no transport for possible cardiac chest pain.");
  }

  let totalEarned = 0;
  let totalPossible = 0;

  Object.values(sections).forEach(section => {
    totalEarned += section.earned;
    totalPossible += section.possible;
  });

  const percent = Math.round((totalEarned / totalPossible) * 100);
  const minimumPassingPercent = 78;

  const pass =
    criticalFailures.length === 0 &&
    percent >= minimumPassingPercent;

  return {
    scenario: scenario.name,
    sections,
    criticalFailures,
    totalEarned,
    totalPossible,
    percent,
    minimumPassingPercent,
    result: pass ? "PASS" : "FAIL"
  };
}

function formatScoreReport(grade, aiFeedback) {
  function sectionLine(title, section) {
    return `${title}: ${section.earned}/${section.possible}`;
  }

  const criticalText =
    grade.criticalFailures.length === 0
      ? "No Critical Criteria failures."
      : grade.criticalFailures.map(f => `✘ ${f}`).join("\n");

  return `
CT OEMS-STYLE PSYCHOMOTOR EVALUATION
Scenario: ${grade.scenario}

RESULT: ${grade.result}

Critical Criteria:
${criticalText}

Skill Sheet Score:
${sectionLine("Scene Size-Up", grade.sections.sceneSizeUp)}
${sectionLine("Primary Assessment", grade.sections.primaryAssessment)}
${sectionLine("History Taking", grade.sections.history)}
${sectionLine("Secondary Assessment", grade.sections.secondaryAssessment)}
${sectionLine("Vital Signs", grade.sections.vitals)}
${sectionLine("Treatment", grade.sections.treatment)}
${sectionLine("Reassessment", grade.sections.reassessment)}

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
    const scenarioData = scenarios[scenario] || scenarios.chestPain;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            `You are the patient in an EMT training simulation. 
Answer only as the patient. 
Do not teach. 
Do not give away information unless the EMT asks.
Patient details: ${scenarioData.patient}`
        },
        {
          role: "user",
          content:
            `Conversation so far:\n${history || ""}\n\nStudent asks: ${studentQuestion}`
        }
      ]
    });

    res.json({
      reply: completion.choices[0].message.content
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ reply: "Patient server error." });
  }
});

app.post("/instructor", async (req, res) => {
  try {
    const { studentQuestion, scenario } = req.body;
    const scenarioData = scenarios[scenario] || scenarios.chestPain;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            `You are an EMT instructor. 
Answer clearly and directly.
Keep answers short.
Do not grade unless asked.
Scenario: ${scenarioData.name}`
        },
        {
          role: "user",
          content: studentQuestion
        }
      ]
    });

    res.json({
      reply: completion.choices[0].message.content
    });

  } catch (error) {
    console.error(error);
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

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            `You are an EMT instructor giving feedback after a Connecticut-style EMT psychomotor practice station.

Important rules:
- Do NOT change the score.
- Do NOT decide pass/fail.
- Do NOT invent points.
- Do NOT say this is the official CT OEMS exam.
- Explain what the student did well.
- Explain what the student missed.
- Keep feedback practical and focused.`
        },
        {
          role: "user",
          content:
            `Student conversation history:
${studentAnswer || ""}

Student treatment plan:
${treatmentPlan || ""}

Objective score:
${JSON.stringify(objectiveGrade, null, 2)}

Write instructor feedback only.`
        }
      ]
    });

    const aiFeedback = completion.choices[0].message.content;

    const finalReport = formatScoreReport(objectiveGrade, aiFeedback);

    res.json({
      feedback: finalReport,
      grade: objectiveGrade
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      feedback: "Error grading student."
    });
  }
});

app.post("/voice-ask", upload.single("audio"), async (req, res) => {
  try {
    const audioPath = req.file.path;
    const scenario = req.body.scenario || "chestPain";
    const history = req.body.history || "";
    const scenarioData = scenarios[scenario] || scenarios.chestPain;

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: "whisper-1"
    });

    fs.unlinkSync(audioPath);

    const transcript = transcription.text || "";

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            `You are the patient in an EMT simulation.
Answer only as the patient.
Do not teach.
Do not provide information unless asked.
Patient details: ${scenarioData.patient}`
        },
        {
          role: "user",
          content:
            `Conversation so far:
${history}

Student asks:
${transcript}`
        }
      ]
    });

    res.json({
      transcript,
      reply: completion.choices[0].message.content
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      transcript: "",
      reply: "Voice patient server error."
    });
  }
});

app.post("/voice-instructor", upload.single("audio"), async (req, res) => {
  try {
    const audioPath = req.file.path;
    const scenario = req.body.scenario || "chestPain";
    const scenarioData = scenarios[scenario] || scenarios.chestPain;

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: "whisper-1"
    });

    fs.unlinkSync(audioPath);

    const transcript = transcription.text || "";

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            `You are an EMT instructor.
Answer clearly and directly.
Keep answers short.
Scenario: ${scenarioData.name}`
        },
        {
          role: "user",
          content: transcript
        }
      ]
    });

    res.json({
      transcript,
      reply: completion.choices[0].message.content
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      transcript: "",
      reply: "Voice instructor server error."
    });
  }
});

async function generateVoice(text, res, voiceName) {
  try {
    const speech = await openai.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: voiceName,
      input: text
    });

    const buffer = Buffer.from(await speech.arrayBuffer());

    res.setHeader("Content-Type", "audio/mpeg");
    res.send(buffer);

  } catch (error) {
    console.error(error);
    res.status(500).send("Voice generation failed.");
  }
}

app.post("/patient-voice", async (req, res) => {
  const { text } = req.body;
  await generateVoice(text || "I do not know.", res, "alloy");
});

app.post("/instructor-voice", async (req, res) => {
  const { text } = req.body;
  await generateVoice(text || "Please continue your assessment.", res, "verse");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`EMT simulator running on port ${PORT}`);
});
