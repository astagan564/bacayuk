import { useCallback, useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import type { VocabularyQuiz } from '@/types';
import { createQuizOptionOrders } from '@/features/reader/helpers/vocabularyQuiz';
import { speechEngine } from '@/utils/speechEngine';

interface VocabularyQuizControllerOptions {
  quiz: VocabularyQuiz;
  onClose: () => void;
}

export function useVocabularyQuizController({ quiz, onClose }: VocabularyQuizControllerOptions) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [optionOrders, setOptionOrders] = useState(() => createQuizOptionOrders(quiz));
  const answerLockedRef = useRef(false);
  const navigationLockedRef = useRef(false);

  const question = quiz.questions[currentQuestionIndex];
  const displayedOptions = question
    ? optionOrders[currentQuestionIndex] || question.optionsId
    : [];

  const handleOptionClick = useCallback((option: string) => {
    if (!question || answerLockedRef.current) return;
    answerLockedRef.current = true;
    setSelectedOption(option);
    setIsAnswered(true);

    const isCorrect = option === question.correctTranslationId;
    if (isCorrect) {
      setScore((currentScore) => currentScore + 1);
      void confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      speechEngine.speak(
        `Great job! ${question.wordEn} means ${question.correctTranslationId}`,
        0.95,
        1,
        { language: 'en-US' },
      );
      return;
    }

    speechEngine.speak('Try again next time!', 0.95, 1, { language: 'en-US' });
  }, [question]);

  const handleNextQuestion = useCallback(() => {
    if (!isAnswered || navigationLockedRef.current) return;
    navigationLockedRef.current = true;
    speechEngine.stop();

    if (currentQuestionIndex + 1 < quiz.questions.length) {
      setCurrentQuestionIndex((currentIndex) => currentIndex + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      answerLockedRef.current = false;
      return;
    }

    setIsFinished(true);
    void confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 } });
  }, [currentQuestionIndex, isAnswered, quiz.questions.length]);

  const handleSpeakWord = useCallback(() => {
    if (question) speechEngine.speak(question.wordEn, 0.9, 1, { language: 'en-US' });
  }, [question]);

  const handleRestart = useCallback(() => {
    speechEngine.stop();
    answerLockedRef.current = false;
    navigationLockedRef.current = false;
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setIsFinished(false);
    setOptionOrders(createQuizOptionOrders(quiz));
  }, [quiz]);

  const handleClose = useCallback(() => {
    speechEngine.stop();
    onClose();
  }, [onClose]);

  useEffect(() => {
    navigationLockedRef.current = false;
  }, [currentQuestionIndex, isFinished]);

  useEffect(() => () => speechEngine.stop(), []);

  return {
    currentQuestionIndex,
    selectedOption,
    isAnswered,
    score,
    isFinished,
    question,
    displayedOptions,
    totalQuestions: quiz.questions.length,
    handleOptionClick,
    handleNextQuestion,
    handleSpeakWord,
    handleRestart,
    handleClose,
  };
}

export type VocabularyQuizController = ReturnType<typeof useVocabularyQuizController>;
