import { LayoutDashboard, MessagesSquare, Rocket, User } from 'lucide-react';
import { useStudy } from '../context/StudyContext';

const navItems = [
  { view: 'vault-view', label: 'Vault', Icon: LayoutDashboard },
  { view: 'messages-view', label: 'Messages', Icon: MessagesSquare },
  { view: 'startup-view', label: 'Startup', Icon: Rocket },
  { view: 'profile-view', label: 'Profile', Icon: User },
];

export default function BottomNav() {
  const { activeView, navigate } = useStudy();

  return (
    <nav
      className="fixed bottom-0 left-0 z-20 w-full border-t border-[#e2e5ef] px-4 py-2 shadow-[0_-8px_26px_rgba(15,23,41,.08)]"
      aria-label="Primary navigation"
    >
      <div className="mx-auto grid max-w-sm grid-cols-4">
        {navItems.map(({ view, label, Icon }) => (
          <button
            key={view}
            className={`nav-button flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold ${activeView === view ? 'is-active' : ''}`}
            type="button"
            aria-label={label}
            onClick={() => navigate(view)}
          >
            <Icon className="h-5 w-5" />
          </button>
        ))}
      </div>
    </nav>
  );
}
