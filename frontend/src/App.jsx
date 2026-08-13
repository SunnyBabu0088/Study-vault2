import Header from './components/Header';
import BottomNav from './components/BottomNav';
import VaultView from './components/VaultView';
import MessagesView from './components/MessagesView';
import StartupView from './components/StartupView';
import ProfileView from './components/ProfileView';
import { useStudy } from './context/StudyContext';

export default function App() {
  const { activeView, ready } = useStudy();

  return (
    <div className="app-shell">
      <Header />
      <main className="mx-auto w-full max-w-7xl px-4 pb-6 pt-6 sm:px-7">
        {ready ? (
          <>
            <div className="view">
              {activeView === 'vault-view' && <VaultView />}
              {activeView === 'messages-view' && <MessagesView />}
              {activeView === 'startup-view' && <StartupView />}
              {activeView === 'profile-view' && <ProfileView />}
            </div>
          </>
        ) : (
          <div className="py-24 text-center text-sm text-[#5a6478]">Loading StudyVault…</div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
