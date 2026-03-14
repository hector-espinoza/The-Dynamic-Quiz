import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, CheckCircle2, XCircle, Cpu, ArrowRight, Trophy, ExternalLink, Lock, Play, Upload, Frown, PartyPopper, RotateCcw, FileUp, FileJson, Timer, BrainCircuit, Sparkles, Blocks, ShieldCheck, LockKeyhole, Shuffle, Pause, Cat, Bird, Turtle, Fish, Snail, Bug, Trash2, Plus } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Question, LEVEL_NAMES } from './data/questions';
import { validateQuestions } from './utils/validation';
import { calculateScore, calculatePercentage, hasPassedLevel, getNextUnlockedLevel, calculateTimeTaken } from './utils/gameLogic';
import { useLocalStorage } from './hooks/useLocalStorage';

interface PausedSession {
  category: string;
  level: number;
  questionIndex: number;
  score: number;
  elapsedTime: number;
  activeQuestions: Question[];
}

interface AppMetadata {
  title: string;
  categories: {
    id: string;
    name: string;
    weight: string;
    icon?: string;
    color?: string;
    bg?: string;
    border?: string;
  }[];
}

const ICON_MAP: Record<string, any> = {
  BrainCircuit, Sparkles, Blocks, ShieldCheck, LockKeyhole, Shuffle,
  Cpu, Trophy, ExternalLink, Lock, Play, Upload, Frown, PartyPopper, RotateCcw, FileUp, FileJson, Timer,
  Cat, Bird, Turtle, Fish, Snail, Bug
};

const DEFAULT_CATEGORIES = [
  { id: 'fun-of-aim', name: 'Fundamentals of AI/ML', weight: '20%', icon: 'BrainCircuit', color: 'text-blue-500', bg: 'bg-blue-100', border: 'border-blue-200' },
  { id: 'fun-of-gen-ai', name: 'Fundamentals of Generative AI', weight: '24%', icon: 'Sparkles', color: 'text-purple-500', bg: 'bg-purple-100', border: 'border-purple-200' },
  { id: 'app-of-fou-mod', name: 'Applications of Foundation Models', weight: '28%', icon: 'Blocks', color: 'text-emerald-500', bg: 'bg-emerald-100', border: 'border-emerald-200' },
  { id: 'res-ai', name: 'Responsible AI', weight: '14%', icon: 'ShieldCheck', color: 'text-amber-500', bg: 'bg-amber-100', border: 'border-amber-200' },
  { id: 'sec-com-and-gov', name: 'Security, Compliance, and Governance', weight: '14%', icon: 'LockKeyhole', color: 'text-rose-500', bg: 'bg-rose-100', border: 'border-rose-200' }
];

const CATEGORY_STYLES = [
  { icon: 'BrainCircuit', color: 'text-blue-500', bg: 'bg-blue-100', border: 'border-blue-200' },
  { icon: 'Sparkles', color: 'text-purple-500', bg: 'bg-purple-100', border: 'border-purple-200' },
  { icon: 'Blocks', color: 'text-emerald-500', bg: 'bg-emerald-100', border: 'border-emerald-200' },
  { icon: 'ShieldCheck', color: 'text-amber-500', bg: 'bg-amber-100', border: 'border-amber-200' },
  { icon: 'LockKeyhole', color: 'text-rose-500', bg: 'bg-rose-100', border: 'border-rose-200' },
  { icon: 'Cpu', color: 'text-indigo-500', bg: 'bg-indigo-100', border: 'border-indigo-200' },
  { icon: 'Timer', color: 'text-teal-500', bg: 'bg-teal-100', border: 'border-teal-200' },
  { icon: 'Trophy', color: 'text-yellow-500', bg: 'bg-yellow-100', border: 'border-yellow-200' },
];

export interface QuizGame {
  id: string;
  title: string;
  description: string;
  isDefault: boolean;
  metadataUrl?: string;
  questionsUrl?: string;
  theme?: {
    from: string;
    to: string;
    icon: string;
  };
}

const DEFAULT_QUIZZES: QuizGame[] = [
  {
    id: 'animal-kingdom',
    title: 'Animal Kingdom Mastery',
    description: 'Test your knowledge of the animal kingdom!',
    isDefault: true,
    metadataUrl: '/metadata.bk.json',
    questionsUrl: '/questions.bk.json',
    theme: {
      from: 'from-emerald-400',
      to: 'to-teal-600',
      icon: 'Turtle'
    }
  },
  {
    id: 'aws-aif-c01',
    title: 'AWS AI Practitioner',
    description: 'Practice for the AWS Certified AI Practitioner exam.',
    isDefault: true,
    metadataUrl: '/metadata.json',
    questionsUrl: '/questions.json',
    theme: {
      from: 'from-orange-400',
      to: 'to-rose-600',
      icon: 'Cpu'
    }
  }
];

const CUSTOM_THEMES = [
  { from: 'from-blue-400', to: 'to-indigo-600', icon: 'Sparkles' },
  { from: 'from-purple-400', to: 'to-fuchsia-600', icon: 'BrainCircuit' },
  { from: 'from-pink-400', to: 'to-rose-600', icon: 'Trophy' },
  { from: 'from-amber-400', to: 'to-orange-600', icon: 'Timer' },
  { from: 'from-cyan-400', to: 'to-blue-600', icon: 'Blocks' },
];

export default function App() {
  const [customQuizzes, setCustomQuizzes] = useLocalStorage<QuizGame[]>('quiz_customQuizzes_list', []);
  const [currentQuizId, setCurrentQuizId] = useLocalStorage<string | null>('quiz_currentQuizId_v2', null);

  const allQuizzes = [...DEFAULT_QUIZZES, ...customQuizzes];

  if (currentQuizId) {
    const quiz = allQuizzes.find(q => q.id === currentQuizId);
    if (!quiz) {
      setCurrentQuizId(null);
      return null;
    }
    return <QuizApp 
      key={currentQuizId} 
      quiz={quiz} 
      onBack={() => setCurrentQuizId(null)} 
    />;
  }

  const handleCreateCustomQuiz = () => {
    const randomTheme = CUSTOM_THEMES[Math.floor(Math.random() * CUSTOM_THEMES.length)];
    const newQuiz: QuizGame = {
      id: `custom-${Date.now()}`,
      title: 'New Custom Quiz',
      description: 'Upload your JSON files to get started.',
      isDefault: false,
      theme: randomTheme
    };
    setCustomQuizzes([...customQuizzes, newQuiz]);
    setCurrentQuizId(newQuiz.id);
  };

  const handleDeleteQuiz = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this custom quiz? All progress will be lost.')) {
      setCustomQuizzes(prev => prev.filter(q => q.id !== id));
      // Clean up localStorage keys for this quiz
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`quiz_${id}_`)) {
          localStorage.removeItem(key);
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans selection:bg-slate-200 selection:text-slate-900">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col h-[85vh] max-h-[800px] relative">
        <div className="p-6 border-b border-slate-100 bg-white/80 backdrop-blur-xl sticky top-0 z-10 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Blocks className="w-6 h-6 text-slate-600" />
            Select a Quiz
          </h1>
        </div>
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allQuizzes.map(quiz => {
              let displayTitle = quiz.title;
              let displayDesc = quiz.description;
              if (!quiz.isDefault) {
                try {
                  const meta = window.localStorage.getItem(`quiz_${quiz.id}_metadata`);
                  if (meta) {
                    const parsed = JSON.parse(meta);
                    if (parsed.title) displayTitle = parsed.title;
                  }
                } catch (e) {}
              }
              
              return (
              <motion.div
                key={quiz.id}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setCurrentQuizId(quiz.id)}
                className={`bg-gradient-to-br ${quiz.theme?.from || 'from-slate-700'} ${quiz.theme?.to || 'to-slate-800'} rounded-3xl p-6 cursor-pointer shadow-lg hover:shadow-xl transition-all relative group overflow-hidden text-white flex flex-col min-h-[200px]`}
              >
                <div className="absolute -right-6 -bottom-6 opacity-20 pointer-events-none">
                  {quiz.theme?.icon && React.createElement(ICON_MAP[quiz.theme.icon] || Blocks, { className: "w-40 h-40" })}
                </div>
                
                <div className="relative z-10 flex flex-col h-full flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl shadow-sm">
                      {quiz.theme?.icon && React.createElement(ICON_MAP[quiz.theme.icon] || Blocks, { className: "w-6 h-6 text-white" })}
                    </div>
                    {!quiz.isDefault && (
                      <button
                        onClick={(e) => handleDeleteQuiz(e, quiz.id)}
                        className="text-white/60 hover:text-white bg-black/10 hover:bg-black/20 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                        title="Delete Quiz"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <h3 className="font-bold text-2xl mb-2">{displayTitle}</h3>
                  <p className="text-white/90 text-sm mb-6 flex-1">{displayDesc}</p>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/20">
                    <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm shadow-sm">
                      {quiz.isDefault ? 'Built-in' : 'Custom'}
                    </span>
                    <div className="flex items-center font-bold text-sm bg-white text-slate-900 px-4 py-2 rounded-full shadow-sm group-hover:shadow-md transition-all">
                      Play <Play className="w-4 h-4 ml-1 fill-current" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )})}
            
            <motion.div
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCreateCustomQuiz}
              className="bg-white/50 border-2 border-dashed border-slate-300 rounded-3xl p-6 cursor-pointer hover:border-slate-400 hover:bg-slate-50/50 transition-all flex flex-col items-center justify-center text-center min-h-[200px] group"
            >
              <div className="w-16 h-16 bg-slate-100 group-hover:bg-slate-200 text-slate-400 group-hover:text-slate-600 rounded-full flex items-center justify-center mb-4 transition-colors">
                <Plus className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-xl text-slate-700 group-hover:text-slate-900 transition-colors">Create Custom Quiz</h3>
              <p className="text-sm text-slate-500 mt-2">Upload your own JSON files</p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface QuizAppProps {
  quiz: QuizGame;
  onBack: () => void;
}

const QuizApp: React.FC<QuizAppProps> = ({ quiz, onBack }) => {
  const [isCustomData, setIsCustomData] = useLocalStorage<boolean>(`quiz_${quiz.id}_isCustomData`, !quiz.isDefault);
  const [questions, setQuestions] = useLocalStorage<Question[]>(`quiz_${quiz.id}_questions`, []);
  const [appMetadata, setAppMetadata] = useLocalStorage<AppMetadata>(`quiz_${quiz.id}_metadata`, {
    title: quiz.title,
    categories: DEFAULT_CATEGORIES
  });
  const [isLoading, setIsLoading] = useState(true);

  const [unlockedLevels, setUnlockedLevels] = useLocalStorage<Record<string, number>>(`quiz_${quiz.id}_unlockedLevels`, {});
  const [categoryScores, setCategoryScores] = useLocalStorage<Record<string, Record<number, { maxPercentage: number, maxCorrect: number }>>>(`quiz_${quiz.id}_categoryScores`, {});
  const [categoryTimes, setCategoryTimes] = useLocalStorage<Record<string, Record<number, number>>>(`quiz_${quiz.id}_categoryTimes`, {});
  const [currentCategory, setCurrentCategory] = useLocalStorage<string | null>(`quiz_${quiz.id}_currentCategory`, null);
  const [currentLevel, setCurrentLevel] = useLocalStorage<number | null>(`quiz_${quiz.id}_currentLevel`, null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useLocalStorage<number>(`quiz_${quiz.id}_currentQuestionIndex`, 0);
  const [activeQuestions, setActiveQuestions] = useLocalStorage<Question[]>(`quiz_${quiz.id}_activeQuestions`, []);
  const [score, setScore] = useLocalStorage<number>(`quiz_${quiz.id}_score`, 0);
  const [showScore, setShowScore] = useLocalStorage<boolean>(`quiz_${quiz.id}_showScore`, false);
  const [showUploadScreen, setShowUploadScreen] = useState(false);
  const [levelStartTime, setLevelStartTime] = useState<number | null>(null);
  const [currentRunTime, setCurrentRunTime] = useLocalStorage<number | null>(`quiz_${quiz.id}_currentRunTime`, null);
  const [questionCount, setQuestionCount] = useLocalStorage<number>(`quiz_${quiz.id}_questionCount`, 10);
  const [elapsedTime, setElapsedTime] = useLocalStorage<number>(`quiz_${quiz.id}_elapsedTime`, 0);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [cheatClicks, setCheatClicks] = useState<{level: number, count: number}>({level: 0, count: 0});
  const [pausedSession, setPausedSession] = useLocalStorage<PausedSession | null>(`quiz_${quiz.id}_pausedSession`, null);
  
  const [selectedOptions, setSelectedOptions] = useLocalStorage<number[]>(`quiz_${quiz.id}_selectedOptions`, []);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useLocalStorage<boolean>(`quiz_${quiz.id}_isAnswerSubmitted`, false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isCustomData && quiz.isDefault) {
      Promise.all([
        fetch(quiz.questionsUrl!).then(res => res.json()).catch(() => []),
        fetch(quiz.metadataUrl!).then(res => res.json()).catch(() => null)
      ]).then(([questionsData, metadataData]) => {
        try {
          if (questionsData && questionsData.length > 0) {
            const validData = validateQuestions(questionsData);
            setQuestions(validData);
          } else if (questions.length === 0) {
            setShowUploadScreen(true);
          }
        } catch (err: any) {
          console.error('Invalid questions.json schema:', err.message);
          if (questions.length === 0) setShowUploadScreen(true);
        }
        
        if (metadataData) {
          setAppMetadata(metadataData);
        }
        
        setIsLoading(false);
      });
    } else {
      if (questions.length === 0) {
        setShowUploadScreen(true);
      }
      setIsLoading(false);
    }
  }, [isCustomData, quiz]);

  useEffect(() => {
    if (currentLevel && !showScore && levelStartTime === null) {
      setLevelStartTime(Date.now() - elapsedTime * 1000);
    }
  }, [currentLevel, showScore, levelStartTime, elapsedTime]);

  useEffect(() => {
    document.title = appMetadata.title;
  }, [appMetadata.title]);

  const dynamicCategories = React.useMemo(() => {
    const uniqueCategoryIds = [...new Set(questions.map(q => q.category))];
    
    const cats = uniqueCategoryIds.map((catId: string, index: number) => {
      const existing = appMetadata.categories.find(c => c.id === catId);
      const defaultStyle = CATEGORY_STYLES[index % CATEGORY_STYLES.length];
      
      if (existing) {
        return {
          ...existing,
          icon: existing.icon && ICON_MAP[existing.icon] ? ICON_MAP[existing.icon] : ICON_MAP[defaultStyle.icon],
          color: existing.color || defaultStyle.color,
          bg: existing.bg || defaultStyle.bg,
          border: existing.border || defaultStyle.border
        };
      }
      
      const name = catId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      
      return {
        id: catId,
        name: name,
        weight: 'N/A',
        icon: ICON_MAP[defaultStyle.icon],
        color: defaultStyle.color,
        bg: defaultStyle.bg,
        border: defaultStyle.border
      };
    });

    if (questions.length > 0) {
      cats.push({
        id: 'scrambled',
        name: `${appMetadata.title} Scrambled`,
        weight: '100%',
        icon: Shuffle,
        color: 'text-orange-500',
        bg: 'bg-orange-100',
        border: 'border-orange-200'
      });
    }
    
    return cats;
  }, [questions, appMetadata]);

  const maxQuestionsForCategory = React.useMemo(() => {
    if (!currentCategory) return 25;
    if (currentCategory === 'scrambled') return questions.length;
    
    const categoryQuestions = questions.filter(q => q.category === currentCategory);
    const levelCounts = categoryQuestions.reduce((acc, q) => {
      acc[q.level] = (acc[q.level] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    const maxInLevel = Math.max(0, ...(Object.values(levelCounts) as number[]));
    return maxInLevel > 0 ? maxInLevel : 1;
  }, [questions, currentCategory]);

  const displayQuestionCount = Math.min(questionCount, maxQuestionsForCategory);

  const levelQuestions = activeQuestions;
  const currentQuestion = levelQuestions[currentQuestionIndex];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentLevel && !showScore && levelStartTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - levelStartTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentLevel, showScore, levelStartTime]);

  const handleLockedLevelClick = (level: number) => {
    if (!currentCategory) return;
    if (cheatClicks.level === level) {
      const newCount = cheatClicks.count + 1;
      if (newCount >= 3) {
        setUnlockedLevels(prev => ({ ...prev, [currentCategory]: level }));
        setCheatClicks({ level: 0, count: 0 });
      } else {
        setCheatClicks({ level, count: newCount });
      }
    } else {
      setCheatClicks({ level, count: 1 });
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Prevent Denial of Service (DoS) by limiting file size to 5MB
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      alert('File is too large. Maximum size is 5MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (!file.name.endsWith('.json')) {
      alert('Only JSON files are supported.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsLoading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      
      // Use setTimeout to allow the loading spinner to render before parsing blocks the main thread
      setTimeout(() => {
        try {
          const parsed = JSON.parse(content);
          if (parsed.title && Array.isArray(parsed.categories)) {
            setAppMetadata(parsed);
            setIsCustomData(true);
            alert('Metadata loaded successfully!');
            setShowUploadScreen(false);
          } else {
            const validData = validateQuestions(parsed);
            setQuestions(validData);
            setIsCustomData(true);
            alert('Questions loaded successfully!');
            setShowUploadScreen(false);
          }
        } catch (err: any) {
          alert(err.message || 'Invalid JSON format');
        } finally {
          setIsLoading(false);
        }
      }, 100);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startLevel = (level: number, categoryOverride?: string) => {
    setPausedSession(null);
    const categoryToUse = categoryOverride || currentCategory;
    
    let levelQs: Question[] = [];
    if (categoryToUse === 'scrambled') {
      levelQs = [...questions].sort(() => 0.5 - Math.random()).slice(0, displayQuestionCount);
    } else {
      levelQs = questions.filter(q => q.level === level && q.category === categoryToUse);
      levelQs = levelQs.sort(() => 0.5 - Math.random()).slice(0, displayQuestionCount);
    }
    
    if (levelQs.length === 0) {
      alert(`No questions found for level ${level} in this category.`);
      return;
    }
    
    setActiveQuestions(levelQs);
    setCurrentLevel(level);
    setCurrentQuestionIndex(0);
    setScore(0);
    setShowScore(false);
    setSelectedOptions([]);
    setIsAnswerSubmitted(false);
    setLevelStartTime(Date.now());
    setCurrentRunTime(null);
    setElapsedTime(0);
  };

  const handleOptionSelect = (index: number) => {
    if (!isAnswerSubmitted && currentQuestion) {
      const isMulti = Array.isArray(currentQuestion.correctAnswerIndex);
      
      if (isMulti) {
        setSelectedOptions(prev => {
          if (prev.includes(index)) {
            return prev.filter(i => i !== index);
          } else {
            return [...prev, index];
          }
        });
      } else {
        setSelectedOptions([index]);
        setIsAnswerSubmitted(true);
        if (calculateScore([index], currentQuestion.correctAnswerIndex)) {
          setScore(s => s + 1);
        }
      }
    }
  };

  const handleSubmitMulti = () => {
    if (!isAnswerSubmitted && currentQuestion) {
      setIsAnswerSubmitted(true);
      if (calculateScore(selectedOptions, currentQuestion.correctAnswerIndex)) {
        setScore(s => s + 1);
      }
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < levelQuestions.length - 1) {
      setCurrentQuestionIndex(i => i + 1);
      setSelectedOptions([]);
      setIsAnswerSubmitted(false);
    } else {
      const endTime = Date.now();
      const timeTaken = calculateTimeTaken(levelStartTime || endTime, endTime);
      setCurrentRunTime(timeTaken);
      setShowScore(true);
    }
  };

  const handleBackToLevels = () => {
    if (currentCategory === 'scrambled') {
      setCurrentCategory(null);
    }
    setCurrentLevel(null);
    setShowScore(false);
    setShowUploadScreen(false);
  };

  const pauseQuiz = () => {
    if (currentLevel && !showScore) {
      setPausedSession({
        category: currentCategory!,
        level: currentLevel,
        questionIndex: currentQuestionIndex,
        score,
        elapsedTime,
        activeQuestions
      });
      handleBackToLevels();
    }
  };

  const resumeQuiz = () => {
    if (pausedSession) {
      setCurrentCategory(pausedSession.category);
      setCurrentLevel(pausedSession.level);
      setCurrentQuestionIndex(pausedSession.questionIndex);
      setScore(pausedSession.score);
      setElapsedTime(pausedSession.elapsedTime);
      setActiveQuestions(pausedSession.activeQuestions);
      setLevelStartTime(Date.now() - pausedSession.elapsedTime * 1000);
      setShowScore(false);
      setSelectedOptions([]);
      setIsAnswerSubmitted(false);
      setPausedSession(null);
    }
  };

  const percentage = calculatePercentage(score, levelQuestions.length);
  const passed = hasPassedLevel(score, levelQuestions.length);

  useEffect(() => {
    if (showScore && currentCategory) {
      if (passed) {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#4f46e5', '#10b981', '#f59e0b']
        });
        if (currentLevel !== null) {
          setUnlockedLevels(prev => {
            const currentUnlocked = prev[currentCategory] || 1;
            const maxLevel = getCategoryMaxLevel(currentCategory);
            const nextUnlocked = getNextUnlockedLevel(currentLevel, currentUnlocked, passed, maxLevel);
            return { ...prev, [currentCategory]: nextUnlocked };
          });
        }
      }
      if (currentLevel !== null) {
        setCategoryScores(prev => {
          const catScores = prev[currentCategory] || {};
          const existing = catScores[currentLevel] || { maxPercentage: 0, maxCorrect: 0 };
          return {
            ...prev,
            [currentCategory]: {
              ...catScores,
              [currentLevel]: {
                maxPercentage: Math.max(existing.maxPercentage, percentage),
                maxCorrect: Math.max(existing.maxCorrect, score)
              }
            }
          };
        });
        if (currentRunTime !== null) {
          setCategoryTimes(prev => {
            const catTimes = prev[currentCategory] || {};
            const existing = catTimes[currentLevel];
            if (existing === undefined || currentRunTime < existing) {
              return {
                ...prev,
                [currentCategory]: {
                  ...catTimes,
                  [currentLevel]: currentRunTime
                }
              };
            }
            return prev;
          });
        }
      }
    }
  }, [showScore, passed, currentLevel, percentage, currentRunTime, currentCategory]);

  const getCategoryScore = React.useCallback((categoryId: string) => {
    const catScores = categoryScores[categoryId] || {};
    const categoryQuestions = questions.filter(q => q.category === categoryId);
    const uniqueLevels = new Set(categoryQuestions.map(q => q.level));
    
    if (uniqueLevels.size === 0) return { percentage: 0, correct: 0, total: 0 };
    
    let totalCorrect = 0;
    let totalQuestions = 0;
    
    uniqueLevels.forEach(level => {
      const levelQuestionsCount = categoryQuestions.filter(q => q.level === level).length;
      totalQuestions += levelQuestionsCount;
      const levelScore = catScores[level];
      if (levelScore) {
        totalCorrect += levelScore.maxCorrect;
      }
    });
    
    const percentage = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
    return { percentage, correct: totalCorrect, total: totalQuestions };
  }, [categoryScores, questions]);

  const getCategoryMaxLevel = React.useCallback((categoryId: string) => {
    if (categoryId === 'scrambled') return 1;
    const levels = questions.filter(q => q.category === categoryId).map(q => q.level);
    return levels.length > 0 ? Math.max(...levels) : 1;
  }, [questions]);

  const cumulativeScore = React.useMemo(() => {
    let totalScore = 0;
    let totalWeight = 0;
    let totalCorrect = 0;
    let totalQuestions = 0;

    dynamicCategories.forEach(cat => {
      if (cat.id === 'scrambled') return;
      
      const weightMatch = cat.weight ? cat.weight.match(/(\d+)/) : null;
      const weight = weightMatch ? parseInt(weightMatch[1], 10) : 1; // Fallback to 1 if no weight specified
      
      const catScore = getCategoryScore(cat.id);
      totalScore += (catScore.percentage * weight);
      totalWeight += weight;
      totalCorrect += catScore.correct;
      totalQuestions += catScore.total;
    });

    if (totalWeight === 0) return { percentage: 0, correct: 0, total: 0 };
    return { 
      percentage: totalScore / totalWeight,
      correct: totalCorrect,
      total: totalQuestions
    };
  }, [dynamicCategories, getCategoryScore]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
          <div className={`absolute inset-0 rounded-full border-4 border-t-transparent animate-spin border-slate-800`}></div>
        </div>
        <p className="text-slate-600 font-medium animate-pulse">Loading data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-slate-200 selection:text-slate-900 flex justify-center">
      <div className="w-full max-w-md bg-white shadow-xl min-h-screen relative overflow-hidden flex flex-col">
        {/* Header */}
        <header className={`bg-gradient-to-r ${quiz.theme?.from || 'from-indigo-500'} ${quiz.theme?.to || 'to-indigo-600'} text-white p-4 flex items-center justify-between shadow-md z-10`}>
          <div className="flex items-center gap-2 overflow-hidden">
            {(currentLevel || showUploadScreen || currentCategory) ? (
              <button
                onClick={() => {
                  if (currentLevel && !showScore) {
                    pauseQuiz();
                  } else if (currentLevel) {
                    handleBackToLevels();
                  } else if (showUploadScreen) {
                    setShowUploadScreen(false);
                  } else if (currentCategory) {
                    setCurrentCategory(null);
                  }
                }}
                className="p-2 -ml-2 hover:bg-white/20 rounded-full transition-colors shrink-0"
                aria-label="Back"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            ) : (
              <button
                onClick={onBack}
                className="p-2 -ml-2 hover:bg-white/20 rounded-full transition-colors shrink-0"
                aria-label="Back to Quizzes"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            <h1 className="font-bold text-lg tracking-tight truncate">
              {currentLevel 
                ? (currentCategory === 'scrambled' ? `${appMetadata.title} Scrambled` : `Level ${currentLevel}`)
                : showUploadScreen 
                  ? 'Upload' 
                  : currentCategory 
                    ? dynamicCategories.find(c => c.id === currentCategory)?.name 
                    : appMetadata.title}
            </h1>
          </div>
          
          {!currentLevel && !showUploadScreen && !currentCategory && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setShowResetDialog(true)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                aria-label="Reset progress"
                title="Reset all progress"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowUploadScreen(true)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                aria-label="Upload questions"
                title="Load questions via JSON"
              >
                <Upload className="w-5 h-5" />
              </button>
            </div>
          )}

          {currentLevel && !showScore && (
            <div className="flex items-center gap-3 shrink-0">
              <button 
                onClick={pauseQuiz}
                className="p-1 hover:bg-white/20 rounded-full transition-colors flex items-center justify-center"
                aria-label="Pause"
                title="Pause Quiz"
              >
                <Pause className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                <Timer className="w-4 h-4" />
                <span className="w-12 text-center">{formatTime(elapsedTime)}</span>
              </div>
              <div className="font-semibold bg-white/20 px-3 py-1 rounded-full text-sm">
                {currentQuestionIndex + 1} / {levelQuestions.length}
              </div>
            </div>
          )}
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 relative">
          {!currentLevel && !showUploadScreen && pausedSession && (
            <div className="mb-6 p-4 bg-white border-2 border-slate-200 rounded-2xl flex items-center justify-between shadow-sm relative overflow-hidden">
              <div className={`absolute inset-0 opacity-10 bg-gradient-to-r ${quiz.theme?.from || 'from-indigo-500'} ${quiz.theme?.to || 'to-indigo-600'}`}></div>
              <div className="relative z-10">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Pause className="w-4 h-4" /> Quiz Paused
                </h3>
                <p className="text-sm text-slate-600 mt-0.5">
                  {pausedSession.category === 'scrambled' 
                    ? `${appMetadata.title} Scrambled` 
                    : `${dynamicCategories.find(c => c.id === pausedSession.category)?.name} - Level ${pausedSession.level}`}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Question {pausedSession.questionIndex + 1} • {formatTime(pausedSession.elapsedTime)}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={resumeQuiz} 
                  className={`px-4 py-2 bg-gradient-to-r ${quiz.theme?.from || 'from-indigo-500'} ${quiz.theme?.to || 'to-indigo-600'} hover:opacity-90 text-white rounded-xl font-bold text-sm transition-opacity shadow-sm`}
                >
                  Resume
                </button>
                <button 
                  onClick={() => setPausedSession(null)} 
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl font-bold text-sm transition-colors"
                >
                  Discard
                </button>
              </div>
            </div>
          )}
          <AnimatePresence mode="wait">
            {showUploadScreen ? (
              <motion.div
                key="upload-screen"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col h-full pb-8"
              >
                <div className="mb-6 mt-2">
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Upload Files</h2>
                  <p className="text-slate-500 text-sm">
                    Load your own custom question sets via JSON format, or upload a metadata JSON file to customize categories and title.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-8">
                  <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <FileJson className="w-5 h-5" /> Metadata JSON Format
                  </h3>
                  <p className="text-sm text-slate-600 mb-2">
                    To customize categories and app title, upload a JSON object with this structure:
                  </p>
                  <pre className="text-xs bg-slate-800 text-slate-300 p-3 rounded-xl overflow-x-auto mb-4">
{`{
  "title": "My Custom Exam",
  "categories": [
    {
      "id": "fundamentals-ai-ml",
      "name": "Fundamentals of AI",
      "weight": "20%"
    }
  ]
}`}
                  </pre>

                  <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <FileJson className="w-5 h-5" /> Questions JSON Format
                  </h3>
                  <p className="text-sm text-slate-600 mb-2">
                    Your JSON file must be an array of objects with the following structure:
                  </p>
                  <pre className="text-xs bg-slate-800 text-slate-300 p-3 rounded-xl overflow-x-auto">
{`[
  {
    "id": "q1",
    "category": "fundamentals-ai-ml",
    "level": 1,
    "text": "Question text?",
    "options": ["A", "B", "C", "D"],
    "correctAnswerIndex": 0,
    "explanation": "Why A is correct",
    "reference": "https://..."
  }
]`}
                  </pre>
                </div>

                <div className="mt-auto">
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r ${quiz.theme?.from || 'from-indigo-500'} ${quiz.theme?.to || 'to-indigo-600'} hover:opacity-90 transition-opacity shadow-sm active:scale-[0.98] flex items-center justify-center gap-2`}
                  >
                    <FileUp className="w-5 h-5" /> Explore File System
                  </button>
                </div>
              </motion.div>
            ) : !currentCategory ? (
              <motion.div
                key="category-selector"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col h-full pb-8"
              >
                <div className="mb-6 text-center mt-2">
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Your Defined Categories</h2>
                  <p className="text-slate-500 text-sm mb-4">
                    Select a category to practice its levels.
                  </p>
                  
                  <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center shadow-sm">
                    <span className={`text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r ${quiz.theme?.from || 'from-indigo-500'} ${quiz.theme?.to || 'to-indigo-600'} uppercase tracking-wider mb-1`}>Overall Mastery</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-slate-800">{Math.round(cumulativeScore.percentage)}</span>
                      <span className="text-xl font-bold text-slate-500">%</span>
                    </div>
                    <div className="mt-1 text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                      Coverage: {cumulativeScore.correct} / {cumulativeScore.total} questions
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {questions.length === 0 ? (
                    <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <FileJson className="w-8 h-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 mb-2">No Questions Loaded</h3>
                      <p className="text-sm text-slate-500 mb-6">
                        It looks like your question bank is empty. Please upload a JSON file to get started.
                      </p>
                      <button
                        onClick={() => setShowUploadScreen(true)}
                        className={`px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r ${quiz.theme?.from || 'from-indigo-500'} ${quiz.theme?.to || 'to-indigo-600'} hover:opacity-90 transition-opacity shadow-sm`}
                      >
                        Upload Questions
                      </button>
                    </div>
                  ) : (
                    dynamicCategories.map((cat) => {
                      const Icon = cat.icon;
                      const catUnlocked = unlockedLevels[cat.id] || 1;
                      const catScore = getCategoryScore(cat.id);
                      
                      return (
                        <button
                          key={cat.id}
                          onClick={() => {
                            setCurrentCategory(cat.id);
                          }}
                          className={`relative overflow-hidden rounded-2xl border-2 p-4 flex items-center justify-between transition-all bg-white hover:shadow-md active:scale-[0.98] ${cat.border}`}
                        >
                          <div className="flex items-center gap-4 relative z-10">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${cat.bg} ${cat.color}`}>
                              <Icon className="w-6 h-6" />
                            </div>
                            <div className="text-left">
                              <h3 className="font-bold text-lg leading-tight text-slate-800">
                                {cat.name}
                              </h3>
                              <p className="text-sm text-slate-500 mt-0.5 font-medium">
                                {cat.id === 'scrambled' ? 'Random Questions' : `Weight: ${cat.weight} • Level ${catUnlocked}/${getCategoryMaxLevel(cat.id)}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 relative z-10">
                            {cat.id !== 'scrambled' && (
                              <div className="text-right flex flex-col items-end">
                                <span className={`text-lg font-bold ${cat.color} leading-none`}>
                                  {Math.round(catScore.percentage)}%
                                </span>
                                <span className="text-[10px] font-medium text-slate-400 mt-1">
                                  {catScore.correct}/{catScore.total}
                                </span>
                              </div>
                            )}
                            <div className="shrink-0">
                              <ChevronLeft className="w-5 h-5 text-slate-400 rotate-180" />
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </motion.div>
            ) : !currentLevel ? (
              <motion.div
                key="level-selector"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col h-full pb-8"
              >
                <div className="mb-6 text-center mt-2">
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">
                    {dynamicCategories.find(c => c.id === currentCategory)?.name}
                  </h2>
                  <p className="text-slate-500 text-sm mb-4">
                    {currentCategory === 'scrambled' 
                      ? 'Practice with a random mix of questions from all categories.' 
                      : 'Score 70% or higher to unlock the next level.'}
                  </p>
                  
                  <div className="flex items-center justify-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100 max-w-md mx-auto">
                    <label htmlFor="questionCount" className="text-sm font-medium text-slate-700 whitespace-nowrap">
                      Questions per level:
                    </label>
                    <div className="flex items-center gap-3 w-full">
                      <input 
                        type="range" 
                        id="questionCount" 
                        min="1" 
                        max={maxQuestionsForCategory} 
                        value={displayQuestionCount} 
                        onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-600"
                      />
                      <span className="text-slate-600 font-bold w-8 text-right">{displayQuestionCount}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {currentCategory === 'scrambled' ? (
                    <button
                      onClick={() => startLevel(1)}
                      className="relative overflow-hidden rounded-2xl border-2 p-4 flex items-center justify-between transition-all bg-white border-orange-100 hover:border-orange-300 hover:shadow-md active:scale-[0.98]"
                    >
                      <div className="flex items-center gap-4 relative z-10">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-orange-100 text-orange-500">
                          <Play className="w-6 h-6 ml-1" />
                        </div>
                        <div className="text-left">
                          <h3 className="font-bold text-lg text-slate-800">Start Random Mix</h3>
                          <p className="text-sm text-slate-500 font-medium">
                            {displayQuestionCount} questions from all categories
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 ml-2 relative z-10">
                        <ChevronLeft className="w-5 h-5 text-slate-400 rotate-180" />
                      </div>
                    </button>
                  ) : (
                    LEVEL_NAMES.slice(0, currentCategory ? getCategoryMaxLevel(currentCategory) : 10).map((name, i) => {
                      const level = i + 1;
                      const currentUnlocked = currentCategory ? (unlockedLevels[currentCategory] || 1) : 1;
                      const isLocked = level > currentUnlocked;
                      const levelQCount = questions.filter(q => q.level === level && q.category === currentCategory).length;
                      const catScores = currentCategory ? (categoryScores[currentCategory] || {}) : {};
                      const bestScoreObj = catScores[level] || { maxPercentage: 0, maxCorrect: 0 };
                      const bestScore = bestScoreObj.maxPercentage;
                      const bestCorrect = bestScoreObj.maxCorrect;
                      const catTimes = currentCategory ? (categoryTimes[currentCategory] || {}) : {};
                      const bestTime = catTimes[level];
                      
                      return (
                        <button
                          key={level}
                          onClick={() => {
                            if (isLocked) {
                              handleLockedLevelClick(level);
                            } else {
                              startLevel(level);
                            }
                          }}
                          className={`relative overflow-hidden rounded-2xl border-2 p-4 flex items-center justify-between transition-all ${
                            isLocked 
                              ? 'bg-slate-50 border-slate-100 opacity-70 cursor-pointer' 
                              : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md active:scale-[0.98]'
                          }`}
                        >
                          {/* Progress Bar Background */}
                          {!isLocked && bestScore > 0 && (
                            <div 
                              className={`absolute left-0 top-0 bottom-0 opacity-20 transition-all duration-1000 ease-out ${
                                bestScore >= 70 ? 'bg-emerald-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${bestScore}%` }}
                            />
                          )}
                          
                          <div className="flex items-center gap-4 relative z-10">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg shrink-0 ${
                              isLocked ? 'bg-slate-200 text-slate-400' : 'bg-slate-100 text-slate-800 shadow-sm'
                            }`}>
                              {level}
                            </div>
                            <div className="text-left">
                              <h3 className={`font-bold text-lg leading-tight ${isLocked ? 'text-slate-500' : 'text-slate-800'}`}>
                                {name}
                              </h3>
                              <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-2">
                                <span>{levelQCount} Questions</span>
                                {!isLocked && bestScore > 0 && bestTime !== undefined && (
                                  <>
                                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                                    <span className="flex items-center gap-1">
                                      <Timer className="w-3.5 h-3.5" /> {formatTime(bestTime)}
                                    </span>
                                  </>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 relative z-10">
                            {!isLocked && bestScore > 0 && (
                              <div className="text-right flex flex-col items-end">
                                <span className={`font-bold text-sm leading-none ${bestScore >= 70 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                  {Math.round(bestScore)}%
                                </span>
                                <span className="text-[10px] font-medium text-slate-400 mt-1">
                                  {bestCorrect}/{levelQCount}
                                </span>
                              </div>
                            )}
                            <div className="shrink-0">
                              {isLocked ? (
                                <Lock className="w-5 h-5 text-slate-400" />
                              ) : (
                                <Play className="w-5 h-5 text-slate-600" />
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </motion.div>
            ) : showScore ? (
              <motion.div
                key="score-screen"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center h-full text-center pb-20"
              >
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                  className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 ${
                    passed ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                  }`}
                >
                  {passed ? <PartyPopper className="w-12 h-12" /> : <Frown className="w-12 h-12" />}
                </motion.div>
                
                <h2 className="text-3xl font-black text-slate-800 mb-2">
                  {passed ? 'Level Passed!' : 'Level Failed'}
                </h2>
                
                <div className="text-6xl font-black my-6 tracking-tighter">
                  <span className={passed ? 'text-emerald-600' : 'text-rose-600'}>
                    {percentage}%
                  </span>
                </div>
                
                <p className="text-slate-600 mb-8 text-lg">
                  You scored {score} out of {levelQuestions.length}.
                  <br />
                  Time: <span className="font-semibold">{currentRunTime !== null ? formatTime(currentRunTime) : '--'}</span>
                  <br />
                  {currentCategory === 'scrambled' 
                    ? (passed ? "Great job! You passed the scrambled exam." : "You need at least 70% to pass. Keep trying!")
                    : (passed 
                        ? (currentLevel < getCategoryMaxLevel(currentCategory) ? "Great job! You've unlocked the next level." : "Great job! You've mastered this category.") 
                        : "You need at least 70% to pass. Keep trying!")}
                </p>

                <div className="w-full flex flex-col gap-3 mt-auto">
                  {passed && currentCategory !== 'scrambled' && currentLevel < getCategoryMaxLevel(currentCategory) ? (
                    <button
                      onClick={() => startLevel(currentLevel + 1)}
                      className={`w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r ${quiz.theme?.from || 'from-indigo-500'} ${quiz.theme?.to || 'to-indigo-600'} hover:opacity-90 transition-opacity shadow-sm active:scale-[0.98] flex items-center justify-center gap-2`}
                    >
                      Next Level <ArrowRight className="w-5 h-5" />
                    </button>
                  ) : !passed ? (
                    <button
                      onClick={() => startLevel(currentLevel)}
                      className={`w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r ${quiz.theme?.from || 'from-indigo-500'} ${quiz.theme?.to || 'to-indigo-600'} hover:opacity-90 transition-opacity shadow-sm active:scale-[0.98] flex items-center justify-center gap-2`}
                    >
                      Retry Level <RotateCcw className="w-5 h-5" />
                    </button>
                  ) : null}
                  
                  <button
                    onClick={handleBackToLevels}
                    className="w-full py-4 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors shadow-sm active:scale-[0.98]"
                  >
                    {currentCategory === 'scrambled' ? 'Back to Categories' : 'Back to Levels'}
                  </button>
                </div>
              </motion.div>
            ) : currentQuestion ? (
              <motion.div
                key={`question-${currentLevel}-${currentQuestionIndex}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col h-full pb-24"
              >
                <div className="mb-6">
                  <span className={`bg-clip-text text-transparent bg-gradient-to-r ${quiz.theme?.from || 'from-indigo-500'} ${quiz.theme?.to || 'to-indigo-600'} font-bold text-sm tracking-wider uppercase mb-2 block`}>
                    {currentCategory === 'scrambled' ? `${appMetadata.title.toUpperCase()} SCRAMBLED` : LEVEL_NAMES[currentLevel - 1]}
                  </span>
                  <h2 className="text-xl font-semibold text-slate-800 leading-snug">
                    {currentQuestion.text}
                  </h2>
                </div>

                <div className="flex flex-col gap-3">
                  {currentQuestion.options.map((option, index) => {
                    const isSelected = selectedOptions.includes(index);
                    const correctIndices = Array.isArray(currentQuestion.correctAnswerIndex) 
                      ? currentQuestion.correctAnswerIndex 
                      : [currentQuestion.correctAnswerIndex];
                    const isCorrect = correctIndices.includes(index);
                    
                    let buttonClass = "w-full text-left p-4 rounded-xl border-2 transition-all relative overflow-hidden group ";
                    
                    if (!isAnswerSubmitted) {
                      buttonClass += isSelected
                        ? "border-transparent shadow-md text-slate-900"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700";
                    } else {
                      if (isCorrect) {
                        buttonClass += "border-emerald-500 bg-emerald-50 text-emerald-900";
                      } else if (isSelected && !isCorrect) {
                        buttonClass += "border-rose-500 bg-rose-50 text-rose-900";
                      } else {
                        buttonClass += "border-slate-200 opacity-50 text-slate-500";
                      }
                    }

                    return (
                      <button
                        key={index}
                        onClick={() => handleOptionSelect(index)}
                        disabled={isAnswerSubmitted}
                        className={buttonClass}
                      >
                        {isSelected && !isAnswerSubmitted && (
                          <div className={`absolute inset-0 opacity-10 pointer-events-none bg-gradient-to-r ${quiz.theme?.from || 'from-indigo-500'} ${quiz.theme?.to || 'to-indigo-600'}`}></div>
                        )}
                        <div className="flex items-center justify-between relative z-10">
                           <div className="flex items-center gap-3">
                            {Array.isArray(currentQuestion.correctAnswerIndex) && (
                              <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${isSelected ? `bg-gradient-to-br ${quiz.theme?.from || 'from-indigo-500'} ${quiz.theme?.to || 'to-indigo-600'} border-transparent` : 'border-slate-300'}`}>
                                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                              </div>
                            )}
                            <span className="font-medium">{option}</span>
                          </div>
                          {isAnswerSubmitted && isCorrect && (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 ml-2" />
                          )}
                          {isAnswerSubmitted && isSelected && !isCorrect && (
                            <XCircle className="w-5 h-5 text-rose-600 shrink-0 ml-2" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {Array.isArray(currentQuestion.correctAnswerIndex) && !isAnswerSubmitted && (
                  <button
                    onClick={handleSubmitMulti}
                    disabled={selectedOptions.length === 0}
                    className={`mt-4 w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r ${quiz.theme?.from || 'from-indigo-500'} ${quiz.theme?.to || 'to-indigo-600'} hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity shadow-sm`}
                  >
                    Submit Answer
                  </button>
                )}

                <AnimatePresence>
                  {isAnswerSubmitted && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      className="mt-6 overflow-hidden"
                    >
                      <div className={`p-4 rounded-xl border ${
                        (() => {
                          const correctIndices = Array.isArray(currentQuestion.correctAnswerIndex) 
                            ? currentQuestion.correctAnswerIndex 
                            : [currentQuestion.correctAnswerIndex];
                          const isFullyCorrect = selectedOptions.length === correctIndices.length && 
                                                 selectedOptions.every(i => correctIndices.includes(i));
                          return isFullyCorrect ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200";
                        })()
                      }`}>
                        <div className="flex items-start gap-3">
                          {(() => {
                            const correctIndices = Array.isArray(currentQuestion.correctAnswerIndex) 
                              ? currentQuestion.correctAnswerIndex 
                              : [currentQuestion.correctAnswerIndex];
                            const isFullyCorrect = selectedOptions.length === correctIndices.length && 
                                                   selectedOptions.every(i => correctIndices.includes(i));
                            return isFullyCorrect ? (
                              <div className="bg-emerald-100 p-1.5 rounded-full shrink-0 mt-0.5">
                                <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                              </div>
                            ) : (
                              <div className="bg-rose-100 p-1.5 rounded-full shrink-0 mt-0.5">
                                <XCircle className="w-5 h-5 text-rose-700" />
                              </div>
                            );
                          })()}
                          <div>
                            <h3 className={`font-bold mb-1 ${
                              (() => {
                                const correctIndices = Array.isArray(currentQuestion.correctAnswerIndex) 
                                  ? currentQuestion.correctAnswerIndex 
                                  : [currentQuestion.correctAnswerIndex];
                                const isFullyCorrect = selectedOptions.length === correctIndices.length && 
                                                       selectedOptions.every(i => correctIndices.includes(i));
                                return isFullyCorrect ? "text-emerald-800" : "text-rose-800";
                              })()
                            }`}>
                              {(() => {
                                const correctIndices = Array.isArray(currentQuestion.correctAnswerIndex) 
                                  ? currentQuestion.correctAnswerIndex 
                                  : [currentQuestion.correctAnswerIndex];
                                const isFullyCorrect = selectedOptions.length === correctIndices.length && 
                                                       selectedOptions.every(i => correctIndices.includes(i));
                                return isFullyCorrect ? "Correct!" : "Incorrect";
                              })()}
                            </h3>
                            <p className="text-slate-700 text-sm leading-relaxed mb-2">
                              {currentQuestion.explanation}
                            </p>
                            {currentQuestion.reference && (
                              <a
                                href={currentQuestion.reference}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900 underline underline-offset-2 transition-colors"
                              >
                                Documentation <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </main>

        {/* Bottom Action Bar */}
        <AnimatePresence>
          {currentLevel && !showScore && isAnswerSubmitted && (
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20"
            >
              <button
                onClick={handleNext}
                className="w-full py-4 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-sm active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {currentQuestionIndex < levelQuestions.length - 1 ? (
                  <>
                    Next Question <ArrowRight className="w-5 h-5" />
                  </>
                ) : (
                  <>
                    See Results <Trophy className="w-5 h-5 text-yellow-400" />
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reset Dialog */}
        <AnimatePresence>
          {showResetDialog && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
              >
                <h3 className="text-xl font-bold text-slate-800 mb-2">Reset Progress?</h3>
                <p className="text-slate-600 mb-6">Are you sure you want to reset all your unlocked levels, scores, and best times? This action cannot be undone.</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowResetDialog(false)}
                    className="flex-1 py-3 rounded-xl font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setUnlockedLevels({});
                      setCategoryScores({});
                      setCategoryTimes({});
                      setPausedSession(null);
                      setCurrentCategory(null);
                      setCurrentLevel(null);
                      setScore(0);
                      setElapsedTime(0);
                      setIsCustomData(false);
                      setShowResetDialog(false);
                    }}
                    className="flex-1 py-3 rounded-xl font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm"
                  >
                    Reset
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
