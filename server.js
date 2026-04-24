import express from "express";
import OpenAI from "openai";

const app = express();
const client = new OpenAI();

app.use(express.json());
app.use(express.static("public"));

/* =========================
   🧠 PATIENT SIMULATION
   ========================= */
app.post("/ask", async (req, res) => {
  try {
    const { studentQuestion, history } = req.body;

    const response = await client.responses.create({
      model: "gpt-5.3",
      input: `
You are roleplaying as a patient in an EMT scenario.

Scenario:
You are a 58-year-old male with chest pain. You are pale and sweaty.

Rules:
- Answer ONLY as the patient
- Do NOT give medical advice
- Do NOT act like a teacher
- Keep answers short and realistic
- Only give information if directly asked
- If the student hasn't asked, don't volunteer it
- Stay consistent with previous answers

Conversation so far:
${history || "None"}

Student asks:
${studentQuestion}

Patient response:
`
    });

    res.json({ reply: response.output_text });
  } catch (err) {
    console.error(err);
    res.json({ reply: "Error getting patient response." });
  }
});

/* =========================
   📊 GRADING MODE
   ========================= */
app.post("/grade", async (req, res) => {
  try {
    const { studentAnswer } = req.body;

    const response = await client.responses.create({
      model: "gpt-5.3",
      input: `
You are an EMT instructor evaluating a student.

Scenario:
Chest pain patient, pale, sweaty.

Student answer:
${studentAnswer}

Give feedback in this format:

### Feedback on Student Response

**What They Did Right:**
- 

**What They Missed:**
- 

**Correct Treatment:**
1.
2.
3.

**Score: X/10**
`
    });

    res.json({ feedback: response.output_text });
  } catch (err) {
    console.error(err);
    res.json({ feedback: "Error getting response." });
  }
});

/* =========================
   🚀 START SERVER
   ========================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
