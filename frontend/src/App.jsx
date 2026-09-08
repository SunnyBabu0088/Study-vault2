import { useEffect, useState } from 'react';
import { useStudy } from './context/StudyContext';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import HomeView from './components/HomeView';
import VaultView from './components/VaultView';
import MessagesView from './components/MessagesView';
import StartupView from './components/StartupView';
import ProfileView from './components/ProfileView';
import AiHubView from './components/AiHubView';
import AuthView from './components/AuthView';
import UnifiedCreateModal from './components/UnifiedCreateModal';
import { CallProvider } from './context/CallContext';
import IncomingCall from './components/Call/IncomingCall';
import OutgoingCall from './components/Call/OutgoingCall';
import VoiceCall from './components/Call/VoiceCall';
import VideoCall from './components/Call/VideoCall';
import MinimizedCallBubble from './components/Call/MinimizedCallBubble';

const NAV_ORDER = ['home-view', 'messages-view', 'startup-view', 'vault-view', 'profile-view'];

function AppContent() {
  const {
    activeView,
    ready,
    isAuthenticated,
    authLoading,
    chatOpen,
    isStoryOpen,
    isCreateModalOpen,
    closeCreateModal,
    createModalMedia,
    createModalMode,
    isAiHubOpen,
    closeAiHub
  } = useStudy();

  const [prevView, setPrevView] = useState(activeView);
  const [slideDirection, setSlideDirection] = useState('right');

  useEffect(() => {
    if (activeView !== prevView) {
      const prevIdx = NAV_ORDER.indexOf(prevView);
      const currIdx = NAV_ORDER.indexOf(activeView);
      if (currIdx !== -1 && prevIdx !== -1) {
        setSlideDirection(currIdx >= prevIdx ? 'right' : 'left');
      }
      setPrevView(activeView);
    }
  }, [activeView, prevView]);

  if (!ready || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm font-medium text-[#5a6478]">
        Loading StudyVault…
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 sm:px-7">
        <AuthView />
      </main>
    );
  }

  const isFullChatOpen = activeView === 'messages-view' && chatOpen;
  const hideShellUI = isFullChatOpen || isStoryOpen || isCreateModalOpen || isAiHubOpen;

  return (
    <>
      {isAiHubOpen && <AiHubView onClose={closeAiHub} />}

      <div
        className={`app-shell transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isCreateModalOpen || isAiHubOpen
            ? 'scale-[0.98] opacity-0 p-0 pb-0 min-h-screen overflow-hidden pointer-events-none'
            : hideShellUI
            ? 'p-0 pb-0 min-h-screen overflow-hidden'
            : 'pb-28 opacity-100 blur-none'
        }`}
      >
        {!hideShellUI && <Header />}
        <main className={hideShellUI ? 'w-full h-full p-0 m-0 max-w-none' : 'mx-auto w-full max-w-7xl px-4 pb-6 pt-4 sm:px-7'}>
          <div
            key={activeView}
            className={
              hideShellUI
                ? 'w-full h-full'
                : `view ${slideDirection === 'right' ? 'page-transition-right' : 'page-transition-left'}`
            }
          >
            {activeView === 'home-view' && <HomeView />}
            {activeView === 'messages-view' && <MessagesView />}
            {activeView === 'startup-view' && <StartupView />}
            {activeView === 'vault-view' && <VaultView />}
            {activeView === 'profile-view' && <ProfileView />}
          </div>
        </main>
      </div>

      {!hideShellUI && <BottomNav />}

      <UnifiedCreateModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        initialMedia={createModalMedia}
        defaultMode={createModalMode}
      />

      {/* GLOBAL WEBRTC CALL OVERLAYS */}
      <IncomingCall />
      <OutgoingCall />
      <VoiceCall />
      <VideoCall />
      <MinimizedCallBubble />
    </>
  );
}

export default function App() {
  const { profile } = useStudy();
  return (
    <CallProvider currentUsername={profile?.username}>
      <AppContent />
    </CallProvider>
  );
}

