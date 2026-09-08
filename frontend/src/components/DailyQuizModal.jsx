import { useEffect, useState } from 'react';
import { ArrowLeft, Award, CheckCircle, Clock, Flame, Lock, ShieldAlert, Sparkles, Trophy, X } from 'lucide-react';
import { apiRequest } from '../api/client';

export default function DailyQuizModal({ onClose, onQuizComplete }) {
  const [quizData, setQuizData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [countdown, setCountdown] = useState('');

  const fetchQuiz = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/api/vault/daily-quiz');
      const data = res.data || res;
      setQuizData(data);
    } catch (err) {
      console.error('Failed to fetch daily quiz:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuiz();
  }, []);

  // 24-Hour Countdown Timer calculation
  useEffect(() => {
    let timer;
    if (quizData?.levels) {
      const lockedLevel = quizData.levels.find((l) => l.status === 'locked' && l.unlocks_at);
      if (lockedLevel && lockedLevel.unlocks_at) {
        const target = new Date(lockedLevel.unlocks_at).getTime();

        const updateCountdown = () => {
          const now = Date.now();
          const diff = target - now;
          if (diff <= 0) {
            setCountdown('Unlocking now...');
            clearInterval(timer);
          } else {
            const hrs = Math.floor(diff / (1000 * 60 * 60));
            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const secs = Math.floor((diff % (1000 * 60)) / 1000);
            setCountdown(`${hrs}h ${mins}m ${secs}s`);
          }
        };

        updateCountdown();
        timer = setInterval(updateCountdown, 1000);
      }
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [quizData]);

  const activeQuiz = quizData?.active_quiz;
  const questions = activeQuiz?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];

  const handleSelectOption = (questionId, optionKey) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionKey,
    }));
  };

  const handleSubmit = async () => {
    if (isSubmitting || !activeQuiz) return;
    setIsSubmitting(true);
    try {
      const res = await apiRequest('/api/vault/daily-quiz/submit', {
        method: 'POST',
        body: {
          quiz_id: activeQuiz.quiz_id,
          level: activeQuiz.level,
          answers: selectedAnswers,
        },
      });
      const data = res.data || res;
      setResult(data);
      if (onQuizComplete) onQuizComplete();
    } catch (err) {
      console.error('Quiz submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans overflow-hidden animate-fadeIn">
      {/* HEADER */}
      <header className="sticky top-0 z-30 w-full bg-[var(--bg-card)] border-b border-[var(--border-color)] px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="p-2 rounded-full hover:bg-[var(--button-background)] text-[var(--text-primary)] transition"
            onClick={onClose}
            aria-label="Close Daily Quiz"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <Flame className="w-3 h-3" /> Daily Challenge
              </span>
            </div>
            <h2 className="m-0 text-base font-bold text-[var(--text-primary)]">Daily Quiz Game</h2>
          </div>
        </div>

        <button
          type="button"
          className="p-2 rounded-full hover:bg-[var(--button-background)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* WORKSPACE CONTENT */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-3xl mx-auto w-full space-y-6">
        {/* LEVEL PROGRESSION MAP */}
        <div className="surface p-4 rounded-3xl border border-[var(--border-color)] space-y-3">
          <p className="m-0 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Quiz Levels Map</p>
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
            {(quizData?.levels || [1, 2, 3, 4, 5]).map((lvl, i) => {
              const isObj = typeof lvl === 'object';
              const levelNum = isObj ? lvl.level : lvl;
              const status = isObj ? lvl.status : levelNum === 1 ? 'unlocked' : 'locked';

              return (
                <div key={levelNum} className="flex flex-col items-center min-w-[60px]">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm shadow-sm transition ${
                      status === 'completed'
                        ? 'bg-emerald-600 text-white'
                        : status === 'unlocked'
                        ? 'text-white ring-2 ring-[var(--brand-orange)]/40 animate-bounce'
                        : 'bg-[var(--button-background)] text-[var(--text-muted)] border border-[var(--border-color)]'
                    }`}
                    style={status === 'unlocked' ? { background: 'var(--brand-gradient)' } : {}}
                  >
                    {status === 'completed' ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : status === 'locked' ? (
                      <Lock className="w-4 h-4" />
                    ) : (
                      levelNum
                    )}
                  </div>
                  <span className="text-[10px] font-bold mt-1 text-[var(--text-secondary)]">Lvl {levelNum}</span>
                </div>
              );
            })}
          </div>

          {countdown && (
            <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-[var(--brand-soft)] border border-[var(--brand-soft-border)] text-[var(--brand-orange)] text-xs font-semibold">
              <Clock className="w-4 h-4" />
              <span>Next Level unlocks in: <strong>{countdown}</strong></span>
            </div>
          )}
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div className="text-center py-12 text-sm text-[var(--text-muted)]">Loading Daily Challenge...</div>
        )}

        {/* COMPLETED RESULT VIEW */}
        {result && (
          <div className="surface p-8 rounded-3xl border border-[var(--border-color)] text-center space-y-5 animate-fadeIn">
            <div
              className="w-20 h-20 rounded-full text-white mx-auto flex items-center justify-center shadow-xl"
              style={{ background: 'var(--brand-gradient)', boxShadow: '0 8px 24px var(--brand-glow)' }}
            >
              <Trophy className="w-10 h-10 animate-bounce" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] m-0">🎉 Quiz Completed!</h2>
              <p className="text-xs text-[var(--text-muted)] mt-1">Level {activeQuiz?.level} Mastered</p>
            </div>

            <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
              <div className="p-3 rounded-2xl bg-[var(--button-background)] border border-[var(--border-color)]">
                <p className="m-0 text-lg font-bold text-[var(--brand-orange)]">{result.score} / {result.total_questions}</p>
                <p className="m-0 text-[10px] text-[var(--text-muted)]">Score</p>
              </div>
              <div className="p-3 rounded-2xl bg-[var(--button-background)] border border-[var(--border-color)]">
                <p className="m-0 text-lg font-bold text-emerald-500">{result.accuracy_percentage}%</p>
                <p className="m-0 text-[10px] text-[var(--text-muted)]">Accuracy</p>
              </div>
              <div className="p-3 rounded-2xl bg-[var(--button-background)] border border-[var(--border-color)]">
                <p className="m-0 text-lg font-bold text-[var(--brand-amber)]">+{result.xp_earned} XP</p>
                <p className="m-0 text-[10px] text-[var(--text-muted)]">Earned</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-[var(--brand-soft)] border border-[var(--brand-soft-border)] text-[var(--brand-orange)] text-xs font-semibold flex items-center justify-center gap-2">
              <Clock className="w-4 h-4" />
              Level {activeQuiz?.level + 1} unlocks in 24 hours (Server Verified)
            </div>

            <button
              type="button"
              className="px-6 py-3 rounded-full text-white text-xs font-bold transition hover:opacity-95 active:scale-95 cursor-pointer"
              style={{ background: 'var(--brand-gradient)', boxShadow: '0 4px 14px var(--brand-glow)' }}
              onClick={onClose}
            >
              Return to Command Center
            </button>
          </div>
        )}

        {/* ACTIVE QUESTION CARD */}
        {!loading && !result && currentQuestion && (
          <div className="surface p-6 rounded-3xl border border-[var(--border-color)] space-y-6">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <span className="text-xs font-bold text-[var(--brand-orange)] uppercase tracking-wider">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <span className="text-xs font-bold text-[var(--brand-amber)] flex items-center gap-1">
                <Award className="w-3.5 h-3.5" /> +100 XP
              </span>
            </div>

            <h3 className="text-base font-bold text-[var(--text-primary)] leading-relaxed m-0">
              {currentQuestion.question}
            </h3>

            {/* OPTIONS GRID */}
            <div className="space-y-3">
              {['A', 'B', 'C', 'D'].map((key) => {
                const optText = currentQuestion[`option_${key.toLowerCase()}`];
                const isSelected = selectedAnswers[currentQuestion.id] === key;
                return (
                  <button
                    key={key}
                    type="button"
                    className={`w-full flex items-center gap-3 p-4 rounded-2xl border text-left text-xs font-medium transition ${
                      isSelected
                        ? 'border-[var(--brand-orange)] bg-[var(--brand-soft)] text-[var(--text-primary)] font-bold shadow-xs'
                        : 'border-[var(--border-color)] bg-[var(--bg-input)] hover:bg-[var(--button-background)] text-[var(--text-primary)]'
                    }`}
                    onClick={() => handleSelectOption(currentQuestion.id, key)}
                  >
                    <span
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${
                        isSelected ? 'bg-[var(--brand-orange)] text-white' : 'bg-[var(--button-background)] text-[var(--text-secondary)]'
                      }`}
                    >
                      {key}
                    </span>
                    <span className="flex-1">{optText}</span>
                  </button>
                );
              })}
            </div>

            {/* NAVIGATION BUTTONS */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                disabled={currentQuestionIndex === 0}
                className="px-4 py-2 rounded-xl bg-[var(--button-background)] disabled:opacity-40 text-xs font-bold text-[var(--text-primary)] cursor-pointer"
                onClick={() => setCurrentQuestionIndex((i) => i - 1)}
              >
                Previous
              </button>

              {currentQuestionIndex < questions.length - 1 ? (
                <button
                  type="button"
                  disabled={!selectedAnswers[currentQuestion.id]}
                  className="px-5 py-2 rounded-xl disabled:opacity-40 text-xs font-bold text-white shadow-sm transition hover:opacity-95 active:scale-95 cursor-pointer"
                  style={{ background: 'var(--brand-gradient)', boxShadow: '0 4px 12px var(--brand-glow)' }}
                  onClick={() => setCurrentQuestionIndex((i) => i + 1)}
                >
                  Next Question
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSubmitting || Object.keys(selectedAnswers).length < questions.length}
                  className="px-6 py-2.5 rounded-xl disabled:opacity-40 text-xs font-bold text-white shadow-md transition hover:opacity-95 active:scale-95 cursor-pointer"
                  style={{ background: 'var(--brand-gradient)', boxShadow: '0 4px 12px var(--brand-glow)' }}
                  onClick={handleSubmit}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Answers'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
