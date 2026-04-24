import express from "express";
import OpenAI from "openai";

const app = express();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.use(express.json());
app.use(express.static("public"));

app.post("/ask", async (req, res) => {
  try {
    const { studentQuestion, history } = req.body;

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: `
You are roleplaying as a patient in an EMT training scenario.

Scenario:
You are a 58-year-old male with chest pain. You are pale and sweaty.

Patient details:
- Chest pain started about 30 minutes ago
- Pain feels like pressure
- Pain is in the center of the chest
- Pain radiates to the left arm
- You feel short of breath
- You feel nauseated
- You have high blood pressure
- You take blood pressure medication
- You have no known drug allergies

Rules:
- Answer ONLY as the patient
- Keep answers short and realistic
- Do not teach
- Do not give medical advice
- Only answer what the student asks

Conversation so far:
${history || "None"}

Student asks:
${studentQuestion}

Patient response:
`
    });

    res.json({ reply: response.output_text });
  } catch (err) {
    console.error("ASK ERROR:", err);

    res.status(500).json({
      reply: "Server error. Check Render logs."
    });
  }
});

app.post("/grade", async (req, res) => {
  try {
    const { studentAnswer } = req.body;

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: `
You are an EMT instructor.

Scenario:
58-year-old male with chest pain. Pale and sweaty.

Student interaction:
${studentAnswer}

Give feedback:
- What they did right
- What they missed
- Correct treatment
- Score /10
`
    });

    res.json({ feedback: response.output_text });
  } catch (err) {
    console.error("GRADE ERROR:", err);

    res.status(500).json({
      feedback: "Server error. Check Render logs."
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
