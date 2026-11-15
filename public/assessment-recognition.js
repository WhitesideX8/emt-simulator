/* Central immediate assessment recognition engine for all four EMT scenarios.
   Final point awards remain in server.js. Update common matching rules here.
   Scenario-specific evidence callbacks are retained where required. */
(function (global) {
  "use strict";

  function matchSkill({ item, text, source, keywordMatched, patternMatched, fallback }) {
    const skill = String(item && item.skill || "");
    const statement = String(text || "");
    const origin = String(source || "");

    // Explicit chief-complaint wording is required; patient/instructor/spouse
    // answers are not student evidence.
    if (/^(?:Chief complaint identified|Determines chief complaint or apparent life threats)$/i.test(skill)) {
      if (/response|instructor exchange|saved instructor/i.test(origin)) return false;
      return /\bchief\s+complaint\b/i.test(statement);
    }

    if (typeof fallback === "function") return Boolean(fallback());
    return Boolean(keywordMatched || patternMatched);
  }

  // One shared recording loop, used by all scenario pages.
  function detectAndRecord({ text, source, assessmentMap, normalizeText,
    phraseMatches, completedSkills, assessmentLog, onMatch,
    updateCompleteHistorySkills, updateCompletedAssessmentsDisplay }) {
    const normalizedText = normalizeText(text);
    const newlyRecorded = [];
    assessmentMap.forEach(item => {
      const keywordMatched = (item.keywords || []).some(keyword =>
        phraseMatches(normalizedText, keyword));
      const patternMatched = (item.patterns || []).some(pattern =>
        pattern.test(normalizedText));
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
