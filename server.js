import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import OpenAI from "openai";

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
  patientPrompt: `
You are a 58-year-old male patient with chest pain.

VERY IMPORTANT:
Only answer the specific question the EMT asks.
Do NOT volunteer additional information unless the EMT asks.
Do NOT give your entire history at once.
Keep answers short, like a real patient.

Patient information:

Chief Complaint:
• Pressure in the center of your chest.

OPQRST

Onset:
• Started about 20 minutes ago while carrying groceries.

Provocation:
• Gets worse when walking.
• Gets a little better sitting still.

Quality:
• Heavy pressure.
• "Feels like someone is sitting on my chest."

Radiation:
• Down the left arm.
• Into the jaw.

Severity:
• 8 out of 10.

Time:
• Constant since it began.

SAMPLE

Signs/Symptoms
• Chest pressure
• Shortness of breath
• Nausea
• Sweating
• Pale skin

Allergies
• Penicillin

Medications
• Lisinopril
• Atorvastatin

Past Medical History
• Hypertension
• High cholesterol

Last Oral Intake
• Ate breakfast around 7 AM.

Events
• Carrying groceries into the house.

Additional Findings

If asked:
"Any previous heart attacks?"
Answer:
"No."

If asked:
"Any cardiac surgeries?"
Answer:
"No."

If asked:
"Have you taken aspirin today?"
Answer:
"No."

If asked:
"Can I give you aspirin?"
Answer:
"Yes."

If asked:
"Can you breathe?"
Answer:
"I'm a little short of breath."

If asked:
"Any nitroglycerin?"
Answer:
"No."

Rules

Only answer what was asked.

Examples:

Q: Where is your pain?
A: "Right in the middle of my chest."

Q: Does it go anywhere?
A: "Yes, down my left arm."

Q: How bad is it?
A: "About an eight."

Q: When did it start?
A: "About twenty minutes ago."

Q: Are you allergic to anything?
A: "Penicillin."

Q: What medicines do you take?
A: "Lisinopril and atorvastatin."

Q: Do you have any medical problems?
A: "High blood pressure and high cholesterol."

Never volunteer answers to questions that were not asked.

Never act like the instructor.

Never explain EMT treatment.

Always respond like an actual patient would.
`,
`,
    instructorPrompt: `
You are an EMT instructor running a chest pain psychomotor simulation.
Answer briefly and directly.
Give assessment findings only when the student asks appropriate questions.
Do not coach unless the student specifically asks for help.
Use realistic EMT skill-station findings.
`,
    patientVoice: "onyx",
    patientVoiceInstructions:
      "Use a deep adult male voice. Speak slowly, anxiously, and slightly short of breath like a 58-year-old man having chest pain.",
    instructorVoice: "sage",
    instructorVoiceInstructions:
      "Use a calm professional EMT instructor voice. Speak clearly and briefly."
  },

  sob: {
    patientPrompt: `
You are a 67-year-old female patient with shortness of breath.
You have COPD.
You are sitting forward and speaking in short sentences.
You have wheezing and feel very short of breath.
You used your inhaler twice with little relief.
You deny chest pain.
You have a productive cough.
Only answer as the patient.
Keep answers short and realistic.
`,
    instructorPrompt:
      "You are an EMT instructor running a shortness of breath scenario. Give findings only when asked.",
    patientVoice: "coral",
    patientVoiceInstructions:
      "Use an older female voice. Speak with mild respiratory distress and short phrases.",
    instructorVoice: "sage",
    instructorVoiceInstructions:
      "Use a calm professional EMT instructor voice. Speak clearly and briefly."
  },

  stroke: {
    patientPrompt: `
You are a 72-year-old male patient with possible stroke symptoms.
You have right-sided weakness and slurred speech.
Symptoms started about 20 minutes ago.
You are confused and frustrated.
Only answer as the patient.
Use short answers with mild slurring described in words.
`,
    instructorPrompt:
      "You are an EMT instructor running a stroke scenario. Give findings only when asked.",
    patientVoice: "echo",
    patientVoiceInstructions:
      "Use an older male voice. Speak slowly with slight difficulty forming words.",
    instructorVoice: "sage",
    instructorVoiceInstructions:
      "Use a calm professional EMT instructor voice. Speak clearly and briefly."
  },

  diabetic: {
    patientPrompt: `
You are a diabetic patient with altered mental status.
You are confused, sweaty, and weak.
You have not eaten today.
You take insulin.
Only answer as the patient.
Keep answers short and confused.
`,
    instructorPrompt:
      "You are an EMT instructor running a diabetic emergency scenario. Give findings only when asked.",
    patientVoice: "ash",
    patientVoiceInstructions:
      "Use a weak, confused adult voice. Speak slowly and softly.",
    instructorVoice: "sage",
    instructorVoiceInstructions:
      "Use a calm professional EMT instructor voice. Speak clearly and briefly."
  }
};

function getScenario(scenarioName) {
  return scenarios[scenarioName] || scenarios.chestPain;
}

function getAudioExtension(file) {
  let extension = ".webm";

  if (file.originalname) {
    const originalExtension = path.extname(file.originalname).toLowerCase();

    if (
      [".mp3", ".mp4", ".mpeg", ".mpga", ".m4a", ".wav", ".webm"].includes(
        originalExtension
      )
    ) {
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

app.post("/ask", async (req, res) => {
  try {
    const { studentQuestion, history, scenario } = req.body;
    const selectedScenario = getScenario(scenario);

    if (!studentQuestion) {
      return res.status(400).json({
        reply: "No question was provided."
      });
    }

    const reply = await createChatReply(
      selectedScenario.patientPrompt,
      `Conversation so far:\n${history || ""}\nStudent asks patient: ${studentQuestion}`
    );

    res.json({ reply });
  } catch (error) {
    console.error("ASK ERROR:", error);
    res.status(500).json({
      reply: "Server error contacting AI patient."
    });
  }
});

app.post("/instructor", async (req, res) => {
  try {
    const { studentQuestion, scenario } = req.body;
    const selectedScenario = getScenario(scenario);

    if (!studentQuestion) {
      return res.status(400).json({
        reply: "No instructor question was provided."
      });
    }

    const reply = await createChatReply(
      selectedScenario.instructorPrompt,
      `Scenario: ${scenario}\nStudent asks instructor: ${studentQuestion}`
    );

    res.json({ reply });
  } catch (error) {
    console.error("INSTRUCTOR ERROR:", error);
    res.status(500).json({
      reply: "Instructor server error."
    });
  }
});

app.post("/voice-ask", upload.single("audio"), async (req, res) => {
  try {
    const scenario = req.body.scenario || "chestPain";
    const history = req.body.history || "";
    const selectedScenario = getScenario(scenario);

    if (!req.file) {
      return res.status(400).json({
        transcript: "",
        reply: "No audio file was received."
      });
    }

    const studentQuestion = await transcribeUploadedAudio(req.file);

    if (!studentQuestion.trim()) {
      return res.json({
        transcript: "",
        reply: "I could not hear the question clearly."
      });
    }

    const reply = await createChatReply(
      selectedScenario.patientPrompt,
      `Conversation so far:\n${history}\nStudent asks patient: ${studentQuestion}`
    );

    res.json({
      transcript: studentQuestion,
      reply
    });
  } catch (error) {
    console.error("VOICE ASK ERROR:", error);

    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlink(req.file.path, () => {});
    }

    res.status(500).json({
      transcript: "",
      reply: "Voice patient server error. Check Render logs and OPENAI_API_KEY."
    });
  }
});

app.post("/voice-instructor", upload.single("audio"), async (req, res) => {
  try {
    const scenario = req.body.scenario || "chestPain";
    const selectedScenario = getScenario(scenario);

    if (!req.file) {
      return res.status(400).json({
        transcript: "",
        reply: "No audio file was received."
      });
    }

    const instructorQuestion = await transcribeUploadedAudio(req.file);

    if (!instructorQuestion.trim()) {
      return res.json({
        transcript: "",
        reply: "I could not hear the instructor question clearly."
      });
    }

    const reply = await createChatReply(
      selectedScenario.instructorPrompt,
      `Scenario: ${scenario}\nStudent asks instructor: ${instructorQuestion}`
    );

    res.json({
      transcript: instructorQuestion,
      reply
    });
  } catch (error) {
    console.error("VOICE INSTRUCTOR ERROR:", error);

    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlink(req.file.path, () => {});
    }

    res.status(500).json({
      transcript: "",
      reply: "Voice instructor server error. Check Render logs and OPENAI_API_KEY."
    });
  }
});

app.post("/patient-voice", async (req, res) => {
  try {
    const { text, scenario } = req.body;
    const selectedScenario = getScenario(scenario);

    if (!text) {
      return res.status(400).json({
        error: "No text provided."
      });
    }

    const buffer = await createSpeechAudio(
      text,
      selectedScenario.patientVoice,
      selectedScenario.patientVoiceInstructions
    );

    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Length": buffer.length
    });

    res.send(buffer);
  } catch (error) {
    console.error("PATIENT VOICE ERROR:", error);
    res.status(500).json({
      error: "Patient voice generation failed."
    });
  }
});

app.post("/instructor-voice", async (req, res) => {
  try {
    const { text, scenario } = req.body;
    const selectedScenario = getScenario(scenario);

    if (!text) {
      return res.status(400).json({
        error: "No text provided."
      });
    }

    const buffer = await createSpeechAudio(
      text,
      selectedScenario.instructorVoice,
      selectedScenario.instructorVoiceInstructions
    );

    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Length": buffer.length
    });

    res.send(buffer);
  } catch (error) {
    console.error("INSTRUCTOR VOICE ERROR:", error);
    res.status(500).json({
      error: "Instructor voice generation failed."
    });
  }
});

app.post("/grade", async (req, res) => {
  try {
    const { studentAnswer, treatmentPlan, scenario } = req.body;

    const selectedScenario = getScenario(scenario);

    const gradingPrompt = `
You are grading an EMT psychomotor simulation.

Scenario:
${scenario}

Scenario details:
${selectedScenario.patientPrompt}

Patient/instructor conversation:
${studentAnswer || ""}

Treatment plan:
${treatmentPlan || ""}

Grade the student in this format:

Strengths:
- 

Missed or weak items:
- 

Critical actions:
- Scene safety/BSI
- Primary assessment
- OPQRST
- SAMPLE
- Vital signs
- Appropriate oxygen/ventilation decision
- Aspirin consideration if chest pain and not contraindicated
- ALS/transport decision
- Reassessment

Overall feedback:
`;

    const feedback = await createChatReply(
      "You are a strict but helpful EMT instructor. Give clear, practical feedback.",
      gradingPrompt
    );

    res.json({ feedback });
  } catch (error) {
    console.error("GRADE ERROR:", error);
    res.status(500).json({
      feedback: "Grading server error."
    });
  }
});

app.listen(PORT, () => {
  console.log(`EMT simulator running on port ${PORT}`);
});
