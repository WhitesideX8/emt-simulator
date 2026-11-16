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
      if (/instructor|patient|spouse|question|response/i.test(origin) || statement.includes("?")) return false;
      const t = statement.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
      if (/^(?:is|are|what|which|how|why|when|where|do|does|did|can|could|would|should)\b/.test(t)) return false;
      if (/\b(?:will|going to|plan to|need to|not determined|undetermined|unknown|unclear)\b/.test(t)) return false;
      return /\b(?:nature of illness|noi)\s+(?:is|was|appears to be|identified as|determined as)\s+(?:a |an |the )?(?:medical|respiratory|shortness of breath|difficulty breathing|dyspnea|copd|asthma|cardiac|chest pain|stroke|diabetic|hypoglycemia|illness|breathing)\b/.test(t) ||
        /\b(?:mechanism of injury|moi)\s+(?:is|was|appears to be|identified as|determined as)\s+(?:a |an |the )?(?:fall|collision|crash|accident|assault|blunt trauma|penetrating trauma|motor vehicle collision|mvc|injury|trauma)\b/.test(t);
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
