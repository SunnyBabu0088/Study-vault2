import { Check, FolderOpen, Trash2 } from 'lucide-react';
import { useStudy } from '../context/StudyContext';

const filters = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'done', label: 'Done' },
];

export default function Collection() {
  const { filteredTasks, totalCount, openCount, priorityCount, activeFilter, setActiveFilter, toggleTaskCompletion, deleteTask } = useStudy();

  return (
    <section className="surface rounded-[26px] p-5 sm:p-6 dark:bg-[#161e2d] dark:border-[#263244]" aria-labelledby="collection-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="m-0 text-xs font-bold uppercase tracking-[.15em] text-[#5a6478] dark:text-[#94a3b8]">Your collection</p>
          <h2 id="collection-title" className="display-face mt-2 text-[#0f1729] dark:text-[#f8fafc]">
            Study list
          </h2>
        </div>
        <div className="flex rounded-xl bg-[#edeef4] dark:bg-[#1f2937] p-1">
          {filters.map((filter) => (
            <button
              key={filter.value}
              className="filter-btn rounded-lg px-3 py-1.5 text-sm font-bold text-[#0f1729] dark:text-[#f8fafc]"
              type="button"
              aria-pressed={activeFilter === filter.value}
              onClick={() => setActiveFilter(filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {filteredTasks.map((task) => (
          <article
            key={task.id}
            className={`record-card rounded-2xl border border-[#e2e5ef] dark:border-[#263244] bg-white dark:bg-[#161e2d] p-4 ${task.completed ? 'is-complete' : ''}`}
          >
            <div className="flex gap-3">
              <button
                className="grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 border-[#3b52cf] text-[#3b52cf] dark:text-[#60a5fa] dark:border-[#60a5fa]"
                type="button"
                aria-label={task.completed ? 'Mark as open' : 'Mark as done'}
                onClick={() => toggleTaskCompletion(task, !task.completed)}
              >
                <Check className={`h-4 w-4 ${task.completed ? '' : 'hidden'}`} />
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex gap-2">
                  <span className="rounded-full bg-[#eceef8] dark:bg-indigo-950/60 px-2 py-0.5 text-xs font-bold text-[#2e42a8] dark:text-indigo-300">
                    {task.priority || 'Medium'}
                  </span>
                  <span className="rounded-full bg-[#f0f8e4] dark:bg-emerald-950/60 px-2 py-0.5 text-xs font-bold text-[#4a7020] dark:text-emerald-300">
                    {task.subject || 'Study'}
                  </span>
                </div>
                <h3 className="record-title mb-0 mt-2 text-base font-bold text-[#0f1729] dark:text-[#f8fafc]">{task.title}</h3>
                {task.content && <p className="mb-0 mt-1 text-sm text-[#5a6478] dark:text-[#94a3b8]">{task.content}</p>}
              </div>
              <button className="text-[#e04980]" type="button" aria-label="Delete task" onClick={() => deleteTask(task)}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </article>
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <div className="mt-5 rounded-2xl border border-dashed border-[#c8cdd9] dark:border-[#263244] bg-[#f9faff] dark:bg-[#111827] px-5 py-11 text-center">
          <FolderOpen className="mx-auto h-7 w-7 text-[#3b52cf] dark:text-[#60a5fa]" />
          <p className="mb-0 mt-3 font-bold text-[#0f1729] dark:text-[#f8fafc]">Your vault is empty</p>
          <p className="mb-0 mt-1 text-sm text-[#5a6478] dark:text-[#94a3b8]">Add your first study task to begin.</p>
        </div>
      )}

      <p className="mt-3 text-xs text-[#5a6478] dark:text-[#94a3b8]">
        {totalCount} total · {openCount} open · {priorityCount} high priority
      </p>
    </section>
  );
}
