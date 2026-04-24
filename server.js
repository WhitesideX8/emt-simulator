import express from "express";
import OpenAI from "openai";

const app = express();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.use(express.json());
app.use(express.static("public"));

const scenarios = {
  chestPain: `
You are a 58-year-old male with chest pain. You are pale and sweaty.
Chest pain started about 30 minutes ago.
Pain feels like pressure in the center of your chest.
Pain radiates to your left arm.
You feel short of breath and nauseated.
History: high blood pressure and high cholesterol.
Medication: blood pressure medication.
Allergies: no known drug allergies.
`,

  shortnessOfBreath: `
You are a 67-year-old female having trouble breathing.
You are sitting upright and speaking in short sentences.
Breathing got worse this morning.
You have a history of COPD.
You use an inhaler.
You have a cough.
You deny chest pain.
Allergies: no known drug allergies.
`,

  stroke: `
You are a 72-year-old male with sudden right-sided weakness.
Your speech is slurred.
Symptoms started about 20 minutes ago.
You are confused and scared.
History: high blood pressure.
Medication: aspirin.
Allergies: no known drug allergies.
`,

  diabetic: `
You are a 45-year-old female who feels weak, shaky, sweaty, and confused.
You are diabetic.
You took insulin this morning but skipped breakfast.
You feel lightheaded.
You deny chest pain or trouble breathing.
Allergies: no known drug allergies.
`
};

function getText(response) {
  return (
    response.output_text ||
    response.output?.[0]?.content?.[0]?.text ||
    "No response received."
  );
}

app.post("/ask", async (req, res) => {
  try {
    const { studentQuestion, history, scenario } = req.body;

    const selectedScenario = scenarios[scenario] || scenarios.chestPain;

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: `
You are roleplaying as a patient in an EMT training scenario.

Scenario:
${selectedScenario}

Rules:
- Answer ONLY as the patient.
- Keep answers short and realistic.
- Do not teach.
- Do not give medical advice.
- Only answer what the student asks.
- Stay consistent with the selected scenario.
- Do not reveal all scenario information unless asked.

Conversation so far:
${history || "None"}

Student asks:
${studentQuestion}

Patient response:
`
    });

    const reply = getText(response);

    res.json({ reply });
  } catch (err) {
    console.error("ASK ERROR:", err);

    res.status(500).json({
      reply: "Server error. Check Render logs."
    });
  }
});

app.post("/grade", async (req, res) => {
  try {
    const { studentAnswer, scenario } = req.body;

    const selectedScenario = scenarios[scenario] || scenarios.chestPain;

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: `
You are an EMT instructor evaluating a student.

Scenario:
${selectedScenario}

Student interaction:
${studentAnswer}

Grade the student based on EMT patient assessment.

Give feedback in this format:

What they did right:
-

What they missed:
-

Correct treatment:
1.
2.
3.
4.
5.

Score: __/10
`
    });

    const feedback = getText(response);

    res.json({ feedback });
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
