import { useEffect, useState } from 'react';
import { BarChart3, BookOpen, CheckCircle, Clock, Flame, Headphones, Play, Plus, Sparkles, Trophy, Video, FileText, CheckSquare, Square } from 'lucide-react';
import { apiRequest } from '../api/client';
import { useStudy } from '../context/StudyContext';
import StudyRoomModal from './StudyRoomModal';
import DailyQuizModal from './DailyQuizModal';
import VaultAnalyticsModal from './VaultAnalyticsModal';
import AiAssistantModal from './AiAssistantModal';

export default function VaultView() {
  const { toggleTaskCompletion, openAiHub } = useStudy();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Active modals
  const [activeStudyItem, setActiveStudyItem] = useState(null);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);

  const fetchSummary = async () => {
    try {
      const res = await apiRequest('/api/vault/summary');
      const data = res.data || res;
      setSummary(data);
    } catch (err) {
      console.error('Failed to fetch vault summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const formatHoursMinutes = (totalSecs) => {
    if (!totalSecs || totalSecs <= 0) return '0 min';
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins} min`;
  };

  const focusItem = summary?.today_focus;
  const studiedSecs = summary?.today_studied_seconds || 0;
  const subjects = summary?.subjects || [];
  const tasks = summary?.tasks || [];
  const recentMaterials = summary?.recent_materials || [];
  const xpData = summary?.xp || { total_xp: 0, quiz_streak: 0, current_level: 1 };

  return (
    <section className="pt-2 pb-16 space-y-6 relative" aria-labelledby="vault-title">
      {/* MODALS */}
      {activeStudyItem && (
        <StudyRoomModal
          item={activeStudyItem}
          onClose={() => setActiveStudyItem(null)}
          onSessionUpdate={() => fetchSummary()}
        />
      )}

      {showQuizModal && (
        <DailyQuizModal
          onClose={() => setShowQuizModal(false)}
          onQuizComplete={() => fetchSummary()}
        />
      )}

      {showAnalyticsModal && (
        <VaultAnalyticsModal onClose={() => setShowAnalyticsModal(false)} />
      )}

      {/* TOP COMMAND CENTER HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div>
          <span className="px-2.5 py-0.5 rounded-full bg-[var(--brand-soft)] text-[var(--brand-orange)] border border-[var(--brand-soft-border)] text-[10px] font-bold uppercase tracking-wider">
            Academic Command Center
          </span>
          <h1 id="vault-title" className="display-face m-0 mt-1 text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
            Study Vault
          </h1>
        </div>

        {/* TOP RIGHT CONTROLS: [ AI Hub ] [ Analytics ] */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-white text-xs font-bold hover:opacity-95 active:scale-95 transition cursor-pointer"
            style={{ background: 'var(--brand-gradient)', boxShadow: '0 4px 14px var(--brand-glow)' }}
            onClick={openAiHub}
          >
            <Sparkles className="w-4 h-4 text-amber-200 animate-pulse" /> AI Hub
          </button>

          <button
            type="button"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[var(--button-background)] hover:bg-[var(--border-color)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-primary)] transition shadow-xs cursor-pointer"
            onClick={() => setShowAnalyticsModal(true)}
          >
            <BarChart3 className="w-4 h-4 text-[var(--brand-orange)]" /> Analytics
          </button>
        </div>
      </div>

      {/* TODAY'S FOCUS CARD */}
      <div className="surface relative overflow-hidden rounded-3xl p-6 border border-[var(--border)] space-y-4">
        <div className="flex items-center justify-between">
          <span className="px-3 py-1 rounded-full bg-[var(--brand-soft)] text-[var(--brand-orange)] border border-[var(--brand-soft-border)] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" /> Today's Focus
          </span>
          <span className="text-xs text-[var(--text-muted)] font-medium flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Studied: {formatHoursMinutes(studiedSecs)}
          </span>
        </div>

        <div>
          <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            {focusItem?.subject_name || 'Machine Learning'}
          </span>
          <h2 className="m-0 text-xl sm:text-2xl font-bold text-[var(--text-primary)] mt-0.5">
            {focusItem?.title || 'Neural Networks — Chapter 4'}
          </h2>
          <p className="m-0 text-xs text-[var(--text-muted)] mt-1 font-medium">{focusItem?.topic || 'Deep Learning'}</p>
        </div>

        {/* PROGRESS BAR */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-[var(--text-secondary)]">Progress</span>
            <span className="text-[var(--brand-orange)]">{focusItem?.progress_percentage || 0}%</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-[var(--surface-secondary)] overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#FF3218] via-[#FF641F] to-[#FFD04A] transition-all duration-500"
              style={{ width: `${Math.max(5, focusItem?.progress_percentage || 0)}%` }}
            />
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between">
          <span className="text-xs text-[var(--text-muted)]">
            {formatHoursMinutes(focusItem?.last_position_seconds || 0)} studied · Ready to continue
          </span>

          <button
            type="button"
            className="px-5 py-2.5 rounded-full text-white text-xs font-bold transition flex items-center gap-2 transform hover:scale-105 active:scale-95 cursor-pointer"
            style={{ background: 'var(--brand-gradient)', boxShadow: '0 4px 14px var(--brand-glow)' }}
            onClick={() => setActiveStudyItem(focusItem)}
          >
            <Play className="w-4 h-4 fill-white" /> Continue Studying
          </button>
        </div>
      </div>

      {/* 🎮 DAILY QUIZ GAME BANNER */}
      <div className="surface p-5 rounded-3xl border border-[var(--border)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="p-3 rounded-2xl text-white shadow-md"
            style={{ background: 'var(--brand-gradient)', boxShadow: '0 4px 12px var(--brand-glow)' }}
          >
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="m-0 text-base font-bold text-[var(--text-primary)]">Daily Quiz Challenge</h3>
              <span className="px-2 py-0.5 rounded-full bg-[var(--brand-soft)] text-[var(--brand-orange)] border border-[var(--brand-soft-border)] text-[10px] font-bold flex items-center gap-1">
                <Flame className="w-3 h-3" /> {xpData.quiz_streak}d streak
              </span>
            </div>
            <p className="m-0 text-xs text-[var(--text-muted)] mt-0.5">
              Complete Level {xpData.current_level} quiz challenge for +100 XP
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="m-0 text-sm font-bold text-[var(--brand-orange)]">{xpData.total_xp} XP</p>
            <p className="m-0 text-[10px] text-[var(--text-muted)]">Total Reward</p>
          </div>
          <button
            type="button"
            className="px-5 py-2.5 rounded-full text-white text-xs font-bold transition transform hover:scale-105 active:scale-95 cursor-pointer"
            style={{ background: 'var(--brand-gradient)', boxShadow: '0 4px 14px var(--brand-glow)' }}
            onClick={() => setShowQuizModal(true)}
          >
            Start Quiz
          </button>
        </div>
      </div>

      {/* TWO COLUMN DASHBOARD GRID */}
      <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        {/* LEFT COLUMN: TODAY'S TASKS & MY SUBJECTS */}
        <div className="space-y-6">
          {/* TODAY'S TASKS */}
          <div className="surface p-5 rounded-3xl border border-[var(--border-color)] space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <h3 className="m-0 text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
                Today's Tasks ({tasks.filter((t) => !t.completed).length})
              </h3>
            </div>

            <div className="space-y-2">
              {tasks.length > 0 ? (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition ${
                      task.completed
                        ? 'bg-[var(--button-background)] border-[var(--border-color)] opacity-60'
                        : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-[var(--brand-orange)]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        className="text-[var(--brand-orange)] hover:scale-110 transition cursor-pointer"
                        onClick={() => toggleTaskCompletion(task, !task.completed)}
                      >
                        {task.completed ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <Square className="w-5 h-5 text-[var(--text-muted)]" />}
                      </button>
                      <div>
                        <p className={`m-0 text-xs font-bold text-[var(--text-primary)] ${task.completed ? 'line-through' : ''}`}>
                          {task.title}
                        </p>
                        <span className="text-[10px] text-[var(--text-muted)]">{task.subject}</span>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        task.priority === 'High'
                          ? 'bg-rose-500/15 text-rose-500'
                          : 'bg-[var(--brand-soft)] text-[var(--brand-orange)]'
                      }`}
                    >
                      {task.priority}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[var(--text-muted)] py-4 text-center">No pending tasks today 🎉</p>
              )}
            </div>
          </div>

          {/* MY SUBJECTS PROGRESS */}
          <div className="surface p-5 rounded-3xl border border-[var(--border-color)] space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <h3 className="m-0 text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
                My Subjects ({subjects.length})
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {subjects.map((sub) => {
                const pct = Math.round(sub.avg_progress || 0);
                return (
                  <div key={sub.id} className="p-3.5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-input)] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--text-primary)]">{sub.name}</span>
                      <span className="text-xs font-bold text-[var(--brand-orange)]">{pct}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[var(--button-background)] overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'var(--brand-gradient)' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: RECENT MATERIAL */}
        <div className="space-y-6">
          <div className="surface p-5 rounded-3xl border border-[var(--border-color)] space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <h3 className="m-0 text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
                Recent Materials
              </h3>
            </div>

            <div className="space-y-3">
              {recentMaterials.map((mat) => (
                <div
                  key={mat.id}
                  className="flex items-center justify-between p-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--brand-orange)] transition cursor-pointer"
                  onClick={() => setActiveStudyItem(mat)}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-[var(--brand-soft)] text-[var(--brand-orange)]">
                      {mat.material_type === 'video' ? (
                        <Video className="w-4 h-4" />
                      ) : mat.material_type === 'audio' ? (
                        <Headphones className="w-4 h-4" />
                      ) : (
                        <BookOpen className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="m-0 text-xs font-bold text-[var(--text-primary)] truncate">{mat.title}</h4>
                      <p className="m-0 text-[10px] text-[var(--text-muted)]">{mat.subject_name || 'General'} • {mat.topic}</p>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    {mat.progress_percentage || 0}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
