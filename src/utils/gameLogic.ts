export function calculateScore(selectedOptions: number[], correctAnswers: number | number[]): boolean {
  if (Array.isArray(correctAnswers)) {
    if (selectedOptions.length !== correctAnswers.length) return false;
    return selectedOptions.every(i => correctAnswers.includes(i));
  }
  return selectedOptions.length === 1 && selectedOptions[0] === correctAnswers;
}

export function calculatePercentage(score: number, totalQuestions: number): number {
  if (totalQuestions === 0) return 0;
  return Math.round((score / totalQuestions) * 100);
}

export function hasPassedLevel(score: number, totalQuestions: number, passingThreshold: number = 70): boolean {
  return calculatePercentage(score, totalQuestions) >= passingThreshold;
}

export function getNextUnlockedLevel(currentLevel: number, currentUnlocked: number, passed: boolean, maxLevel: number = 10): number {
  if (!passed) return currentUnlocked;
  if (currentLevel >= currentUnlocked) {
    return Math.min(maxLevel, currentLevel + 1);
  }
  return currentUnlocked;
}

export function calculateTimeTaken(startTime: number, endTime: number): number {
  if (endTime < startTime) return 0;
  return Math.floor((endTime - startTime) / 1000);
}
