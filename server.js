let history = "";

const scenarioDetails = {
  chestPain: {
    title: "Chest Pain Scenario",
    info: "58-year-old male with chest pain. Pale and sweaty. Pressure radiating to left arm."
  },
  shortnessOfBreath: {
    title: "Shortness of Breath Scenario",
    info: "67-year-old female with COPD. Difficulty breathing, speaking in short sentences."
  },
  stroke: {
    title: "Stroke Scenario",
    info: "72-year-old male with slurred speech and right-sided weakness."
  },
  diabetic: {
    title: "Diabetic Emergency Scenario",
    info: "45-year-old diabetic, shaky, sweaty, confused. Took insulin, skipped meal."
  }
};

function resetScenario() {
  history = "";

  const scenario = document.getElementById("scenarioSelect").value;
  const selected = scenarioDetails[scenario];

  document.getElementById("scenarioTitle").innerText = selected.title;
  document.getElementById("scenarioInfo").innerText = selected.info;

  document.getElementById("patientResponse").innerText = "";
  document.getElementById("instructorResponse").innerText = "";
  document.getElementById("treatmentResponse").innerText = "";
  document.getElementById("feedback").innerText = "";
  document.getElementById("studentQuestion").value = "";
}

async function askPatient() {
  const question = document.getElementById("studentQuestion").value.trim();
  const scenario = document.getElementById("scenarioSelect").value;

  if (!question) {
    document.getElementById("patientResponse").innerText = "Ask a question first.";
    return;
  }

  try {
    const res = await fetch("/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        studentQuestion: question,
        history: history,
        scenario: scenario
      })
    });

    const data = await res.json();

    history += `Student: ${question}\n`;
    history += `Patient: ${data.reply}\n\n`;

    document.getElementById("patientResponse").innerText = data.reply;
    document.getElementById("studentQuestion").value = "";
  } catch (err) {
    document.getElementById("patientResponse").innerText = "Error contacting server.";
  }
}

async function askInstructor() {
  const question = document.getElementById("studentQuestion").value.trim();
  const scenario = document.getElementById("scenarioSelect").value;

  if (!question) {
    document.getElementById("instructorResponse").innerText = "Ask a question first.";
    return;
  }

  try {
    const res = await fetch("/instructor", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        studentQuestion: question,
        scenario: scenario
      })
    });

    const data = await res.json();

    document.getElementById("instructorResponse").innerText = data.reply;
  } catch (err) {
    document.getElementById("instructorResponse").innerText = "Error contacting instructor.";
  }
}

async function getTreatment() {
  const scenario = document.getElementById("scenarioSelect").value;

  try {
    const res = await fetch("/treatment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        scenario: scenario
      })
    });

    const data = await res.json();

    document.getElementById("treatmentResponse").innerText = data.treatment;
  } catch (err) {
    document.getElementById("treatmentResponse").innerText = "Error getting treatment plan.";
  }
}

async function gradeStudent() {
  const scenario = document.getElementById("scenarioSelect").value;

  if (!history) {
    document.getElementById("feedback").innerText = "Ask patient questions first.";
    return;
  }

  try {
    const res = await fetch("/grade", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        studentAnswer: history,
        scenario: scenario
      })
    });

    const data = await res.json();

    document.getElementById("feedback").innerText = data.feedback;
  } catch (err) {
    document.getElementById("feedback").innerText = "Error grading.";
  }
}

window.addEventListener("DOMContentLoaded", resetScenario);
