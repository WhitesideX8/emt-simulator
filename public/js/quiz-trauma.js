const questions = [
{
type:"mc",
q:"1. A 24-year-old male was ejected from a vehicle and found 20 feet from the car. He is confused, pale, cool, and diaphoretic. RR 30 shallow, HR 138, BP 82/50. There is bright red bleeding from a deep thigh wound soaking through clothing. Your partner is opening the airway. What is the EMT’s MOST appropriate immediate action?",
a:[
"Begin a rapid head-to-toe assessment before treating the wound",
"Control the life-threatening extremity bleeding immediately with direct pressure or tourniquet if needed",
"Apply a cervical collar before addressing the bleeding",
"Obtain a complete SAMPLE history from bystanders"
],
c:"B",
e:"Massive external bleeding is controlled immediately because hemorrhage can kill quickly."
},
{
type:"mc",
q:"2. A 31-year-old male was stabbed in the left chest. He is anxious, cyanotic, and speaking one-word answers. Breath sounds are absent on the left. Neck veins are distended and BP is 76/44. What is the MOST likely problem?",
a:[
"Cardiac tamponade because JVD and hypotension are present",
"Tension pneumothorax because respiratory distress, unilateral absent breath sounds, JVD, and hypotension are present",
"Simple pneumothorax because all pneumothoraces remain stable before ALS arrival",
"Flail chest because paradoxical chest movement is expected with penetrating trauma"
],
c:"B",
e:"Unilateral absent breath sounds, severe distress, JVD, and hypotension suggest tension pneumothorax."
},
{
type:"mc",
q:"3. A 44-year-old male struck the steering wheel during a crash. He has severe chest pain, shallow respirations, bruising over the sternum, and a section of the left chest wall moves inward during inspiration and outward during expiration. SpO₂ is 88%. What is the MOST appropriate interpretation and priority?",
a:[
"Flail chest; support oxygenation and ventilation as needed",
"Simple rib fracture; apply ice and transport non-urgently",
"Pulmonary embolism; place the patient supine",
"Myocardial infarction; assist with nitroglycerin first"
],
c:"A",
e:"Paradoxical motion indicates flail chest. Oxygenation and ventilation are priorities."
},
{
type:"mc",
q:"4. A patient has an open chest wound after a stabbing. You apply an occlusive dressing. Ten minutes later, he becomes more dyspneic, hypotensive, and has worsening absent breath sounds on the injured side. What should you suspect?",
a:[
"The dressing may have contributed to developing tension pneumothorax",
"The wound has healed and the patient is anxious",
"The patient needs oral fluids",
"The patient is developing isolated abdominal bleeding only"
],
c:"A",
e:"Patients with occlusive dressings must be monitored for tension pneumothorax."
},
{
type:"mc",
q:"5. A 36-year-old female fell 25 feet from a roof. She is confused, pale, tachycardic, and hypotensive. No major external bleeding is found. Abdomen is firm and tender. What is the MOST likely cause of shock?",
a:[
"Internal hemorrhage",
"Anxiety-induced hyperventilation",
"Minor musculoskeletal pain",
"Isolated superficial bleeding"
],
c:"A",
e:"Significant blunt trauma with shock and abdominal findings suggests internal bleeding."
},

{type:"fill",q:"6. Severe bleeding that can rapidly cause death is called __________ hemorrhage.",c:"life-threatening"},
{type:"fill",q:"7. Poor tissue perfusion after trauma is called __________.",c:"shock"},
{type:"fill",q:"8. Bruising around the eyes after head trauma is called __________ eyes.",c:"raccoon"},
{type:"fill",q:"9. Bruising behind the ears after head trauma is called Battle’s __________.",c:"sign"},
{type:"fill",q:"10. Air in the pleural space is called a __________.",c:"pneumothorax"},

{
type:"match",
q:"11. Match the trauma finding with the highest EMT concern.",
left:["Paradoxical chest movement","Bubbling chest wound","Unequal pupils after head trauma","Pelvic instability"],
right:["Flail chest with ventilation compromise","Open pneumothorax","Possible brain injury or increased pressure","Severe internal bleeding risk"],
c:["Flail chest with ventilation compromise","Open pneumothorax","Possible brain injury or increased pressure","Severe internal bleeding risk"]
},
{
type:"match",
q:"12. Match the bleeding control method with the best use.",
left:["Direct pressure","Tourniquet","Hemostatic dressing","Pressure dressing"],
right:["Initial control of most external bleeding","Life-threatening extremity hemorrhage","Severe bleeding where protocol allows","Maintains pressure after bleeding is controlled"],
c:["Initial control of most external bleeding","Life-threatening extremity hemorrhage","Severe bleeding where protocol allows","Maintains pressure after bleeding is controlled"]
},

{
type:"mc",
q:"13. A 40-year-old male has a partial amputation of the lower leg from machinery. Direct pressure fails and blood continues to pool rapidly. The patient is pale and restless. What should the EMT do next?",
a:[
"Apply a tourniquet proximal to the wound",
"Continue direct pressure only until ALS arrives",
"Apply ice directly into the wound",
"Remove loose tissue to make dressing easier"
],
c:"A",
e:"Uncontrolled life-threatening extremity bleeding requires tourniquet placement."
},
{
type:"mc",
q:"14. A motorcyclist has a midshaft femur deformity, severe thigh swelling, pale cool skin, HR 132, and BP 88/50. Which concern should guide treatment priority?",
a:[
"Significant blood loss and shock",
"Pain only, because closed fractures do not bleed",
"Stroke because the patient is anxious",
"Hyperglycemia from stress"
],
c:"A",
e:"Femur fractures can cause significant internal blood loss."
},
{
type:"mc",
q:"15. A patient has a large scalp laceration with heavy bleeding after falling down stairs. You suspect possible skull injury. What is the MOST appropriate bleeding control?",
a:[
"Apply gentle direct pressure around the wound without pressing unstable bone fragments",
"Ignore the bleeding because scalp wounds are minor",
"Apply a tourniquet around the neck",
"Repeatedly remove clots to inspect the wound"
],
c:"A",
e:"Scalp bleeding can be severe, but pressure should be cautious if skull fracture is suspected."
},
{
type:"mc",
q:"16. A patient has a metal rod impaled through the right lower abdomen. He is pale, tachycardic, and asks you to remove it because it hurts. What should you do?",
a:[
"Remove it quickly to reduce pain",
"Stabilize it in place and control bleeding around it",
"Push it farther in to control bleeding",
"Cut it flush with the skin"
],
c:"B",
e:"Impaled objects are stabilized in place unless they interfere with airway or CPR."
},
{
type:"mc",
q:"17. A patient has abdominal evisceration after a crash. He is frightened and tries to push the organs back in. What should the EMT do?",
a:[
"Cover the organs with moist sterile dressing and protect with an occlusive covering",
"Push the organs back inside to prevent contamination",
"Apply firm direct pressure over the organs",
"Leave the wound open to air"
],
c:"A",
e:"Eviscerated organs should be covered with moist sterile dressings and protected."
},

{type:"fill",q:"18. A broken bone is called a __________.",c:"fracture"},
{type:"fill",q:"19. A ligament injury is a __________.",c:"sprain"},
{type:"fill",q:"20. A muscle or tendon injury is a __________.",c:"strain"},
{type:"fill",q:"21. A closed soft tissue injury with bruising is a __________.",c:"contusion"},
{type:"fill",q:"22. A localized collection of blood under the skin is a __________.",c:"hematoma"},

{
type:"match",
q:"23. Match the soft tissue injury with the best description.",
left:["Abrasion","Laceration","Avulsion","Amputation"],
right:["Scrape from friction","Jagged cut or tear","Tissue partially torn away","Body part partially or fully separated"],
c:["Scrape from friction","Jagged cut or tear","Tissue partially torn away","Body part partially or fully separated"]
},
{
type:"match",
q:"24. Match the shock sign with the meaning.",
left:["Cool clammy skin","Weak rapid pulse","Altered mental status","Delayed capillary refill"],
right:["Peripheral vasoconstriction","Compensatory cardiovascular response","Possible poor brain perfusion","Poor peripheral circulation"],
c:["Peripheral vasoconstriction","Compensatory cardiovascular response","Possible poor brain perfusion","Poor peripheral circulation"]
},

{
type:"mc",
q:"25. A patient struck the steering wheel and now has hypotension, JVD, muffled heart sounds, and narrow pulse pressure. Breath sounds are equal. What should you suspect?",
a:[
"Cardiac tamponade",
"Tension pneumothorax",
"Simple rib fracture",
"Isolated panic attack"
],
c:"A",
e:"Hypotension, JVD, and muffled heart sounds suggest cardiac tamponade."
},
{
type:"mc",
q:"26. A patient has blunt abdominal trauma, left upper quadrant tenderness, left shoulder pain, pale skin, and BP 86/50. What injury is MOST concerning?",
a:[
"Splenic injury with internal bleeding",
"Appendicitis",
"Isolated bladder injury",
"Simple indigestion"
],
c:"A",
e:"Left shoulder pain after abdominal trauma may be referred pain from splenic bleeding."
},
{
type:"mc",
q:"27. A patient has right upper quadrant abdominal pain after a handlebar injury. He is pale, weak, and hypotensive. What organ injury is most concerning?",
a:[
"Liver injury",
"Spleen injury only",
"Isolated kidney stone",
"Stomach flu"
],
c:"A",
e:"The liver is in the right upper quadrant and can bleed heavily."
},
{
type:"mc",
q:"28. A pedestrian struck by a vehicle has pelvic pain, instability, and blood at the urethral opening. What should the EMT suspect?",
a:[
"Pelvic fracture with possible urinary tract injury",
"Simple dehydration",
"Appendicitis",
"Isolated ankle fracture"
],
c:"A",
e:"Blood at the urethral opening after pelvic trauma suggests urinary tract injury."
},
{
type:"mc",
q:"29. A patient has pelvic instability after a motorcycle crash. He is tachycardic and hypotensive. Why is this injury high priority?",
a:[
"Pelvic fractures can cause massive internal bleeding",
"Pelvic fractures are painful but rarely serious",
"Pelvic injuries usually cause only minor bruising",
"Pelvic instability rules out shock"
],
c:"A",
e:"Pelvic fractures can cause life-threatening hemorrhage."
},

{type:"fill",q:"30. An injury caused by heat, chemicals, electricity, or radiation is a __________.",c:"burn"},
{type:"fill",q:"31. The percentage of body burned is estimated using total body surface __________.",c:"area"},
{type:"fill",q:"32. A burn that completely surrounds a body part is __________.",c:"circumferential"},
{type:"fill",q:"33. Burns involving the airway may cause delayed airway __________.",c:"swelling"},
{type:"fill",q:"34. A burn affecting only the epidermis is __________ thickness.",c:"superficial"},

{
type:"match",
q:"35. Match the burn type with the description.",
left:["Superficial burn","Partial-thickness burn","Full-thickness burn","Circumferential burn"],
right:["Red painful epidermal injury","Blisters and moist painful skin","Charred, white, or leathery skin","Completely surrounds a body part"],
c:["Red painful epidermal injury","Blisters and moist painful skin","Charred, white, or leathery skin","Completely surrounds a body part"]
},
{
type:"match",
q:"36. Match the trauma patient with the priority concern.",
left:["Facial burns with hoarseness","Femur fracture with shock","Open chest wound","Head injury with vomiting"],
right:["Delayed airway obstruction","Major blood loss","Open pneumothorax","Increasing intracranial pressure"],
c:["Delayed airway obstruction","Major blood loss","Open pneumothorax","Increasing intracranial pressure"]
},

{
type:"mc",
q:"37. A patient rescued from a house fire has facial burns, singed nasal hair, soot in the mouth, hoarseness, and increasing anxiety. SpO₂ is 95%. What should concern the EMT most?",
a:[
"Airway swelling can worsen even if SpO₂ is initially acceptable",
"The patient is stable because SpO₂ is above 94%",
"Facial burns are cosmetic only",
"The patient mainly needs burn cream"
],
c:"A",
e:"Airway burns can progress and obstruct the airway."
},
{
type:"mc",
q:"38. A construction worker receives a high-voltage electrical injury. Entry and exit wounds appear small. He feels weak and dizzy. What is the EMT’s greatest concern?",
a:[
"Cardiac dysrhythmia and hidden deep tissue injury",
"Only superficial skin injury",
"Immediate frostbite",
"Food poisoning"
],
c:"A",
e:"Electrical injuries can cause dysrhythmias and deep tissue damage."
},
{
type:"mc",
q:"39. A patient has dry chemical powder on both arms from an industrial spill. What should generally be done before flushing with water?",
a:[
"Brush off the dry chemical powder",
"Add water immediately without removing powder",
"Apply ointment",
"Cover tightly with plastic wrap only"
],
c:"A",
e:"Dry chemicals should generally be brushed away before irrigation."
},
{
type:"mc",
q:"40. A patient has full-thickness burns to both hands. He denies pain in the burned areas. Why is this still high priority?",
a:[
"Full-thickness burns may damage nerves and threaten function",
"No pain means the burn is minor",
"Hands are not considered critical areas",
"Full-thickness burns cannot affect circulation"
],
c:"A",
e:"Full-thickness burns may be painless due to nerve damage and can threaten function."
},
{
type:"mc",
q:"41. A patient has circumferential burns around the chest after a fire. He is breathing rapidly and says it is getting harder to expand his chest. What should the EMT monitor closely?",
a:[
"Ventilatory restriction",
"Blood glucose only",
"Stroke symptoms only",
"Ankle swelling"
],
c:"A",
e:"Circumferential chest burns can restrict ventilation."
},

{type:"fill",q:"42. The brain and spinal cord make up the central nervous __________.",c:"system"},
{type:"fill",q:"43. Unequal pupils after trauma may suggest brain __________.",c:"injury"},
{type:"fill",q:"44. Clear fluid leaking from the ears or nose may be cerebrospinal __________.",c:"fluid"},
{type:"fill",q:"45. Bruising around the eyes after trauma may suggest a basilar skull __________.",c:"fracture"},
{type:"fill",q:"46. Worsening headache, vomiting, and confusion after trauma may suggest increased intracranial __________.",c:"pressure"},

{
type:"match",
q:"47. Match the head injury sign with the concern.",
left:["Raccoon eyes","Battle’s sign","CSF drainage","Unequal pupils"],
right:["Possible basilar skull fracture","Possible basilar skull fracture","Skull or brain injury","Possible brain pressure or injury"],
c:["Possible basilar skull fracture","Possible basilar skull fracture","Skull or brain injury","Possible brain pressure or injury"]
},
{
type:"match",
q:"48. Match the spinal injury finding with the meaning.",
left:["Numbness","Paralysis","Priapism","Loss of bladder control"],
right:["Possible sensory pathway injury","Loss of motor function","Possible spinal cord injury","Possible spinal cord injury"],
c:["Possible sensory pathway injury","Loss of motor function","Possible spinal cord injury","Possible spinal cord injury"]
},

{
type:"mc",
q:"49. A football player is hit head-first and complains of neck pain, numbness in both hands, and weakness. He is awake and wants to remove his helmet. What is the MOST appropriate EMT action?",
a:[
"Stabilize the spine and minimize movement",
"Allow him to walk if he feels able",
"Remove the helmet immediately in every case",
"Ignore symptoms because he is awake"
],
c:"A",
e:"Neck pain with neurological symptoms suggests spinal injury."
},
{
type:"mc",
q:"50. A patient fell from a ladder and hit his head. Initially alert, he is now vomiting repeatedly and becoming confused. What is the EMT’s primary concern?",
a:[
"Worsening intracranial injury",
"Simple anxiety",
"Isolated stomach virus",
"Normal post-fall reaction"
],
c:"A",
e:"Vomiting and declining mental status after head trauma suggest worsening brain injury."
},
{
type:"mc",
q:"51. A patient has suspected basilar skull fracture with clear fluid draining from the ear. What should the EMT avoid?",
a:[
"Packing the ear to stop drainage",
"Maintaining airway",
"Monitoring mental status",
"Rapid transport"
],
c:"A",
e:"Do not pack the ears or nose if CSF drainage is suspected."
},
{
type:"mc",
q:"52. A motorcycle crash patient is wearing a helmet. He is unresponsive and vomiting inside the helmet. What is the best reason to remove the helmet?",
a:[
"Airway management cannot be performed adequately with it in place",
"All helmets must be removed immediately regardless of condition",
"Helmet removal is never allowed",
"Only police may remove helmets"
],
c:"A",
e:"Helmet removal may be necessary when airway management cannot be performed."
},
{
type:"mc",
q:"53. A head injury patient has hypertension, bradycardia, and irregular respirations. What does this suggest?",
a:[
"Increased intracranial pressure",
"Simple dehydration",
"Minor scalp wound",
"Normal compensation"
],
c:"A",
e:"Cushing’s triad suggests increased intracranial pressure."
},

{type:"fill",q:"54. Injury at the site of impact is a __________ injury.",c:"coup"},
{type:"fill",q:"55. Injury on the opposite side of impact is a __________ injury.",c:"contrecoup"},
{type:"fill",q:"56. A wound caused by scraping is an __________.",c:"abrasion"},
{type:"fill",q:"57. A jagged cut is a __________.",c:"laceration"},
{type:"fill",q:"58. A wound where tissue is torn away is an __________.",c:"avulsion"},

{
type:"match",
q:"59. Match the mechanism with the likely injury pattern.",
left:["Rapid deceleration","Penetrating trauma","Blast injury","Crush injury"],
right:["Internal organ tearing","Localized wound path","Pressure wave injury","Rhabdomyolysis risk"],
c:["Internal organ tearing","Localized wound path","Pressure wave injury","Rhabdomyolysis risk"]
},
{
type:"match",
q:"60. Match the orthopedic injury with the EMT concern.",
left:["Open fracture","Angulated fracture","Dislocation","Crush injury"],
right:["Infection, bleeding, and contamination","Neurovascular compromise","Joint injury with distal compromise risk","Compartment syndrome and rhabdomyolysis"],
c:["Infection, bleeding, and contamination","Neurovascular compromise","Joint injury with distal compromise risk","Compartment syndrome and rhabdomyolysis"]
},

{
type:"mc",
q:"61. A patient’s forearm is severely deformed after a fall. The hand is pale, cool, and pulseless. What should the EMT do?",
a:[
"Follow local protocol for gentle realignment to restore circulation if allowed",
"Ignore distal circulation until arrival at the hospital",
"Apply ice only and transport non-urgently",
"Ask the patient to move the arm repeatedly"
],
c:"A",
e:"Absent distal circulation may require realignment according to protocol."
},
{
type:"mc",
q:"62. A patient has an open tibia fracture with bone visible and moderate bleeding. What is the MOST appropriate care?",
a:[
"Control bleeding, cover with sterile dressing, immobilize, and reassess distal PMS",
"Push the bone back under the skin",
"Splint first and ignore bleeding until later",
"Leave the wound uncovered so the hospital can see it"
],
c:"A",
e:"Open fractures require bleeding control, sterile covering, immobilization, and PMS checks."
},
{
type:"mc",
q:"63. A worker was trapped under a collapsed wall for four hours. His legs are swollen and painful. He is weak and pale. What complication should the EMT anticipate?",
a:[
"Rhabdomyolysis and shock",
"Only minor bruising",
"Simple ankle sprain",
"Appendicitis"
],
c:"A",
e:"Prolonged crush injury can cause rhabdomyolysis and shock."
},
{
type:"mc",
q:"64. A trauma patient has signs of shock but no obvious external bleeding. He is breathing adequately and spinal injury is not suspected. Which position is generally preferred?",
a:[
"Supine with appropriate care for perfusion",
"Sitting upright with legs dangling",
"Prone",
"Standing"
],
c:"A",
e:"Supine positioning may support perfusion unless contraindicated."
},
{
type:"mc",
q:"65. A patient has traumatic amputation of several fingers. Which handling is MOST appropriate?",
a:[
"Wrap in sterile gauze, place in a sealed bag, and keep cool without direct ice contact",
"Place fingers directly on ice",
"Place fingers in water",
"Discard them if transport time is short"
],
c:"A",
e:"Amputated parts should be kept cool and dry, not directly frozen."
},

{type:"fill",q:"66. Pulse, motor, and sensation are abbreviated __________.",c:"PMS"},
{type:"fill",q:"67. Muscle breakdown after crush injury is called __________.",c:"rhabdomyolysis"},
{type:"fill",q:"68. The thigh bone is the __________.",c:"femur"},
{type:"fill",q:"69. The lower leg bones are the tibia and __________.",c:"fibula"},
{type:"fill",q:"70. A device used to stabilize an injured extremity is a __________.",c:"splint"}
];

const fillOptions = [
"life-threatening","shock","raccoon","sign","pneumothorax",
"fracture","sprain","strain","contusion","hematoma",
"burn","area","circumferential","swelling","superficial",
"system","injury","fluid","pressure","coup","contrecoup",
"abrasion","laceration","avulsion","PMS","rhabdomyolysis",
"femur","fibula","splint","tourniquet","occlusive","tamponade",
"evisceration","hemorrhage","pelvis","spine","skull","hypoperfusion"
];
