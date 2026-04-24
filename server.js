let history = "";

async function askPatient() {
  const studentQuestion = document.getElementById("studentQuestion").value.trim();
  const scenario = document.getElementById("scenarioSelect").value;

  if (!studentQuestion) {
    document.getElementById("patientResponse").innerText = "Please type a question first.";
    return;
  }

  const response = await fetch("/ask", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      studentQuestion: studentQuestion,
      history: history,
      scenario: scenario
    })
  });

  const data = await response.json();

  history += `Student: ${studentQuestion}\n`;
  history += `Patient: ${data.reply}\n\n`;

  document.getElementById("patientResponse").innerText = data.reply;
  document.getElementById("studentQuestion").value = "";
}

async function gradeStudent() {
  const scenario = document.getElementById("scenarioSelect").value;

  if (!history) {
    document.getElementById("feedback").innerText = "Ask the patient some questions first.";
    return;
  }

  const response = await fetch("/grade", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      studentAnswer: history,
      scenario: scenario
    })
  });

  const data = await response.json();

  document.getElementById("feedback").innerText = data.feedback;
}

function resetScenario() {
  history = "";

  document.getElementById("patientResponse").innerText = "";
  document.getElementById("feedback").innerText = "";
  document.getElementById("studentQuestion").value = "";

  const scenario = document.getElementById("scenarioSelect").value;
  const scenarioTitle = document.getElementById("scenarioTitle");

  if (scenarioTitle) {
    if (scenario === "chestPain") {
      scenarioTitle.innerText = "Chest Pain Scenario";
    } else if (scenario === "shortnessOfBreath") {
      scenarioTitle.innerText = "Shortness of Breath Scenario";
    } else if (scenario === "stroke") {
      scenarioTitle.innerText = "Stroke Scenario";
    } else if (scenario === "diabetic") {
      scenarioTitle.innerText = "Diabetic Emergency Scenario";
    }
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const scenarioSelect = document.getElementById("scenarioSelect");

  if (scenarioSelect) {
    scenarioSelect.addEventListener("change", resetScenario);
  }
});
