import express from "express";
import multer from "multer";
import fs from "fs";
import OpenAI from "openai";

const app = express();
const upload = multer({ dest: "uploads/" });
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

const scenarios = {
  chestPain: `
You are a 58-year-old male patient with chest pain.
You are anxious but cooperative.
You have pressure in the center of your chest.
The pain started about 20 minutes ago while carrying groceries.
The pain radiates to your left arm.
You feel nauseated and short of breath.
You have a history of high blood pressure and high cholesterol.
You take lisinopril and atorvastatin.
You are allergic to penicillin.
Only answer as the patient.
Do not give instructor advice.
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
        { role: "user", content: `Conversation so far:\n${history || ""}\nStudent asks: ${studentQuestion}` }
      ]
    });

    res.json({
      reply: completion.choices[0].message.content
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ reply: "Server error contacting AI patient." });
  }
});

app.post("/voice-ask", upload.single("audio"), async (req, res) => {
  let audioPath = null;
  let fixedAudioPath = null;

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

    audioPath = req.file.path;

    let ext = ".webm";

    if (req.file.mimetype.includes("mp4")) {
      ext = ".mp4";
    } else if (req.file.mimetype.includes("mpeg")) {
      ext = ".mp3";
    } else if (req.file.mimetype.includes("wav")) {
      ext = ".wav";
    } else if (req.file.mimetype.includes("webm")) {
      ext = ".webm";
    }

    fixedAudioPath = audioPath + ext;

    fs.renameSync(audioPath, fixedAudioPath);

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(fixedAudioPath),
      model: "whisper-1"
    });

    const studentQuestion = transcription.text || "";

    fs.unlink(fixedAudioPath, () => {});

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
          content: `Conversation so far:\n${history}\nStudent asks: ${studentQuestion}`
        }
      ]
    });

    res.json({
      transcript: studentQuestion,
      reply: completion.choices[0].message.content
    });

  } catch (error) {
    console.error(error);

    if (audioPath) fs.unlink(audioPath, () => {});
    if (fixedAudioPath) fs.unlink(fixedAudioPath, () => {});

    res.status(500).json({
      transcript: "",
      reply: "Voice server error. Check Render logs and OPENAI_API_KEY."
    });
  }
});
    }

    const audioPath = req.file.path;

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: "gpt-4o-mini-transcribe"
    });

    const studentQuestion = transcription.text || "";

    fs.unlink(audioPath, () => {});

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
        { role: "user", content: `Conversation so far:\n${history}\nStudent asks: ${studentQuestion}` }
      ]
    });

    res.json({
      transcript: studentQuestion,
      reply: completion.choices[0].message.content
    });

  } catch (error) {
    console.error(error);

    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }

    res.status(500).json({
      transcript: "",
      reply: "Voice server error. Check Render logs and OPENAI_API_KEY."
    });
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
          content:
            "You are an EMT instructor. Answer briefly and directly for a skills simulation."
        },
        {
          role: "user",
          content: `Scenario: ${scenario}\nStudent asks: ${studentQuestion}`
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
          content: `Scenario: ${scenario}\n\nPatient questions/history:\n${studentAnswer}\n\nTreatment plan:\n${treatmentPlan}`
        }
      ]
    });

    res.json({
      feedback: completion.choices[0].message.content
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ feedback: "Grading server error." });
  }
});

app.listen(PORT, () => {
  console.log(`EMT simulator running on port ${PORT}`);
});
