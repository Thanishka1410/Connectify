import React, { useState } from 'react';
import {
  MessageSquare,
  Users,
  Search,
  Plus,
  Bell,
  Settings,
  LogOut,
  UserPlus,
  CheckCheck,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useSocket } from '../context/SocketContext';
import {
  getConversationTitle,
  getConversationAvatar,
  getOtherMember,
  formatConversationTime,
} from '../utils/helpers';
import UserAvatar from './UserAvatar';

const Sidebar = ({
  onOpenNewChat,
  onOpenNewGroup,
  onOpenProfile,
  onOpenNotifications,
}) => {
  const { user, logout } = useAuth();
  const { isUserOnline } = useSocket();
  const {
    conversations,
    activeConversation,
    selectConversation,
    unreadCounts,
    activeFilter,
    setActiveFilter,
    searchFilter,
    setSearchFilter,
  } = useChat();

  const [notificationCount] = useState(0);

  // Filter conversations
  const filteredConversations = conversations.filter((conv) => {
    // Type filter
    if (activeFilter === 'direct' && conv.type !== 'direct') return false;
    if (activeFilter === 'group' && conv.type !== 'group') return false;

    // Search filter
    if (searchFilter.trim()) {
      const title = getConversationTitle(conv, user?._id).toLowerCase();
      const lastMsgText = conv.lastMessage?.text?.toLowerCase() || '';
      const query = searchFilter.toLowerCase();
      return title.includes(query) || lastMsgText.includes(query);
    }

    return true;
  });

  return (
    <aside className="w-full md:w-80 lg:w-96 h-full flex flex-col bg-white border-r border-slate-200/80 select-none">
      {/* Top Header / Brand */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-accent flex items-center justify-center text-white shadow-md shadow-brand-500/25">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
              Connectify
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-brand-50 text-brand-600 border border-brand-100">
                PRO
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">Real-Time Messaging</p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          <button
            onClick={onOpenNewChat}
            className="p-2 rounded-xl text-slate-600 hover:text-brand-600 hover:bg-brand-50/70 transition-colors"
            title="New Direct Message"
          >
            <UserPlus className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenNewGroup}
            className="p-2 rounded-xl text-slate-600 hover:text-brand-600 hover:bg-brand-50/70 transition-colors"
            title="Create New Group"
          >
            <Users className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenNotifications}
            className="p-2 rounded-xl text-slate-600 hover:text-brand-600 hover:bg-brand-50/70 transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {notificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
            )}
          </button>
        </div>
      </div>

      {/* User Profile Bar */}
      <div className="px-4 py-3 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between">
        <div
          onClick={onOpenProfile}
          className="flex items-center gap-3 cursor-pointer group min-w-0"
        >
          <UserAvatar
            src={user?.avatar}
            name={user?.name}
            size="sm"
            isOnline={true}
          />
          <div className="truncate">
            <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-brand-600 transition-colors">
              {user?.name}
            </p>
            <p className="text-[11px] text-slate-400 truncate">@{user?.username}</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onOpenProfile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
            title="Settings / Edit Profile"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-slate-100">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search conversations or messages..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-100/70 border border-transparent text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
          />
          {searchFilter && (
            <button
              onClick={() => setSearchFilter('')}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center px-3 pt-2 pb-1 gap-1 border-b border-slate-100">
        {[
          { id: 'all', label: 'All' },
          { id: 'direct', label: 'Direct Messages' },
          { id: 'group', label: 'Groups' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeFilter === tab.id
                ? 'bg-brand-50 text-brand-700 shadow-2xs font-semibold'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Search className="w-6 h-6" />
            </div>
            <p className="text-xs font-medium text-slate-600">No conversations found</p>
            <p className="text-[11px] text-slate-400 mt-1">
              {searchFilter
                ? 'Try a different search term.'
                : 'Start a direct chat or create a new group!'}
            </p>
            {!searchFilter && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  onClick={onOpenNewChat}
                  className="px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-medium shadow-xs"
                >
                  New Chat
                </button>
                <button
                  onClick={onOpenNewGroup}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium"
                >
                  New Group
                </button>
              </div>
            )}
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isActive = activeConversation?._id === conv._id;
            const title = getConversationTitle(conv, user?._id);
            const avatar = getConversationAvatar(conv, user?._id);
            const other = conv.type === 'direct' ? getOtherMember(conv, user?._id) : null;
            const isOnline = other ? isUserOnline(other._id) : false;
            const unread = unreadCounts[conv._id] || 0;
            const lastMsg = conv.lastMessage;

            return (
              <div
                key={conv._id}
                onClick={() => selectConversation(conv)}
                className={`flex items-center gap-3 p-3.5 cursor-pointer transition-colors relative ${
                  isActive
                    ? 'bg-brand-50/80 border-r-3 border-brand-600'
                    : 'hover:bg-slate-50'
                }`}
              >
                <UserAvatar
                  src={avatar}
                  name={title}
                  size="md"
                  isOnline={conv.type === 'direct' ? isOnline : false}
                  showBadge={conv.type === 'direct'}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4
                      className={`text-xs font-semibold truncate ${
                        isActive ? 'text-brand-900' : 'text-slate-800'
                      }`}
                    >
                      {title}
                    </h4>
                    {lastMsg && (
                      <span className="text-[10px] text-slate-400 flex-shrink-0 ml-1">
                        {formatConversationTime(lastMsg.createdAt || conv.updatedAt)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-slate-500 truncate max-w-[190px]">
                      {lastMsg ? (
                        lastMsg.deletedAt ? (
                          <span className="italic text-slate-400">Message deleted</span>
                        ) : lastMsg.isSystem ? (
                          <span className="italic text-slate-400">{lastMsg.text}</span>
                        ) : (
                          <>
                            {lastMsg.sender?._id === user?._id && (
                              <span className="font-medium text-slate-600 mr-1">You:</span>
                            )}
                            {lastMsg.text || (lastMsg.attachments?.length ? '📷 Photo' : '')}
                          </>
                        )
                      ) : (
                        <span className="italic text-slate-400">No messages yet</span>
                      )}
                    </p>

                    {unread > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-brand-600 text-white text-[10px] font-bold shadow-xs">
                        {unread > 99 ? '99+' : unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
