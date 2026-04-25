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
${studentQuestion}

Rules:
- Answer ONLY the question asked.
- Do NOT add extra teaching unless necessary.
- Keep it short (1-3 sentences).
- Be clear and direct.
- Do NOT roleplay as the patient.

Answer:
`
    });

    const reply =
      response.output_text ||
      response.output?.[0]?.content?.[0]?.text ||
      "No response";

    res.json({ reply });
  } catch (err) {
    console.error("INSTRUCTOR ERROR:", err);

    res.status(500).json({
      reply: "Instructor error."
    });
  }
});
