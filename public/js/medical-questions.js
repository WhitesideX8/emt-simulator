```js
const questions = [

{
type:"mc",
q:"1. A 72-year-old female complains of weakness, productive cough, and increasing shortness of breath for three days. She is confused, febrile at 101.9°F, HR 118, RR 30, BP 88/54, and SpO₂ 88% on room air. Crackles are heard in the right lower lung field. Which finding is MOST concerning?",
a:[
"The productive cough because it suggests infection",
"The crackles because they indicate pneumonia",
"The hypotension because it suggests progression toward septic shock",
"The fever because it confirms infection"
],
c:"C",
e:"Hypotension with infection, altered mental status, tachycardia, and hypoxia suggests sepsis progressing to shock."
},

{
type:"mc",
q:"2. A 58-year-old diabetic is confused, pale, diaphoretic, and restless. BGL is 42 mg/dL. He is awake, follows commands, and can swallow. What is the MOST appropriate EMT treatment?",
a:[
"Administer oral glucose",
"Place him supine and monitor only",
"Request ALS and delay treatment",
"Administer aspirin"
],
c:"A",
e:"A conscious hypoglycemic patient who can swallow should receive oral glucose according to protocol."
},

{
type:"mc",
q:"3. A 67-year-old male suddenly develops right arm weakness, facial droop, and slurred speech while eating lunch. His wife states he was normal 25 minutes ago. What information is MOST important to report to the receiving facility?",
a:[
"His current medication list",
"The exact time he was last known well",
"Whether he ate lunch",
"His history of hypertension"
],
c:"B",
e:"Stroke treatment decisions depend heavily on the time the patient was last known well."
},

{
type:"mc",
q:"4. A 28-year-old male is found unresponsive in a public restroom. He has respirations of 4/min, pinpoint pupils, cyanosis, and a weak pulse. What is the EMT's MOST immediate priority?",
a:[
"Identify the specific drug used",
"Administer oral glucose",
"Assist ventilations with a BVM and high-flow oxygen",
"Place him in the recovery position and wait for ALS"
],
c:"C",
e:"The immediate life threat is respiratory failure. Ventilation must be supported first."
},

{
type:"mc",
q:"5. A 63-year-old female with a history of CHF is sitting upright, speaking in two-word sentences, and coughing pink frothy sputum. Crackles are heard throughout both lungs. BP is 196/104 and SpO₂ is 84%. What condition is MOST likely?",
a:[
"Pneumonia",
"Pulmonary edema",
"Pulmonary embolism",
"Asthma"
],
c:"B",
e:"Pink frothy sputum, crackles, severe dyspnea, and CHF history strongly suggest pulmonary edema."
},

{
type:"mc",
q:"6. A patient with a history of CHF reports worsening shortness of breath over two days. Which finding would MOST strongly support acute pulmonary edema?",
a:[
"Expiratory wheezing only",
"Crackles, orthopnea, and pink frothy sputum",
"Green sputum and low-grade fever",
"Sharp pain that worsens with inspiration"
],
c:"B",
e:"Pulmonary edema commonly causes crackles, orthopnea, severe dyspnea, and frothy sputum."
},

{
type:"mc",
q:"7. A patient has severe abdominal pain, a rigid abdomen, HR 128, BP 84/50, and cool clammy skin. Which finding suggests the patient is no longer compensating well?",
a:[
"The abdominal pain",
"The rigid abdomen",
"The hypotension",
"The tachycardia"
],
c:"C",
e:"Hypotension is a late and serious sign of decompensated shock."
},

{
type:"mc",
q:"8. A 24-year-old female develops sudden shortness of breath and sharp chest pain after a 12-hour flight. She is anxious, tachycardic, and says the pain worsens when she breathes deeply. What should the EMT MOST suspect?",
a:[
"Asthma",
"CHF",
"Pulmonary embolism",
"Bronchitis"
],
c:"C",
e:"Sudden dyspnea, pleuritic chest pain, tachycardia, and prolonged immobility suggest pulmonary embolism."
},

{
type:"mc",
q:"9. A diabetic patient is confused, dehydrated, breathing deeply and rapidly, and has fruity breath odor. His skin is warm and dry. What is the MOST likely cause?",
a:[
"Hypoglycemia",
"Diabetic ketoacidosis",
"Stroke",
"Sepsis"
],
c:"B",
e:"Kussmaul respirations, dehydration, and fruity breath odor are classic findings of diabetic ketoacidosis."
},

{
type:"mc",
q:"10. A patient with altered mental status has a BGL of 34 mg/dL. He is not able to follow commands and cannot swallow. What is MOST appropriate?",
a:[
"Administer oral glucose",
"Manage the airway, give oxygen as needed, and request ALS",
"Give water mixed with sugar",
"Place him on his side and wait"
],
c:"B",
e:"Oral glucose is contraindicated if the patient cannot swallow. Airway and ALS support are priorities."
},

{
type:"mc",
q:"11. A patient reports black tarry stools, dizziness, and weakness. BP is 86/50, HR is 124, and skin is cool and clammy. What should the EMT MOST suspect?",
a:[
"Peptic ulcer with gastrointestinal bleeding",
"Food poisoning",
"Kidney stone",
"Appendicitis"
],
c:"A",
e:"Black tarry stools suggest upper GI bleeding, and hypotension with tachycardia suggests shock."
},

{
type:"mc",
q:"12. A 69-year-old male becomes dizzy and nearly faints every time he stands. His blood pressure drops significantly from sitting to standing. What condition is MOST likely?",
a:[
"Orthostatic hypotension",
"Stroke",
"Pulmonary embolism",
"Anaphylaxis"
],
c:"A",
e:"A significant blood pressure drop with position change is consistent with orthostatic hypotension."
},

{
type:"mc",
q:"13. A patient with a recent urinary tract infection is confused, febrile, tachycardic, and hypotensive. His skin is warm and flushed. Which type of shock is MOST likely?",
a:[
"Cardiogenic shock",
"Hypovolemic shock",
"Septic shock",
"Obstructive shock"
],
c:"C",
e:"Fever, infection, altered mental status, hypotension, and warm flushed skin suggest septic shock."
},

{
type:"mc",
q:"14. A patient develops hives, wheezing, facial swelling, and hypotension after eating shellfish. Which problem is the MOST immediate life threat?",
a:[
"Skin irritation",
"Airway and breathing compromise",
"Nausea",
"Fever"
],
c:"B",
e:"Anaphylaxis can rapidly cause airway swelling, bronchoconstriction, and shock."
},

{
type:"mc",
q:"15. A patient with altered mental status suddenly becomes unresponsive. He has no pulse and only occasional gasping respirations. What is the EMT's FIRST action?",
a:[
"Obtain a blood glucose reading",
"Begin CPR and apply the AED",
"Check blood pressure",
"Insert an OPA before compressions"
],
c:"B",
e:"Pulselessness with agonal breathing requires immediate CPR and AED use."
},

{
type:"fill",
q:"16. A life-threatening systemic allergic reaction with airway, breathing, or circulatory compromise is called __________.",
c:"anaphylaxis"
},

{
type:"fill",
q:"17. Inadequate tissue perfusion that can lead to organ failure is called __________.",
c:"shock"
},

{
type:"fill",
q:"18. Deep, rapid respirations and fruity breath odor are commonly associated with diabetic __________.",
c:"ketoacidosis"
},

{
type:"fill",
q:"19. A sudden temporary loss of consciousness caused by brief decreased blood flow to the brain is called __________.",
c:"syncope"
},

{
type:"fill",
q:"20. A stroke caused by a blocked cerebral blood vessel is called an __________ stroke.",
c:"ischemic"
},

{
type:"match",
q:"21. Match each condition with the MOST likely presentation.",
left:[
"Stroke",
"Hypoglycemia",
"Diabetic ketoacidosis",
"Anaphylaxis"
],
right:[
"Facial droop, arm drift, and slurred speech",
"Diaphoresis, confusion, and low BGL",
"Deep rapid respirations and fruity breath odor",
"Wheezing, swelling, hives, and hypotension"
],
c:[
"Facial droop, arm drift, and slurred speech",
"Diaphoresis, confusion, and low BGL",
"Deep rapid respirations and fruity breath odor",
"Wheezing, swelling, hives, and hypotension"
]
},

{
type:"match",
q:"22. Match each condition with the finding that BEST supports it.",
left:[
"Pulmonary edema",
"Pulmonary embolism",
"Upper gastrointestinal bleed",
"Sepsis"
],
right:[
"Pink frothy sputum and crackles",
"Sudden pleuritic chest pain after immobility",
"Black tarry stool with hypotension",
"Fever, altered mental status, and hypotension"
],
c:[
"Pink frothy sputum and crackles",
"Sudden pleuritic chest pain after immobility",
"Black tarry stool with hypotension",
"Fever, altered mental status, and hypotension"
]
},

{
type:"mc",
q:"23. A 44-year-old male has sudden severe flank pain radiating to the groin. He is restless, nauseated, and unable to find a comfortable position. Vitals are stable. What condition is MOST likely?",
a:[
"Kidney stone",
"Stroke",
"Appendicitis",
"Sepsis"
],
c:"A",
e:"Renal colic often causes severe flank pain radiating to the groin with restlessness."
},

{
type:"mc",
q:"24. Which patient has the highest transport priority?",
a:[
"A stable patient with mild abdominal pain for two days",
"A stable patient with suspected kidney stone pain",
"A stroke patient whose symptoms began 30 minutes ago",
"A hypoglycemic patient who is now alert after oral glucose"
],
c:"C",
e:"A stroke patient within the treatment window requires rapid transport to an appropriate facility."
},

{
type:"mc",
q:"25. A patient has sudden vision changes, facial droop, and arm weakness. BGL is 104 mg/dL. What is the MOST likely condition?",
a:[
"Hypoglycemia",
"Stroke",
"Sepsis",
"Pulmonary embolism"
],
c:"B",
e:"Normal glucose with focal neurologic deficits strongly suggests stroke."
},

{
type:"mc",
q:"26. A CHF patient reports that he cannot breathe when lying flat and sleeps in a recliner. This symptom is called:",
a:[
"Orthopnea",
"Apnea",
"Dyspnea",
"Tachypnea"
],
c:"A",
e:"Orthopnea is difficulty breathing while lying flat."
},

{
type:"mc",
q:"27. Which patient is MOST consistent with compensated shock?",
a:[
"Normal pulse and normal blood pressure",
"Bradycardia and hypertension",
"Tachycardia, anxiety, and cool clammy skin with normal blood pressure",
"Absent radial pulse and unresponsiveness"
],
c:"C",
e:"Early shock may present with tachycardia, anxiety, and cool clammy skin before blood pressure drops."
},

{
type:"mc",
q:"28. A patient with suspected sepsis becomes increasingly confused and hypotensive. What does this MOST likely indicate?",
a:[
"Improvement",
"Progression to decompensated shock",
"An isolated stroke",
"Pulmonary embolism only"
],
c:"B",
e:"Altered mental status with hypotension indicates worsening perfusion and decompensated shock."
},

{
type:"mc",
q:"29. A patient reports abdominal pain and vomits bright red blood. He is pale, diaphoretic, and has a BP of 82/48. What is the greatest concern?",
a:[
"Pain control",
"Airway obstruction only",
"Hemorrhagic shock",
"Appendicitis"
],
c:"C",
e:"Vomiting blood with hypotension and poor skin signs suggests hemorrhagic shock."
},

{
type:"mc",
q:"30. A patient has severe respiratory distress, hives, facial swelling, and BP 78/42 after a bee sting. Which intervention should be prioritized?",
a:[
"Oral glucose",
"Rapid transport only without treatment",
"Assist with epinephrine if allowed and support airway and breathing",
"Place the patient supine and observe"
],
c:"C",
e:"Anaphylaxis requires airway support, oxygen, rapid transport, and epinephrine if allowed by protocol."
}

];

const fillOptions = [
"anaphylaxis",
"shock",
"ketoacidosis",
"syncope",
"ischemic",
"hemorrhage",
"hypoglycemia",
"hyperglycemia",
"septic",
"orthopnea",
"stroke",
"epinephrine",
"aspirin",
"perfusion",
"embolism",
"cyanosis",
"tachycardia",
"bradycardia",
"hypoxia",
"apnea"
];
```
