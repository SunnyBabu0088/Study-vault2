import { BookOpen, Send } from 'lucide-react';
import { useStudy } from '../context/StudyContext';

export default function Header() {
  const { navigate } = useStudy();

  return (
    <header className="w-full px-4 pt-4 sm:px-7 sm:pt-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="grid h-11 w-11 place-items-center rounded-2xl bg-[#0f1729] text-white shadow-lg shadow-[#0f1729]/15"
            aria-hidden="true"
          >
            <BookOpen className="h-5 w-5" />
          </div>
          <p className="m-0 font-bold tracking-tight">StudyVault</p>
        </div>
        <button
          className="flex items-center gap-2 rounded-full px-4 py-2.5 font-bold transition hover:-translate-y-0.5"
          type="button"
          onClick={() => navigate('messages-view')}
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
