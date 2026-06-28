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

app.use(express.json());
app.use(express.static("public"));

const scenarios = {
  chestPain: `
You are a 58-year-old male patient with chest pain.
You are anxious but cooperative.
You have pressure in the center of your chest.
The pain started about 20 minutes ago while carrying groceries.
The pain radiates to your left arm.
You feel nauseated and short of breath.
You have high blood pressure and high cholesterol.
You take lisinopril and atorvastatin.
You are allergic to penicillin.
Only answer as the patient.
Keep answers short and realistic.
`
};

app.post("/ask", async (req, res) => {
  try {
    const { studentQuestion, history, scenario } = req.body;
    const scenarioText = scenarios[scenario] || scenarios.chestPain;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: scenarioText },
        {
          role: "user",
          content: `Conversation so far:\n${history || ""}\nStudent asks: ${studentQuestion}`
        }
      ]
    });

    res.json({ reply: completion.choices[0].message.content });

  } catch (error) {
    console.error("ASK ERROR:", error);
    res.status(500).json({ reply: "Server error contacting AI patient." });
  }
});

app.post("/voice-ask", upload.single("audio"), async (req, res) => {
  let originalPath = null;
  let audioPathWithExtension = null;

  try {
    const scenario = req.body.scenario || "chestPain";
    const history = req.body.history || "";
    const scenarioText = scenarios[scenario] || scenarios.chestPain;

    if (!req.file) {
      return res.status(400).json({
        transcript: "",
        reply: "No audio file was received."
      });
    }

    originalPath = req.file.path;

    let extension = ".webm";

    if (req.file.originalname) {
      const originalExtension = path.extname(req.file.originalname).toLowerCase();
      if ([".mp3", ".mp4", ".mpeg", ".mpga", ".m4a", ".wav", ".webm"].includes(originalExtension)) {
        extension = originalExtension;
      }
    }

    if (req.file.mimetype) {
      if (req.file.mimetype.includes("mp4")) extension = ".mp4";
      if (req.file.mimetype.includes("mpeg")) extension = ".mp3";
      if (req.file.mimetype.includes("wav")) extension = ".wav";
      if (req.file.mimetype.includes("webm")) extension = ".webm";
    }

    audioPathWithExtension = `${originalPath}${extension}`;
    fs.renameSync(originalPath, audioPathWithExtension);

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioPathWithExtension),
      model: "whisper-1"
    });

    const studentQuestion = transcription.text || "";

    fs.unlink(audioPathWithExtension, () => {});

    if (!studentQuestion.trim()) {
      return res.json({
        transcript: "",
        reply: "I could not hear the question clearly."
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: scenarioText },
        {
          role: "user",
          content: `Conversation so far:\n${history || ""}\nStudent asks: ${studentQuestion}`
        }
      ]
    });

    res.json({
      transcript: studentQuestion,
      reply: completion.choices[0].message.content
    });

  } catch (error) {
    console.error("VOICE ASK ERROR:", error);

    if (originalPath && fs.existsSync(originalPath)) fs.unlink(originalPath, () => {});
    if (audioPathWithExtension && fs.existsSync(audioPathWithExtension)) fs.unlink(audioPathWithExtension, () => {});

    res.status(500).json({
      transcript: "",
      reply: "Voice server error. Check Render logs and OPENAI_API_KEY."
    });
  }
});

app.post("/patient-voice", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "No text provided." });
    }

    const audio = await openai.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "onyx",
      input: text,
      instructions:
        "Use a deep adult male voice. Speak slowly, anxiously, and slightly short of breath like a 58-year-old man having chest pain."
    });

    const buffer = Buffer.from(await audio.arrayBuffer());

    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Length": buffer.length
    });

    res.send(buffer);

  } catch (error) {
    console.error("PATIENT VOICE ERROR:", error);
    res.status(500).json({ error: "Patient voice generation failed." });
  }
});

app.post("/instructor", async (req, res) => {
  try {
    const { studentQuestion, scenario } = req.body;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: "You are an EMT instructor. Answer briefly and directly for a skills simulation."
        },
        {
          role: "user",
          content: `Scenario: ${scenario}\nStudent asks: ${studentQuestion}`
        }
      ]
    });

    res.json({ reply: completion.choices[0].message.content });

  } catch (error) {
    console.error("INSTRUCTOR ERROR:", error);
    res.status(500).json({ reply: "Instructor server error." });
  }
});

app.post("/grade", async (req, res) => {
  try {
    const { studentAnswer, treatmentPlan, scenario } = req.body;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "You are grading an EMT chest pain psychomotor simulation. Give clear feedback with strengths, missed critical items, and improvement steps."
        },
        {
          role: "user",
          content: `Scenario: ${scenario}

Patient questions/history:
${studentAnswer || ""}

Treatment plan:
${treatmentPlan || ""}`
        }
      ]
    });

    res.json({ feedback: completion.choices[0].message.content });

  } catch (error) {
    console.error("GRADE ERROR:", error);
    res.status(500).json({ feedback: "Grading server error." });
  }
});

app.listen(PORT, () => {
  console.log(`EMT simulator running on port ${PORT}`);
});
