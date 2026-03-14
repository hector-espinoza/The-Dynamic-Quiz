import { describe, it, expect } from 'vitest';
import { calculateScore, calculatePercentage, hasPassedLevel, getNextUnlockedLevel, calculateTimeTaken } from './gameLogic';

describe('Game Logic', () => {
  describe('calculateScore', () => {
    it('should correctly score single answer questions', () => {
      expect(calculateScore([1], 1)).toBe(true);
      expect(calculateScore([0], 1)).toBe(false);
      expect(calculateScore([1, 2], 1)).toBe(false); // Too many answers
      expect(calculateScore([], 1)).toBe(false); // No answers
    });

    it('should correctly score multiple answer questions', () => {
      expect(calculateScore([0, 2], [0, 2])).toBe(true);
      expect(calculateScore([2, 0], [0, 2])).toBe(true); // Order shouldn't matter
      expect(calculateScore([0], [0, 2])).toBe(false); // Missing an answer
      expect(calculateScore([0, 2, 3], [0, 2])).toBe(false); // Extra incorrect answer
      expect(calculateScore([], [0, 2])).toBe(false); // No answers
    });
  });

  describe('calculatePercentage', () => {
    it('should calculate correct percentages', () => {
      expect(calculatePercentage(7, 10)).toBe(70);
      expect(calculatePercentage(3, 3)).toBe(100);
      expect(calculatePercentage(0, 5)).toBe(0);
    });

    it('should handle zero total questions gracefully', () => {
      expect(calculatePercentage(0, 0)).toBe(0);
    });

    it('should round correctly', () => {
      expect(calculatePercentage(1, 3)).toBe(33); // 33.333...
      expect(calculatePercentage(2, 3)).toBe(67); // 66.666...
    });
  });

  describe('hasPassedLevel', () => {
    it('should return true if percentage is >= threshold', () => {
      expect(hasPassedLevel(7, 10, 70)).toBe(true);
      expect(hasPassedLevel(8, 10, 70)).toBe(true);
    });

    it('should return false if percentage is < threshold', () => {
      expect(hasPassedLevel(6, 10, 70)).toBe(false);
    });

    it('should use default threshold of 70', () => {
      expect(hasPassedLevel(7, 10)).toBe(true);
      expect(hasPassedLevel(6, 10)).toBe(false);
    });
  });

  describe('getNextUnlockedLevel', () => {
    it('should unlock the next level if passed and current level is the highest unlocked', () => {
      expect(getNextUnlockedLevel(1, 1, true)).toBe(2);
      expect(getNextUnlockedLevel(5, 5, true)).toBe(6);
    });

    it('should not unlock if not passed', () => {
      expect(getNextUnlockedLevel(1, 1, false)).toBe(1);
    });

    it('should not unlock past max level', () => {
      expect(getNextUnlockedLevel(10, 10, true, 10)).toBe(10);
    });

    it('should not change unlocked level if replaying an older level', () => {
      expect(getNextUnlockedLevel(2, 5, true)).toBe(5);
      expect(getNextUnlockedLevel(2, 5, false)).toBe(5);
    });
  });

  describe('calculateTimeTaken', () => {
    it('should calculate time in seconds', () => {
      const start = 10000;
      const end = 15000; // 5 seconds later
      expect(calculateTimeTaken(start, end)).toBe(5);
    });

    it('should handle end time before start time gracefully', () => {
      expect(calculateTimeTaken(15000, 10000)).toBe(0);
    });

    it('should floor the seconds', () => {
      const start = 10000;
      const end = 15500; // 5.5 seconds later
      expect(calculateTimeTaken(start, end)).toBe(5);
    });
  });
});
