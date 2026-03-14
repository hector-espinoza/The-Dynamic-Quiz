export interface Question {
  id: number | string;
  category: string;
  level: number;
  text: string;
  options: string[];
  correctAnswerIndex: number | number[];
  explanation: string;
  reference?: string;
}

export const LEVEL_NAMES = [
  "Novice",
  "Beginner",
  "Learner",
  "Apprentice",
  "Intermediate",
  "Advanced",
  "Proficient",
  "Expert",
  "Master",
  "Grandmaster"
];
