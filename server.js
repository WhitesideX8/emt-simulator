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

    res.json({ reply: getText(response) });
  } catch (err) {
    console.error("ASK ERROR:", err);
    res.status(500).json({
      reply: "Server error. Check Render logs."
    });
  }
});

app.post("/instructor", async (req, res) => {
  try {
    const { studentQuestion, scenario } = req.body;
    const selectedScenario = scenarios[scenario] || scenarios.chestPain;

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: `
You are an EMT instructor.

Scenario:
${selectedScenario}

Student question:
"${studentQuestion}"

STRICT RULES:
- Answer the exact question only.
- Give a DIRECT answer, not instructions.
- If the question asks for a value such as pulse, blood pressure, respirations, SpO2, glucose, temperature, pain scale, pupils, lung sounds, skin signs, or mental status, give a realistic specific finding.
- If the question asks for a finding, state the finding clearly.
- Do NOT explain unless the student asks "why".
- Keep the answer to ONE short sentence.
- Do NOT roleplay as the patient.

Examples:
Q: What is his radial pulse?
A: His radial pulse is 110, regular.

Q: What is his blood pressure?
A: His blood pressure is 160/92.

Q: What are his respirations?
A: Respirations are 24 and slightly labored.

Q: What is his SpO2?
A: SpO2 is 93% on room air.

Q: What is his blood glucose?
A: His blood glucose is 58 mg/dL.

Answer:
`
    });

    res.json({ reply: getText(response) });
  } catch (err) {
    console.error("INSTRUCTOR ERROR:", err);
    res.status(500).json({
      reply: "Instructor error. Check Render logs."
    });
  }
});

app.post("/treatment", async (req, res) => {
  try {
    const { scenario } = req.body;
    const selectedScenario = scenarios[scenario] || scenarios.chestPain;

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: `
You are an EMT instructor.

Scenario:
${selectedScenario}

Give the appropriate EMT treatment plan.

Rules:
- EMT level only.
- Use short numbered steps.
- Include assessment, immediate care, transport, and reassessment.
- Be direct and practical.
- Do not include advanced ALS-only treatments.

Treatment plan:
`
    });

    res.json({ treatment: getText(response) });
  } catch (err) {
    console.error("TREATMENT ERROR:", err);
    res.status(500).json({
      treatment: "Treatment error. Check Render logs."
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

    res.json({ feedback: getText(response) });
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
