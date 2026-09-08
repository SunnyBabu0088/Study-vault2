import { useStudy } from '../context/StudyContext';

const stats = [
  { label: 'Total tasks', key: 'totalCount' },
  { label: 'Open tasks', key: 'openCount' },
  { label: 'High priority', key: 'priorityCount' },
];

export default function StatCards() {
  const { totalCount, openCount, priorityCount } = useStudy();
  const values = { totalCount, openCount, priorityCount };

  return (
    <section className="mt-6 grid gap-3 sm:grid-cols-3" aria-label="Study statistics">
      {stats.map((stat) => (
        <article key={stat.key} className="surface rounded-2xl p-4 dark:bg-[#161e2d] dark:border-[#263244]">
          <p className="m-0 text-xs font-bold uppercase tracking-[.12em] text-[#5a6478] dark:text-[#94a3b8]">{stat.label}</p>
          <p className="m-0 mt-2 text-3xl font-bold text-[#0f1729] dark:text-[#f8fafc]">{values[stat.key]}</p>
        </article>
      ))}
    </section>
  );
}
