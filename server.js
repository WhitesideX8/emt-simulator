import express from "express";
import OpenAI from "openai";

const app = express();
const client = new OpenAI();

app.use(express.json());
app.use(express.static("public"));

app.post("/grade", async (req, res) => {
  try {
    const { studentAnswer } = req.body;

    const response = await client.responses.create({
      model: "gpt-4o-mini",
      input: `
You are an EMT instructor.

Scenario:
Chest pain patient, pale, sweaty.

Student answer:
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
    res.json({ feedback: "Error getting response." });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
