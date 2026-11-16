/* Shared EMT assessment recognition. Final grading is performed by server.js. */
(function (global) {
  "use strict";
  function matchSkill({ item, text, source, keywordMatched, patternMatched, fallback }) {
    const skill = String(item && item.skill || "");
    const statement = String(text || "").trim();
    const origin = String(source || "");
    if (/^(?:Chief complaint identified|Determines chief complaint or apparent life threats)$/i.test(skill)) {
      if (/response|instructor exchange|saved instructor/i.test(origin)) return false;
      return /\bchief\s+complaint\b/i.test(statement);
    }
    if (/mechanism of injury\s*\/\s*nature of illness|nature of illness assessed/i.test(skill)) {
      if (/response|saved instructor|patient reply|spouse reply/i.test(origin) || statement.includes("?")) return false;
      const t = statement.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
      if (!/\b(?:nature of illness|mechanism of injury|noi|moi)\b/.test(t)) return false;
      if (/^(?:is|are|was|were|what|which|who|how|why|when|where|do|does|did|can|could|would|should|has|have)\b/.test(t)) return false;
      if (/\b(?:will|going to|plan to|planning to|need to|should|would|want to|trying to|attempt to|not determined|undetermined|unknown|unclear|did not|do not|dont|cannot|cant|unable to)\b/.test(t)) return false;
      if (/\b(?:assess|assessing|check|checking|determine|determining|evaluate|evaluating|identify|identifying|ask|asking)\b/.test(t) &&
          !/\b(?:is|was|identified as|determined as|classified as)\b/.test(t)) return false;
      return /\b(?:nature of illness|mechanism of injury|noi|moi)\s+(?:is|was|appears to be|identified as|determined as|classified as)\b/.test(t) ||
        /\b(?:this|it|the call|the situation|the patient|my assessment)\s+(?:is|was|appears to be|would be)\s+(?:a |an )?(?:nature of illness|mechanism of injury|noi|moi)\b/.test(t) ||
        /\b(?:identify|identified|classify|classified|determine|determined|recognize|recognized)\s+(?:this|it|the call|the situation|the patient)\s+as\s+(?:a |an )?(?:nature of illness|mechanism of injury|noi|moi)\b/.test(t);
    }
    if (typeof fallback === "function") return Boolean(fallback());
    return Boolean(keywordMatched || patternMatched);
  }
  function detectAndRecord({ text, source, assessmentMap, normalizeText,
    phraseMatches, completedSkills, assessmentLog, onMatch,
    updateCompleteHistorySkills, updateCompletedAssessmentsDisplay }) {
    const normalizedText = normalizeText(text);
    const newlyRecorded = [];
    assessmentMap.forEach(item => {
      const keywordMatched = (item.keywords || []).some(keyword => phraseMatches(normalizedText, keyword));
      const patternMatched = (item.patterns || []).some(pattern => pattern.test(normalizedText));
      const matched = matchSkill({
        item, text, source, keywordMatched, patternMatched,
        fallback: () => typeof onMatch === "function"
          ? onMatch(item, { text, source, keywordMatched, patternMatched })
          : keywordMatched || patternMatched
      });
      if (matched && !completedSkills.has(item.skill)) {
        completedSkills.add(item.skill);
        assessmentLog.push(`${item.skill} - recognized through ${source}`);
        newlyRecorded.push(item.skill);
      }
    });
    updateCompleteHistorySkills();
    updateCompletedAssessmentsDisplay();
    return newlyRecorded;
  }
  global.EMTAssessmentRecognition = Object.freeze({ matchSkill, detectAndRecord });
})(window);
