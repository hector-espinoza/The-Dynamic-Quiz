import { Question, LEVEL_NAMES } from '../data/questions';

export function validateQuestions(data: any): Question[] {
  if (!Array.isArray(data)) {
    throw new Error('Data must be an array of questions.');
  }
  
  // Allow-list regex using Unicode property escapes.
  // Allows: Letters (L), Marks (M), Numbers (N), Punctuation (P), Symbols (S), Spaces (Z)
  // Also explicitly allows standard whitespace (\n, \r, \t) and Zero Width Joiner (\u200D) for complex emojis.
  // Rejects everything else (including control characters, unassigned, and most formatting characters).
  const allowedCharsRegex = /^[\p{L}\p{M}\p{N}\p{P}\p{S}\p{Z}\n\r\t\u200D]*$/u;

  const hasInvalidChars = (str: string) => !allowedCharsRegex.test(str);

  const seenIds = new Set<string | number>();
  const counts: Record<string, number> = {};

  for (let i = 0; i < data.length; i++) {
    const q = data[i];
    const qIdentifier = q.id !== undefined ? `ID ${q.id}` : `at index ${i}`;

    // 2. Category Validation
    if (typeof q.category !== 'string' || q.category.trim() === '') {
      throw new Error(`Question ${qIdentifier} has an empty or invalid category.`);
    }
    if (q.category.length > 50) {
      throw new Error(`Question ${qIdentifier} category exceeds 50 characters.`);
    }
    if (hasInvalidChars(q.category)) {
      throw new Error(`Question ${qIdentifier} category contains unallowed characters.`);
    }
    const categoryRegex = /^[a-z0-9-]+$/;
    if (!categoryRegex.test(q.category)) {
      throw new Error(`Question ${qIdentifier} category "${q.category}" does not follow the naming convention (only lowercase letters, numbers, and hyphens allowed).`);
    }

    // 3. Level Validation
    if (typeof q.level !== 'number' || q.level < 1 || q.level > LEVEL_NAMES.length) {
      throw new Error(`Question ${qIdentifier} has an invalid level. Must be between 1 and ${LEVEL_NAMES.length}.`);
    }

    // 1. ID Validation & Uniqueness (moved after category and level to use them)
    if (typeof q.id !== 'string') {
      throw new Error(`Question ${qIdentifier} has an invalid or missing ID.`);
    }
    if (hasInvalidChars(q.id)) {
      throw new Error(`Question ${qIdentifier} ID contains unallowed characters.`);
    }
    const idRegex = /^[a-zA-Z0-9-]+$/;
    if (!idRegex.test(q.id)) {
      throw new Error(`Question ${qIdentifier} ID "${q.id}" does not follow the naming convention (only letters, numbers, and hyphens allowed).`);
    }
    if (seenIds.has(q.id)) {
      throw new Error(`Duplicate Question ID found: ${q.id}. IDs must be unique.`);
    }
    seenIds.add(q.id);

    // 4. Text Validation
    if (typeof q.text !== 'string' || q.text.trim() === '') {
      throw new Error(`Question ${qIdentifier} has empty or invalid text.`);
    }
    if (q.text.length > 1000) {
      throw new Error(`Question ${qIdentifier} text exceeds 1,000 characters.`);
    }
    if (hasInvalidChars(q.text)) {
      throw new Error(`Question ${qIdentifier} text contains unallowed characters.`);
    }

    // 5. Options Validation
    if (!Array.isArray(q.options)) {
      throw new Error(`Question ${qIdentifier} options must be an array.`);
    }
    if (q.options.length < 2 || q.options.length > 8) {
      throw new Error(`Question ${qIdentifier} must have between 2 and 8 options.`);
    }
    
    const seenOptions = new Set<string>();
    for (const opt of q.options) {
      if (typeof opt !== 'string' || opt.trim() === '') {
        throw new Error(`Question ${qIdentifier} contains an empty or invalid option.`);
      }
      if (opt.length > 400) {
        throw new Error(`Question ${qIdentifier} has an option exceeding 300 characters.`);
      }
      if (hasInvalidChars(opt)) {
        throw new Error(`Question ${qIdentifier} option "${opt.substring(0, 10)}..." contains unallowed characters.`);
      }
      const normalizedOpt = opt.trim().toLowerCase();
      if (seenOptions.has(normalizedOpt)) {
        throw new Error(`Question ${qIdentifier} contains duplicate options ("${opt}").`);
      }
      seenOptions.add(normalizedOpt);
    }

    // 6. Answer Index Validation
    if (typeof q.correctAnswerIndex === 'number') {
      if (q.correctAnswerIndex < 0 || q.correctAnswerIndex >= q.options.length) {
        throw new Error(`Question ${qIdentifier} has an out-of-bounds correctAnswerIndex.`);
      }
    } else if (Array.isArray(q.correctAnswerIndex)) {
      if (q.correctAnswerIndex.length === 0) {
        throw new Error(`Question ${qIdentifier} must have at least one correct answer index.`);
      }
      for (const idx of q.correctAnswerIndex) {
        if (typeof idx !== 'number' || idx < 0 || idx >= q.options.length) {
          throw new Error(`Question ${qIdentifier} has an out-of-bounds correctAnswerIndex in array.`);
        }
      }
    } else {
      throw new Error(`Question ${qIdentifier} has an invalid correctAnswerIndex format.`);
    }

    // 7. Explanation Validation
    if (typeof q.explanation !== 'string' || q.explanation.trim() === '') {
      throw new Error(`Question ${qIdentifier} has an empty or invalid explanation.`);
    }
    if (q.explanation.length > 2000) {
      throw new Error(`Question ${qIdentifier} explanation exceeds 2,000 characters.`);
    }
    if (hasInvalidChars(q.explanation)) {
      throw new Error(`Question ${qIdentifier} explanation contains unallowed characters.`);
    }

    // 8. Reference Validation
    if (q.reference !== undefined) {
      if (typeof q.reference !== 'string') {
        throw new Error(`Question ${qIdentifier} has an invalid reference format.`);
      }
      if (hasInvalidChars(q.reference)) {
        throw new Error(`Question ${qIdentifier} reference contains unallowed characters.`);
      }
    }

    // 9. Max Questions per Level per Category
    const key = `${q.category}-level-${q.level}`;
    counts[key] = (counts[key] || 0) + 1;
    if (counts[key] > 50) {
      throw new Error(`Too many questions for category "${q.category}" at level ${q.level}. Maximum is 50 questions per level.`);
    }
  }

  return data as Question[];
}
