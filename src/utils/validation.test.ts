import { describe, it, expect } from 'vitest';
import { validateQuestions } from './validation';
import { Question } from '../data/questions';

describe('validateQuestions', () => {
  const validQuestion: Question = {
    id: 'fun-of-gen-ai-l1-q1',
    category: 'fun-of-gen-ai',
    level: 1,
    text: 'What is 2 + 2?',
    options: ['3', '4', '5'],
    correctAnswerIndex: 1,
    explanation: '2 + 2 equals 4.',
    reference: 'Basic Math Book'
  };

  it('should pass with a valid array of questions', () => {
    const data = [validQuestion];
    expect(() => validateQuestions(data)).not.toThrow();
    expect(validateQuestions(data)).toEqual(data);
  });

  it('should throw if data is not an array', () => {
    expect(() => validateQuestions({})).toThrow('Data must be an array of questions.');
    expect(() => validateQuestions(null)).toThrow('Data must be an array of questions.');
  });

  it('should throw if ID is missing or invalid', () => {
    const data = [{ ...validQuestion, id: undefined }];
    expect(() => validateQuestions(data)).toThrow(/invalid or missing ID/);
  });

  it('should throw if there are duplicate IDs', () => {
    const data = [validQuestion, { ...validQuestion, text: 'Another question' }];
    expect(() => validateQuestions(data)).toThrow(/Duplicate Question ID found/);
  });

  it('should throw if text contains unallowed characters (e.g. zero-width space)', () => {
    // \u200B is a zero-width space
    const data = [{ ...validQuestion, text: 'What is 2 + 2?\u200B' }];
    expect(() => validateQuestions(data)).toThrow(/contains unallowed characters/);
  });

  it('should allow text with valid emojis and accents', () => {
    const data = [{ ...validQuestion, text: 'What is 2 + 2? 🤔 éñ' }];
    expect(() => validateQuestions(data)).not.toThrow();
  });

  it('should throw if level is out of bounds', () => {
    const data = [{ ...validQuestion, level: 0 }];
    expect(() => validateQuestions(data)).toThrow(/invalid level/);
    
    const data2 = [{ ...validQuestion, level: 999 }];
    expect(() => validateQuestions(data2)).toThrow(/invalid level/);
  });

  it('should throw if options are not an array or have invalid length', () => {
    expect(() => validateQuestions([{ ...validQuestion, options: 'not array' }])).toThrow(/options must be an array/);
    expect(() => validateQuestions([{ ...validQuestion, options: ['1'] }])).toThrow(/between 2 and 8 options/);
    expect(() => validateQuestions([{ ...validQuestion, options: ['1','2','3','4','5','6','7','8','9'] }])).toThrow(/between 2 and 8 options/);
  });

  it('should throw if options contain duplicates', () => {
    const data = [{ ...validQuestion, options: ['4', '4', '5'] }];
    expect(() => validateQuestions(data)).toThrow(/duplicate options/);
  });

  it('should throw if correctAnswerIndex is out of bounds', () => {
    const data = [{ ...validQuestion, correctAnswerIndex: 5 }];
    expect(() => validateQuestions(data)).toThrow(/out-of-bounds correctAnswerIndex/);
    
    const data2 = [{ ...validQuestion, correctAnswerIndex: -1 }];
    expect(() => validateQuestions(data2)).toThrow(/out-of-bounds correctAnswerIndex/);
  });

  it('should pass with an array of correctAnswerIndex', () => {
    const data = [{ ...validQuestion, correctAnswerIndex: [0, 1] }];
    expect(() => validateQuestions(data)).not.toThrow();
  });

  it('should throw if array of correctAnswerIndex is out of bounds', () => {
    const data = [{ ...validQuestion, correctAnswerIndex: [0, 5] }];
    expect(() => validateQuestions(data)).toThrow(/out-of-bounds correctAnswerIndex in array/);
  });

  it('should throw if explanation is missing or invalid', () => {
    const data = [{ ...validQuestion, explanation: '' }];
    expect(() => validateQuestions(data)).toThrow(/empty or invalid explanation/);
  });

  it('should throw if there are more than 50 questions per category/level', () => {
    const data = Array.from({ length: 51 }, (_, i) => ({
      ...validQuestion,
      id: `fun-of-gen-ai-l1-q${i}`
    }));
    expect(() => validateQuestions(data)).toThrow(/Maximum is 50 questions per level/);
  });

  describe('Malicious Attacks & Edge Cases', () => {
    it('should reject massive strings (DoS prevention)', () => {
      const massiveString = 'A'.repeat(2000); // Exceeds 1000 char limit for text
      const data = [{ ...validQuestion, text: massiveString }];
      expect(() => validateQuestions(data)).toThrow(/text exceeds 1,000 characters/);
      
      const massiveExplanation = 'A'.repeat(3000); // Exceeds 2000 char limit
      const data2 = [{ ...validQuestion, explanation: massiveExplanation }];
      expect(() => validateQuestions(data2)).toThrow(/explanation exceeds 2,000 characters/);
    });

    it('should reject XSS payloads with unallowed characters (e.g. control chars)', () => {
      // While <script> itself is allowed by the regex (letters and punctuation),
      // we can test that typical XSS vectors with weird unicode or control chars are blocked.
      const xssPayload = '<script>alert(1)</script>\x00';
      const data = [{ ...validQuestion, text: xssPayload }];
      expect(() => validateQuestions(data)).toThrow(/contains unallowed characters/);
    });

    it('should reject invalid types masquerading as valid', () => {
      // options as a string instead of an array
      const data1 = [{ ...validQuestion, options: '["A", "B", "C"]' as any }];
      expect(() => validateQuestions(data1)).toThrow(/options must be an array/);

      // correctAnswerIndex as a string
      const data2 = [{ ...validQuestion, correctAnswerIndex: '1' as any }];
      expect(() => validateQuestions(data2)).toThrow(/invalid correctAnswerIndex format/);
      
      // level as a string
      const data3 = [{ ...validQuestion, level: '1' as any }];
      expect(() => validateQuestions(data3)).toThrow(/invalid level/);
    });

    it('should reject prototype pollution attempts', () => {
      const maliciousData = JSON.parse('[{"__proto__": {"admin": true}}]');
      // It should fail validation because it lacks required fields like id, text, etc.
      expect(() => validateQuestions(maliciousData)).toThrow(/empty or invalid category/);
    });
  });
});
