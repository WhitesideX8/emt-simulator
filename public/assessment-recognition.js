/* Shared immediate assessment recognition for EMT scenario pages.
   Final grading is performed separately by server.js.
   Add future common overrides to matchSkill() so every scenario uses them. */
(function (global) {
  "use strict";
  function matchSkill({ item, text, source, keywordMatched, patternMatched, fallback }) {
    const skill = String(item && item.skill || "");
    const statement = String(text || "");
    const origin = String(source || "");

    // Chief complaint must be explicitly named by the student.
    // Patient/instructor/spouse responses are never student evidence.
    if (/^(?:Chief complaint identified|Determines chief complaint or apparent life threats)$/i.test(skill)) {
      if (/response|instructor exchange|saved instructor/i.test(origin)) return false;
      return /\bchief\s+complaint\b/i.test(statement);
    }

    if (typeof fallback === "function") return Boolean(fallback());
    return Boolean(keywordMatched || patternMatched);
  }
  global.EMTAssessmentRecognition = Object.freeze({ matchSkill });
})(window);
