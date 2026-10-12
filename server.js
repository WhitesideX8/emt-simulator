async function createChatReply(systemPrompt, userPrompt) {
  const isPatient = /The EMT asks(?: the patient)?:/.test(userPrompt) ||
    /Answer only (?:the current|that) question as the patient/.test(userPrompt);

  const isInstructor = /Student question or action:/.test(userPrompt) ||
    /Respond briefly as the instructor/.test(userPrompt);

  let responseRules = "";

  if (isPatient || isInstructor) {
    responseRules = `
DIRECT RESPONSE RULES:

- Answer only the questions in the student's CURRENT message.
- Do not repeat answers to earlier questions.
- Give the requested fact first.
- Use the shortest natural answer that fully answers the question.
- Usually use one short sentence per requested item.
- If several questions are asked, answer each briefly in the same order.
- Do not add unrelated symptoms, findings, vital signs, history,
  diagnoses, treatment advice, reminders, or follow-up questions.
- Use history only for context and documented actions.
- If a requested fact is unavailable, say so briefly. Do not invent it.
- If a question is ambiguous, ask one short clarification.
`;

    if (isPatient) {
      responseRules += `
PATIENT STYLE:

- Speak naturally in first person.
- Follow the patient's mental status and breathing limitations.
- Answer only the symptom or history questions asked.
- Do not coach or explain treatment.
- Do not provide equipment measurements the patient would not know.
- For those measurements, say "I don't know."
`;
    }

    if (isInstructor) {
      responseRules += `
INSTRUCTOR STYLE:

- Provide only the requested assessment findings.
- Include units when appropriate.
- If the student states an action without asking a question,
  answer only "Acknowledged."
- If the student states actions and asks questions,
  answer the questions only.
- A statement such as "I will assess airway, breathing and
  circulation" is not a request for all ABC findings.
- Do not explain findings or give treatment advice unless asked.
`;
    }
  }

  const completion = await openai.chat.completions.create({
    model: process.env.CHAT_MODEL || "gpt-4.1-mini",
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content: systemPrompt + responseRules
      },
      {
        role: "user",
        content: userPrompt
      }
    ]
  });

  return (
    completion.choices?.[0]?.message?.content?.trim() ||
    "No response was generated."
  );
}
