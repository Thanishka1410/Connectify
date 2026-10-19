import React, { useState, useEffect } from 'react';
import { X, Search, MessageSquare, ArrowRight } from 'lucide-react';
import { userAPI } from '../services/api';
import { useChat } from '../context/ChatContext';
import UserAvatar from './UserAvatar';

const NewDirectModal = ({ isOpen, onClose }) => {
  const { startDirectChat } = useChat();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setUsers([]);
      return;
    }

    const fetchUsers = async () => {
      try {
        setLoading(true);
        const res = await userAPI.search(searchQuery);
        if (res.data.success) {
          setUsers(res.data.users || []);
        }
      } catch (err) {
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };

    const timeout = setTimeout(fetchUsers, 200);
    return () => clearTimeout(timeout);
  }, [searchQuery, isOpen]);

  if (!isOpen) return null;

  const handleSelectUser = async (user) => {
    await startDirectChat(user._id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-800">New Direct Message</h3>
              <p className="text-xs text-slate-500">Find any member to start a 1-on-1 chat</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              autoFocus
              placeholder="Search by name, @username, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading members...</div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              No matching members found.
            </div>
          ) : (
            users.map((user) => (
              <div
                key={user._id}
                onClick={() => handleSelectUser(user)}
                className="flex items-center justify-between p-3.5 hover:bg-slate-50 cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <UserAvatar
                    src={user.avatar}
                    name={user.name}
                    size="md"
                    isOnline={user.isOnline}
                  />
                  <div className="truncate">
                    <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-brand-600 transition-colors">
                      {user.name}
                    </p>
                    <p className="text-xs text-slate-400">@{user.username}</p>
                    {user.bio && (
                      <p className="text-xs text-slate-500 truncate mt-0.5">{user.bio}</p>
                    )}
                  </div>
                </div>
                <button className="opacity-0 group-hover:opacity-100 p-2 rounded-xl bg-brand-50 text-brand-600 transition-all">
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NewDirectModal;
