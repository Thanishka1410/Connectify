import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import ChatArea from '../components/ChatArea';
import InfoPanel from '../components/InfoPanel';
import EmptyState from '../components/EmptyState';
import CreateGroupModal from '../components/CreateGroupModal';
import NewDirectModal from '../components/NewDirectModal';
import ProfileModal from '../components/ProfileModal';
import NotificationsModal from '../components/NotificationsModal';
import { useChat } from '../context/ChatContext';

const ChatDashboard = () => {
  const { activeConversation, selectConversation, showInfoPanel, setShowInfoPanel } = useChat();

  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isNewGroupOpen, setIsNewGroupOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-slate-100 antialiased font-sans">
      {/* Left Sidebar: hidden on mobile if active conversation is selected */}
      <div
        className={`${
          activeConversation ? 'hidden md:flex' : 'flex'
        } w-full md:w-auto h-full flex-shrink-0`}
      >
        <Sidebar
          onOpenNewChat={() => setIsNewChatOpen(true)}
          onOpenNewGroup={() => setIsNewGroupOpen(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
        />
      </div>

      {/* Center Chat Area: shown on desktop always, on mobile only if conversation selected */}
      <div
        className={`${
          !activeConversation ? 'hidden md:flex' : 'flex'
        } flex-1 h-full min-w-0`}
      >
        {activeConversation ? (
          <ChatArea onBack={() => selectConversation(null)} />
        ) : (
          <EmptyState
            onNewChat={() => setIsNewChatOpen(true)}
            onNewGroup={() => setIsNewGroupOpen(true)}
          />
        )}
      </div>

      {/* Right Info Panel: toggled via showInfoPanel */}
      {activeConversation && showInfoPanel && (
        <div className="fixed md:static inset-0 md:inset-auto z-40 md:z-auto h-full flex-shrink-0">
          <InfoPanel onClose={() => setShowInfoPanel(false)} />
        </div>
      )}

      {/* Modals */}
      <CreateGroupModal
        isOpen={isNewGroupOpen}
        onClose={() => setIsNewGroupOpen(false)}
      />

      <NewDirectModal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
    </div>
  );
};

export default ChatDashboard;
