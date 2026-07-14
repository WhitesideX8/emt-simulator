// ctMedicalGrader.js
// Deterministic Connecticut DPH OEMS-style medical assessment grader.
// Based on the CT DPH OEMS Patient Assessment/Management – Medical sheet
// currently published by Connecticut DPH (42 possible points; minimum 33).

function normalize(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[^\w\s/+-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function includesAny(text, phrases) {
  return phrases.some((phrase) => text.includes(normalize(phrase)));
}

function countMatches(text, groups) {
  return groups.reduce(
    (total, phrases) => total + (includesAny(text, phrases) ? 1 : 0),
    0
  );
}

function item(name, possible, awarded, evidence = "") {
  return {
    name,
    possible,
    awarded: Math.max(0, Math.min(possible, awarded)),
    evidence
  };
}

function gradeCtMedical({
  studentAnswer = "",
  treatmentPlan = "",
  assessmentLog = [],
  instructorHistory = "",
  elapsedSeconds = null
} = {}) {
  const combined = normalize(
    [
      studentAnswer,
      treatmentPlan,
      ...(Array.isArray(assessmentLog) ? assessmentLog : []),
      instructorHistory
    ].join("\n")
  );

  const sections = [];

  // PPE
  sections.push({
    title: "PPE",
    items: [
      item(
        "Takes or verbalizes appropriate PPE precautions",
        1,
        includesAny(combined, [
          "ppe",
          "bsi",
          "body substance isolation",
          "gloves",
          "scene precautions"
        ]) ? 1 : 0
      )
    ]
  });

  // Scene size-up
  sections.push({
    title: "Scene Size-Up",
    items: [
      item(
        "Determines the scene/situation is safe",
        1,
        includesAny(combined, [
          "scene safe",
          "scene is safe",
          "ensure scene safety",
          "assess scene safety"
        ]) ? 1 : 0
      ),
      item(
        "Determines the mechanism of injury/nature of illness",
        1,
        includesAny(combined, [
          "nature of illness",
          "noi",
          "mechanism of injury",
          "moi",
          "medical complaint",
          "chest pain"
        ]) ? 1 : 0
      ),
      item(
        "Determines the number of patients",
        1,
        includesAny(combined, [
          "number of patients",
          "one patient",
          "single patient",
          "only patient",
          "how many patients"
        ]) ? 1 : 0
      ),
      item(
        "Requests additional EMS assistance if necessary",
        1,
        includesAny(combined, [
          "additional resources",
          "additional ems",
          "request als",
          "als intercept",
          "paramedic intercept",
          "request paramedic",
          "call for backup",
          "additional assistance"
        ]) ? 1 : 0
      ),
      item(
        "Considers stabilization of the spine",
        1,
        includesAny(combined, [
          "spinal stabilization",
          "spine stabilization",
          "spinal motion restriction",
          "c spine",
          "cervical spine",
          "no spinal precautions indicated",
          "spinal precautions not indicated"
        ]) ? 1 : 0
      )
    ]
  });

  // Primary survey
  const airwayAssessment = includesAny(combined, [
    "assess airway",
    "airway patent",
    "airway is patent",
    "airway clear",
    "opens airway",
    "check airway"
  ]);

  const breathingAssessment = includesAny(combined, [
    "assess breathing",
    "breathing rate",
    "respiratory rate",
    "work of breathing",
    "breath sounds",
    "lung sounds",
    "chest rise"
  ]);

  const adequateVentilation = includesAny(combined, [
    "adequate ventilation",
    "ventilations adequate",
    "breathing adequate",
    "equal chest rise",
    "normal work of breathing",
    "assist ventilations",
    "bvm"
  ]);

  const oxygenDecision = includesAny(combined, [
    "oxygen",
    "o2",
    "nasal cannula",
    "nonrebreather",
    "nrb",
    "spo2",
    "pulse oximetry",
    "oxygen not indicated",
    "withhold oxygen"
  ]);

  const primaryItems = [
    item(
      "Verbalizes the general impression of the patient",
      1,
      includesAny(combined, [
        "general impression",
        "appears",
        "patient appears",
        "sick appearing",
        "not sick appearing",
        "distressed",
        "pale",
        "diaphoretic"
      ]) ? 1 : 0
    ),
    item(
      "Determines responsiveness/level of consciousness",
      1,
      includesAny(combined, [
        "avpu",
        "alert and oriented",
        "alert",
        "level of consciousness",
        "loc",
        "responsiveness",
        "gcs"
      ]) ? 1 : 0
    ),
    item(
      "Determines chief complaint/apparent life-threats",
      1,
      includesAny(combined, [
        "chief complaint",
        "chest pain",
        "chest pressure",
        "life threat",
        "apparent life threat"
      ]) ? 1 : 0
    ),
    item(
      "Assesses airway and breathing",
      3,
      (airwayAssessment ? 1 : 0) +
        (breathingAssessment || adequateVentilation ? 1 : 0) +
        (oxygenDecision ? 1 : 0)
    ),
    item(
      "Assesses circulation",
      3,
      countMatches(combined, [
        ["pulse", "radial pulse", "carotid pulse", "heart rate"],
        ["skin", "skin signs", "color temperature moisture", "pale", "diaphoretic"],
        ["major bleeding", "severe bleeding", "hemorrhage", "no major bleeding", "bleeding control"]
      ])
    ),
    item(
      "Identifies patient priority and makes treatment/transport decision",
      1,
      includesAny(combined, [
        "priority patient",
        "high priority",
        "rapid transport",
        "immediate transport",
        "transport",
        "load and go",
        "als intercept",
        "cardiac center"
      ]) ? 1 : 0
    )
  ];

  sections.push({
    title: "Primary Survey – Resuscitation",
    items: primaryItems
  });

  // HPI = OPQRST (6) + clarifying questions (2)
  const opqrstPoints = countMatches(combined, [
    ["onset", "when did it start", "started"],
    ["provocation", "palliation", "better or worse", "what makes it worse", "what makes it better"],
    ["quality", "describe the pain", "pressure", "sharp", "crushing"],
    ["radiation", "radiates", "travel anywhere", "arm", "jaw", "back"],
    ["severity", "pain scale", "0 to 10", "zero to ten"],
    ["time", "how long", "duration", "constant", "intermittent"]
  ]);

  const clarifyingPoints = Math.min(
    2,
    countMatches(combined, [
      ["shortness of breath", "dyspnea", "difficulty breathing"],
      ["nausea", "vomiting"],
      ["diaphoresis", "sweating"],
      ["previous episode", "ever happened before"],
      ["exertion", "activity at onset"],
      ["cardiac history", "heart attack", "mi", "stent"]
    ])
  );

  sections.push({
    title: "History Taking",
    items: [
      item(
        "History of Present Illness (OPQRST and clarifying questions)",
        8,
        Math.min(8, opqrstPoints + clarifyingPoints)
      ),
      item(
        "Past Medical History (SAMPLE components)",
        5,
        countMatches(combined, [
          ["allergies", "allergic"],
          ["medications", "meds", "prescriptions"],
          ["past medical history", "medical history", "pmh", "history of"],
          ["last oral intake", "last meal", "last ate", "last drank"],
          ["events leading", "what happened before", "events prior"]
        ])
      )
    ]
  });

  // Secondary assessment is all-or-none on the official sheet.
  const focusedChestAssessment =
    includesAny(combined, [
      "focused assessment",
      "focused chest exam",
      "assess chest",
      "inspect chest",
      "palpate chest"
    ]) &&
    includesAny(combined, [
      "lung sounds",
      "breath sounds",
      "auscultate lungs",
      "auscultation"
    ]) &&
    includesAny(combined, [
      "chest wall",
      "equal chest rise",
      "symmetrical chest rise",
      "palpation",
      "tenderness"
    ]);

  sections.push({
    title: "Secondary Assessment",
    items: [
      item(
        "Conducts a level-appropriate assessment of the primary affected body part/system",
        5,
        focusedChestAssessment ? 5 : 0
      )
    ]
  });

  // Vital signs
  sections.push({
    title: "Vital Signs, Impression and Treatment",
    items: [
      item(
        "Obtains blood pressure",
        1,
        includesAny(combined, ["blood pressure", "bp", "systolic", "diastolic"]) ? 1 : 0
      ),
      item(
        "Obtains pulse",
        1,
        includesAny(combined, ["pulse", "heart rate", "radial pulse", "carotid pulse"]) ? 1 : 0
      ),
      item(
        "Obtains respiratory rate and quality",
        2,
        countMatches(combined, [
          ["respiratory rate", "respirations", "breathing rate"],
          ["respiratory quality", "breathing quality", "work of breathing", "labored", "unlabored"]
        ])
      ),
      item(
        "States field impression of patient",
        1,
        includesAny(combined, [
          "field impression",
          "suspected acute coronary syndrome",
          "suspected acs",
          "cardiac chest pain",
          "myocardial infarction",
          "possible mi",
          "unstable angina"
        ]) ? 1 : 0
      ),
      item(
        "Provides appropriate intervention and treatment",
        1,
        includesAny(combined, [
          "aspirin",
          "nitroglycerin",
          "assist with nitro",
          "oxygen",
          "position of comfort",
          "cardiac monitor",
          "als",
          "transport"
        ]) ? 1 : 0
      )
    ]
  });

  // Reassessment
  sections.push({
    title: "Reassessment",
    items: [
      item(
        "Demonstrates how and when to reassess the patient",
        1,
        includesAny(combined, [
          "reassess",
          "repeat vital signs",
          "repeat vitals",
          "recheck",
          "every 5 minutes",
          "every five minutes",
          "monitor for changes"
        ]) ? 1 : 0
      ),
      item(
        "Provides an accurate verbal report",
        1,
        includesAny(combined, [
          "radio report",
          "verbal report",
          "patient report",
          "handoff report",
          "notify hospital",
          "medical direction",
          "ed staff",
          "ems unit"
        ]) ? 1 : 0
      )
    ]
  });

  const totalPossible = sections.reduce(
    (sum, section) =>
      sum + section.items.reduce((s, current) => s + current.possible, 0),
    0
  );

  const totalAwarded = sections.reduce(
    (sum, section) =>
      sum + section.items.reduce((s, current) => s + current.awarded, 0),
    0
  );

  const criticalCriteria = [];

  const transportMentioned = includesAny(combined, [
    "transport",
    "rapid transport",
    "immediate transport",
    "load and go",
    "cardiac center"
  ]);

  if (
    elapsedSeconds !== null &&
    Number.isFinite(Number(elapsedSeconds)) &&
    Number(elapsedSeconds) > 900 &&
    !transportMentioned
  ) {
    criticalCriteria.push(
      "F1: Failure to initiate or call for transport within the 15-minute limit."
    );
  }

  if (!includesAny(combined, ["ppe", "bsi", "gloves", "body substance isolation"])) {
    criticalCriteria.push(
      "F2: Failure to take or verbalize appropriate PPE precautions."
    );
  }

  if (!includesAny(combined, ["scene safe", "scene is safe", "scene safety"])) {
    criticalCriteria.push(
      "F3: Failure to determine scene safety before approaching the patient."
    );
  }

  // The simulator cannot reliably infer every clinical critical failure from text alone.
  // It flags only failures supported by recorded student actions.
  if (
    includesAny(combined, ["hypoxic", "low oxygen saturation", "spo2 88", "spo2 89"]) &&
    !oxygenDecision
  ) {
    criticalCriteria.push(
      "F4: Oxygen therapy was indicated but not provided or verbalized."
    );
  }

  if (
    includesAny(combined, ["airway obstruction", "inadequate breathing", "apneic", "severe hemorrhage", "shock"]) &&
    !includesAny(combined, [
      "manage airway",
      "open airway",
      "assist ventilations",
      "bvm",
      "control bleeding",
      "treat shock",
      "oxygen"
    ])
  ) {
    criticalCriteria.push(
      "F5/F7: Failure to find or manage an airway, breathing, hemorrhage, or shock problem."
    );
  }

  if (
    includesAny(combined, [
      "give food",
      "give drink",
      "force patient to walk",
      "delay transport",
      "nitroglycerin despite hypotension",
      "aspirin allergy give aspirin"
    ])
  ) {
    criticalCriteria.push(
      "F8: Dangerous or inappropriate intervention documented."
    );
  }

  if (!includesAny(combined, [
    "radio report",
    "verbal report",
    "handoff report",
    "notify hospital",
    "medical direction",
    "ed staff",
    "ems unit"
  ])) {
    criticalCriteria.push(
      "F9: Failure to provide an accurate report."
    );
  }

  if (totalAwarded < 33) {
    criticalCriteria.push(
      `F12: Failure to earn the minimum 33 points (${totalAwarded}/42).`
    );
  }

  const passed = criticalCriteria.length === 0 && totalAwarded >= 33;

  const lines = [];
  lines.push("CONNECTICUT DPH OEMS");
  lines.push("PATIENT ASSESSMENT/MANAGEMENT – MEDICAL");
  lines.push("");
  lines.push(`Score: ${totalAwarded}/${totalPossible}`);
  lines.push(`Result: ${passed ? "PASS" : "FAIL"}`);
  lines.push("");

  for (const section of sections) {
    lines.push(section.title.toUpperCase());

    for (const scoredItem of section.items) {
      const symbol =
        scoredItem.awarded === scoredItem.possible
          ? "✓"
          : scoredItem.awarded === 0
            ? "✗"
            : "△";

      lines.push(
        `${symbol} ${scoredItem.name}: ${scoredItem.awarded}/${scoredItem.possible}`
      );
    }

    lines.push("");
  }

  lines.push("CRITICAL CRITERIA");

  if (criticalCriteria.length === 0) {
    lines.push("None identified from the recorded actions.");
  } else {
    criticalCriteria.forEach((criterion) => lines.push(`✗ ${criterion}`));
  }

  lines.push("");
  lines.push(
    "Simulator note: This report is a training aid. An authorized examiner must make the final examination determination."
  );

  return {
    passed,
    score: totalAwarded,
    possible: totalPossible,
    criticalCriteria,
    sections,
    feedback: lines.join("\n")
  };
}

module.exports = {
  gradeCtMedical
};
